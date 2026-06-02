import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem, type PublicClient } from "viem";
import { unichainSepolia, baseSepolia } from "@/lib/chains";
import { addresses } from "@/lib/contracts";

/**
 * RPC-derived sorting-room feed. The local sorting room tails the relayer's log
 * file over SSE (`/api/relayer-stream`); that doesn't work on a serverless
 * deploy where no relayer runs. This route instead reconstructs the same ledger
 * from real on-chain events via `getLogs`, so the deployed sorting room shows
 * genuine cross-chain activity. The line strings it returns deliberately match
 * the relayer's prefixes (`[deposit`, `[claim`, `[unwound`, plus `[mirror` /
 * `[deliver`) so RelayLedger's `classifyLine` colours them identically.
 *
 * Serverless-safe: pure viem reads, no filesystem.
 */
export const dynamic = "force-dynamic";

const senderClient = createPublicClient({ chain: unichainSepolia, transport: http() });
const recipientClient = createPublicClient({ chain: baseSepolia, transport: http() });

// Per-chain getLogs limits on the public RPCs (each call must stay under the
// cap): Unichain Sepolia allows 10k blocks/query, Base Sepolia only 2k. We page
// through a few windows so we still cover a reasonable slice of history.
const CHUNK = { unichain: 9_500n, base: 2_000n } as const;
const WINDOWS = { unichain: 2n, base: 8n } as const; // total span ≈ 19k / 16k blocks

const short = (hex: string, head = 10, tail = 6) =>
  hex.length > head + tail ? `${hex.slice(0, head)}…${hex.slice(-tail)}` : hex;

// Event signatures (each carries the sacrificial leading `address` field from
// the Lasna data-shift workaround — see CLAUDE.md / GiftSender.sol).
const evDeposited = parseAbiItem(
  "event GiftDeposited(address sender, bytes32 giftId, bytes32 commitment, uint128 amount0, uint128 amount1, uint32 dstChainId, uint64 expiresAt)",
);
const evUnwound = parseAbiItem(
  "event GiftUnwound(address discard, bytes32 giftId, address recipient, uint128 principalReturned, uint128 yieldReturned, uint32 dstChainId)",
);
const evMirrored = parseAbiItem(
  "event GiftMirrored(address discard, bytes32 giftId, bytes32 commitment, uint128 expectedAmount, uint64 expiresAt)",
);
const evClaimed = parseAbiItem(
  "event GiftClaimed(address discard, bytes32 giftId, address claimer)",
);
const evDelivered = parseAbiItem(
  "event GiftDelivered(address discard, bytes32 giftId, address recipient, uint128 amount)",
);

type Line = { id: string; block: number; line: string };

export async function GET() {
  const lines: Line[] = [];

  try {
    const [uLatest, bLatest] = await Promise.all([
      senderClient.getBlockNumber(),
      recipientClient.getBlockNumber(),
    ]);

    const sender = addresses.unichainSepolia.giftSender!;
    const recipient = addresses.baseSepolia.giftRecipient!;

    // Page backwards through `windows` chunks of `chunk` blocks each, staying
    // under the RPC's per-query cap. Errors on any window are swallowed.
    const getLogsPaged = async (
      client: PublicClient,
      address: `0x${string}`,
      evt: ReturnType<typeof parseAbiItem>,
      latest: bigint,
      chunk: bigint,
      windows: bigint,
    ) => {
      const out: Awaited<ReturnType<PublicClient["getLogs"]>> = [];
      let to = latest;
      for (let w = 0n; w < windows && to > 0n; w++) {
        const from = to > chunk ? to - chunk : 0n;
        try {
          const logs = await client.getLogs({
            address,
            event: evt as never,
            fromBlock: from,
            toBlock: to,
          });
          out.push(...logs);
        } catch {
          /* skip this window */
        }
        to = from > 0n ? from - 1n : 0n;
      }
      return out;
    };

    const u = (evt: ReturnType<typeof parseAbiItem>) =>
      getLogsPaged(senderClient, sender, evt, uLatest, CHUNK.unichain, WINDOWS.unichain);
    const b = (evt: ReturnType<typeof parseAbiItem>) =>
      getLogsPaged(recipientClient, recipient, evt, bLatest, CHUNK.base, WINDOWS.base);

    const [deposits, unwinds, mirrors, claims, delivers] = await Promise.all([
      u(evDeposited),
      u(evUnwound),
      b(evMirrored),
      b(evClaimed),
      b(evDelivered),
    ]);

    const push = (
      logs: readonly unknown[],
      fmt: (a: Record<string, unknown>) => string,
    ) => {
      for (const raw of logs) {
        const l = raw as {
          args?: Record<string, unknown>;
          blockNumber?: bigint;
          transactionHash?: string;
          logIndex?: number;
        };
        lines.push({
          id: `${l.transactionHash}:${l.logIndex}`,
          block: Number(l.blockNumber ?? 0n),
          line: fmt(l.args ?? {}),
        });
      }
    };

    push(deposits, (a) =>
      `[deposit→mint] giftId=${short(String(a.giftId))} commitment=${short(String(a.commitment))} amount0=${a.amount0} amount1=${a.amount1}`,
    );
    push(mirrors, (a) =>
      `[mirror→base] giftId=${short(String(a.giftId))} expected=${a.expectedAmount}`,
    );
    push(claims, (a) =>
      `[claim→unwind] giftId=${short(String(a.giftId))} claimer=${short(String(a.claimer))}`,
    );
    push(unwinds, (a) =>
      `[unwound→deliver] giftId=${short(String(a.giftId))} principal=${a.principalReturned} yield=${a.yieldReturned}`,
    );
    push(delivers, (a) =>
      `[deliver✓] giftId=${short(String(a.giftId))} recipient=${short(String(a.recipient))} amount=${a.amount}`,
    );

    lines.sort((x, y) => x.block - y.block);
  } catch (e) {
    return NextResponse.json(
      { lines: [], error: (e as Error).message ?? "rpc error" },
      { status: 200 },
    );
  }

  return NextResponse.json({ lines });
}
