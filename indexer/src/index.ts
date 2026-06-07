import { createPublicClient, http, type PublicClient } from "viem";
import {
  BACKFILL_WINDOWS,
  CHAINS,
  POLL_MS,
  type ChainKey,
} from "./config.js";
import { SUBSCRIPTIONS, toRecord, type EventRecord } from "./events.js";
import { banner, divider, note, printEvent, tally } from "./render.js";

const clients: Record<ChainKey, PublicClient> = {
  unichain: createPublicClient({ transport: http(CHAINS.unichain.rpc) }),
  base: createPublicClient({ transport: http(CHAINS.base.rpc) }),
};

// Dedup across backfill + every poll.
const seen = new Set<string>();

// Running tally for the on-camera B-roll line.
const stats = { gifts: 0, swaps: 0, volumeUsd: 0, delivered: 0, lastFeePct: null as string | null };

function updateStats(e: EventRecord) {
  if (e.kind === "deposit") stats.gifts += 1;
  if (e.kind === "deliver") stats.delivered += 1;
  if (e.kind === "swap") {
    stats.swaps += 1;
    // fields[0] = "vol $X.XXXX", fields[1] = "fee 0.30% (...)"
    const vol = Number(e.fields[0]?.replace(/[^0-9.]/g, "") ?? 0);
    if (!Number.isNaN(vol)) stats.volumeUsd += vol;
    const m = e.fields[1]?.match(/([\d.]+%)/);
    if (m) stats.lastFeePct = m[1];
  }
}

/**
 * Fetch one subscription's logs over [from,to], swallowing RPC errors so a
 * single bad query never takes the indexer down.
 */
async function fetchLogs(sub: (typeof SUBSCRIPTIONS)[number], from: bigint, to: bigint) {
  try {
    const logs = await clients[sub.chain].getLogs({
      address: sub.address,
      event: sub.event,
      args: sub.args as never,
      fromBlock: from,
      toBlock: to,
    });
    return logs.map((l) => toRecord(sub, l as never));
  } catch {
    return [];
  }
}

/** Page back `windows` chunks of `chunk` blocks each (under the RPC cap). */
async function backfillChain(chain: ChainKey, latest: bigint): Promise<EventRecord[]> {
  const { logChunk } = CHAINS[chain];
  const subs = SUBSCRIPTIONS.filter((s) => s.chain === chain);
  const out: EventRecord[] = [];
  let to = latest;
  for (let w = 0n; w < BACKFILL_WINDOWS && to > 0n; w++) {
    const from = to > logChunk ? to - logChunk : 0n;
    const batches = await Promise.all(subs.map((s) => fetchLogs(s, from, to)));
    for (const b of batches) out.push(...b);
    to = from > 0n ? from - 1n : 0n;
  }
  return out;
}

const sortAndEmit = (records: EventRecord[]) => {
  records
    .filter((r) => !seen.has(r.id))
    .sort((a, b) => Number(a.block - b.block))
    .forEach((r) => {
      seen.add(r.id);
      updateStats(r);
      printEvent(r);
    });
};

async function safeBlockNumber(chain: ChainKey): Promise<bigint | null> {
  try {
    return await clients[chain].getBlockNumber();
  } catch {
    return null;
  }
}

async function main() {
  banner();

  // ── Backfill ────────────────────────────────────────────────────────────────
  divider("backfill · recent on-chain history");
  const cursors: Record<ChainKey, bigint> = { unichain: 0n, base: 0n };
  for (const chain of ["unichain", "base"] as ChainKey[]) {
    const latest = await safeBlockNumber(chain);
    if (latest === null) {
      note(`${CHAINS[chain].label}: RPC unreachable — skipping backfill, will retry live`);
      continue;
    }
    cursors[chain] = latest;
    const records = await backfillChain(chain, latest);
    sortAndEmit(records);
  }
  tally(stats);
  divider("live · tailing new blocks");

  // ── Live tail ─────────────────────────────────────────────────────────────--
  const pollChain = async (chain: ChainKey) => {
    const latest = await safeBlockNumber(chain);
    if (latest === null) {
      note(`${CHAINS[chain].label}: rpc retry…`);
      return;
    }
    const from = cursors[chain] + 1n;
    if (latest < from) return; // no new blocks
    const subs = SUBSCRIPTIONS.filter((s) => s.chain === chain);
    const { logChunk } = CHAINS[chain];
    // Walk forward in chunks in case we fell behind.
    let lo = from;
    const fresh: EventRecord[] = [];
    while (lo <= latest) {
      const hi = lo + logChunk - 1n > latest ? latest : lo + logChunk - 1n;
      const batches = await Promise.all(subs.map((s) => fetchLogs(s, lo, hi)));
      for (const b of batches) fresh.push(...b);
      lo = hi + 1n;
    }
    cursors[chain] = latest;
    const before = stats.swaps + stats.gifts + stats.delivered;
    sortAndEmit(fresh);
    const after = stats.swaps + stats.gifts + stats.delivered;
    if (after > before) tally(stats);
  };

  // Stagger so the two chains don't hammer their RPCs in the same instant.
  setInterval(() => void pollChain("unichain"), POLL_MS);
  setTimeout(() => setInterval(() => void pollChain("base"), POLL_MS), POLL_MS / 2);
}

main().catch((e) => {
  console.error("indexer fatal:", e);
  process.exit(1);
});
