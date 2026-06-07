import { type AbiEvent, parseAbiItem } from "viem";
import {
  CHAINS,
  GIFT_HOOK,
  GIFT_RECIPIENT,
  GIFT_SENDER,
  HOOK_BASE_FEE,
  HOOK_TRANSIT_FEE,
  POOL_ID,
  POOL_MANAGER,
  type ChainKey,
} from "./config.js";

/** A decoded, display-ready event record. */
export type EventRecord = {
  /** Stable dedup key. */
  id: string;
  chain: ChainKey;
  block: bigint;
  kind: string;
  /** Short headline fields, already formatted for the terminal. */
  fields: string[];
  txHash: string;
  /** Block explorer link to the tx. */
  url: string;
};

/**
 * Each subscription = an address + event ABI + (optional) extra indexed args to
 * filter on. The gift events carry a leading sacrificial `address` field (the
 * Lasna data-shift workaround); we just decode and ignore it.
 */
type Sub = {
  chain: ChainKey;
  address: `0x${string}`;
  event: AbiEvent;
  args?: Record<string, unknown>;
  kind: string;
  format: (args: Record<string, unknown>) => string[];
};

// ── formatting helpers ────────────────────────────────────────────────────────
const short = (hex: unknown, head = 10, tail = 6): string => {
  const s = String(hex ?? "");
  return s.length > head + tail ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;
};

/** 6-decimal stable → "$1.0023". */
const usd = (raw: unknown): string => {
  try {
    return `$${(Number(BigInt(String(raw))) / 1e6).toFixed(4)}`;
  } catch {
    return `$${String(raw)}`;
  }
};

/** Dynamic fee (hundredths of a bip) → "0.30% (transit premium)". */
const feeLabel = (raw: unknown): string => {
  const fee = Number(raw ?? 0);
  const pct = (fee / 10_000).toFixed(2);
  if (fee >= HOOK_TRANSIT_FEE) return `${pct}% (transit premium)`;
  if (fee <= HOOK_BASE_FEE) return `${pct}% (baseline)`;
  return `${pct}%`;
};

/** abs() of a v4 signed swap delta, as a USD-ish stable amount. */
const absUsd = (raw: unknown): string => {
  try {
    const v = BigInt(String(raw));
    return usd(v < 0n ? -v : v);
  } catch {
    return String(raw);
  }
};

// ── event signatures ──────────────────────────────────────────────────────────
const evDeposited = parseAbiItem(
  "event GiftDeposited(address sender, bytes32 giftId, bytes32 commitment, uint128 amount0, uint128 amount1, uint32 dstChainId, uint64 expiresAt)",
);
const evUnwound = parseAbiItem(
  "event GiftUnwound(address discard, bytes32 giftId, address recipient, uint128 principalReturned, uint128 yieldReturned, uint32 dstChainId)",
);
const evCancelled = parseAbiItem("event GiftCancelled(address discard, bytes32 giftId)");
const evExpired = parseAbiItem("event GiftExpired(address discard, bytes32 giftId)");
const evMirrored = parseAbiItem(
  "event GiftMirrored(address discard, bytes32 giftId, bytes32 commitment, uint128 expectedAmount, uint64 expiresAt)",
);
const evClaimed = parseAbiItem(
  "event GiftClaimed(address discard, bytes32 giftId, address claimer)",
);
const evDelivered = parseAbiItem(
  "event GiftDelivered(address discard, bytes32 giftId, address recipient, uint128 amount)",
);
const evSwap = parseAbiItem(
  "event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)",
);

// ── subscriptions ─────────────────────────────────────────────────────────────
export const SUBSCRIPTIONS: Sub[] = [
  {
    chain: "unichain",
    address: GIFT_SENDER,
    event: evDeposited,
    kind: "deposit",
    format: (a) => [
      `gift ${short(a.giftId)}`,
      `${usd(BigInt(String(a.amount0 ?? 0)) + BigInt(String(a.amount1 ?? 0)))} principal`,
      `→ chain ${a.dstChainId}`,
    ],
  },
  {
    chain: "unichain",
    address: GIFT_SENDER,
    event: evUnwound,
    kind: "unwound",
    format: (a) => [
      `gift ${short(a.giftId)}`,
      `principal ${usd(a.principalReturned)}`,
      `yield ${usd(a.yieldReturned)}`,
      `→ ${short(a.recipient)}`,
    ],
  },
  {
    chain: "unichain",
    address: GIFT_SENDER,
    event: evCancelled,
    kind: "cancelled",
    format: (a) => [`gift ${short(a.giftId)}`],
  },
  {
    chain: "unichain",
    address: GIFT_SENDER,
    event: evExpired,
    kind: "expired",
    format: (a) => [`gift ${short(a.giftId)}`],
  },
  {
    chain: "unichain",
    address: POOL_MANAGER,
    event: evSwap,
    args: { id: POOL_ID },
    kind: "swap",
    format: (a) => [
      `vol ${absUsd(a.amount0)}`,
      `fee ${feeLabel(a.fee)}`,
      `tick ${a.tick}`,
    ],
  },
  {
    chain: "base",
    address: GIFT_RECIPIENT,
    event: evMirrored,
    kind: "mirror",
    format: (a) => [`gift ${short(a.giftId)}`, `expected ${usd(a.expectedAmount)}`],
  },
  {
    chain: "base",
    address: GIFT_RECIPIENT,
    event: evClaimed,
    kind: "claim",
    format: (a) => [`gift ${short(a.giftId)}`, `by ${short(a.claimer)}`],
  },
  {
    chain: "base",
    address: GIFT_RECIPIENT,
    event: evDelivered,
    kind: "deliver",
    format: (a) => [`gift ${short(a.giftId)}`, `${usd(a.amount)} → ${short(a.recipient)}`],
  },
];

/** Build an EventRecord from a viem log + its subscription. */
export function toRecord(
  sub: Sub,
  log: {
    args?: Record<string, unknown>;
    blockNumber?: bigint | null;
    transactionHash?: string | null;
    logIndex?: number | null;
  },
): EventRecord {
  const args = log.args ?? {};
  const tx = log.transactionHash ?? "0x";
  return {
    id: `${tx}:${log.logIndex ?? 0}`,
    chain: sub.chain,
    block: log.blockNumber ?? 0n,
    kind: sub.kind,
    fields: sub.format(args),
    txHash: tx,
    url: `${CHAINS[sub.chain].explorer}/tx/${tx}`,
  };
}
