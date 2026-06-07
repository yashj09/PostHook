import pc from "picocolors";
import {
  CHAINS,
  GIFT_HOOK,
  GIFT_RECIPIENT,
  GIFT_SENDER,
  POOL_MANAGER,
  type ChainKey,
} from "./config.js";
import type { EventRecord } from "./events.js";

// Per-event-kind color + glyph, echoing the app's postal palette.
const KIND: Record<string, { color: (s: string) => string; glyph: string; label: string }> = {
  deposit: { color: pc.magenta, glyph: "✉", label: "DEPOSIT " },
  mirror: { color: pc.blue, glyph: "⇄", label: "MIRROR  " },
  swap: { color: pc.yellow, glyph: "↻", label: "SWAP    " },
  claim: { color: pc.green, glyph: "✂", label: "CLAIM   " },
  unwound: { color: pc.cyan, glyph: "↩", label: "UNWOUND " },
  deliver: { color: pc.green, glyph: "✓", label: "DELIVER " },
  cancelled: { color: pc.red, glyph: "✕", label: "CANCEL  " },
  expired: { color: pc.red, glyph: "⌛", label: "EXPIRED " },
};

const CHAIN_TAG: Record<ChainKey, (s: string) => string> = {
  unichain: (s) => pc.bgMagenta(pc.black(` ${s} `)),
  base: (s) => pc.bgBlue(pc.white(` ${s} `)),
};

const clock = (): string => {
  // HH:MM:SS without Date.now()-style flakiness in tests; fine at runtime.
  const d = new Date();
  return d.toTimeString().slice(0, 8);
};

export function banner(): void {
  const line = pc.dim("─".repeat(74));
  console.log("");
  console.log(pc.bold(pc.red("  POSTHOOK · on-chain indexer")) + pc.dim("  (read-only observer)"));
  console.log(line);
  console.log(
    `  ${CHAIN_TAG.unichain("UNICHAIN SEPOLIA")}  ${pc.dim("GiftSender")} ${pc.white(GIFT_SENDER)}`,
  );
  console.log(`  ${" ".repeat(18)}  ${pc.dim("GiftHook  ")} ${pc.white(GIFT_HOOK)} ${pc.dim("(dynamic fee)")}`);
  console.log(`  ${" ".repeat(18)}  ${pc.dim("PoolMgr   ")} ${pc.white(POOL_MANAGER)}`);
  console.log(
    `  ${CHAIN_TAG.base("BASE SEPOLIA    ")}  ${pc.dim("Recipient ")} ${pc.white(GIFT_RECIPIENT)}`,
  );
  console.log(line);
  console.log(
    pc.dim(
      `  watching: deposits · mirrors · swaps (live fee) · claims · unwinds · deliveries`,
    ),
  );
  console.log("");
}

export function divider(text: string): void {
  const pad = "─".repeat(Math.max(2, 70 - text.length));
  console.log(pc.dim(`── ${text} ${pad}`));
}

export function printEvent(e: EventRecord): void {
  const meta = KIND[e.kind] ?? { color: pc.white, glyph: "•", label: e.kind.toUpperCase().padEnd(8) };
  const tag = CHAIN_TAG[e.chain](e.chain === "unichain" ? "UNI " : "BASE");
  const head = meta.color(`${meta.glyph} ${meta.label}`);
  const body = e.fields.join(pc.dim(" · "));
  console.log(
    `${pc.dim(clock())} ${tag} ${head} ${body}  ${pc.dim(`#${e.block} ${e.url}`)}`,
  );
}

export function note(msg: string): void {
  console.log(pc.dim(`         ${msg}`));
}

/** A compact running tally line, reprinted as events stream. */
export function tally(t: {
  gifts: number;
  swaps: number;
  volumeUsd: number;
  delivered: number;
  lastFeePct: string | null;
}): void {
  console.log(
    pc.dim("         ") +
      pc.bold(
        `Σ gifts ${t.gifts} · swaps ${t.swaps} · volume $${t.volumeUsd.toFixed(2)} · delivered ${t.delivered}` +
          (t.lastFeePct ? ` · fee ${t.lastFeePct}` : ""),
      ),
  );
}
