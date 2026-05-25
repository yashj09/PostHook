"use client";

import { useEffect, useRef, useState } from "react";

/** Vintage carbon-paper-style log of relayer activity. */
type Entry = {
  ts: number;
  kind: "header" | "deposit" | "claim" | "unwind" | "deliver" | "status" | "tx" | "info" | "warn";
  text: string;
};

function classifyLine(line: string): Entry["kind"] {
  if (line.startsWith("[deposit")) return "deposit" as const;
  if (line.startsWith("[claim")) return "claim" as const;
  if (line.startsWith("[unwound")) return "unwind" as const;
  if (line.startsWith("Relayer started")) return "header" as const;
  if (line.startsWith("status ")) return "status" as const;
  if (line.startsWith("transactionHash")) return "tx" as const;
  return "info" as const;
}

const accent: Record<Entry["kind"], string> = {
  header: "var(--color-stamp)",
  deposit: "var(--color-stamp)",
  claim: "var(--color-foliage)",
  unwind: "var(--color-brass)",
  deliver: "var(--color-foliage)",
  status: "var(--color-foliage)",
  tx: "var(--color-ink-muted)",
  info: "var(--color-ink-muted)",
  warn: "var(--color-stamp)",
};

export function RelayLedger() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [connected, setConnected] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/relayer-stream");
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.kind === "line") {
          const text = msg.line as string;
          setEntries((prev) =>
            [
              ...prev,
              { ts: Date.now(), kind: classifyLine(text), text },
            ].slice(-300),
          );
        } else if (msg.kind === "wait") {
          setEntries((prev) =>
            [
              ...prev,
              { ts: Date.now(), kind: "warn" as const, text: `[idle] ${msg.message}` },
            ].slice(-300),
          );
        }
      } catch {
        /* swallow */
      }
    };
    return () => es.close();
  }, []);

  // auto-scroll
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <div className="bg-[var(--color-paper-warm)] border border-[var(--color-rule)]">
      <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-rule)] bg-[var(--color-paper-deep)]">
        <div className="flex items-center gap-3">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              background: connected ? "var(--color-foliage)" : "var(--color-stamp)",
              boxShadow: connected ? "0 0 6px var(--color-foliage)" : undefined,
            }}
          />
          <span
            className="text-[10px] uppercase tracking-[0.32em] font-semibold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Sorting room · live
          </span>
        </div>
        <span
          className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-ink-muted)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          /api/relayer-stream
        </span>
      </header>
      <div
        ref={containerRef}
        className="h-[280px] overflow-y-auto px-4 py-3 text-[12px] leading-[1.6]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {entries.length === 0 && (
          <div
            className="text-[var(--color-ink-muted)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Waiting for the postman… run `bash contracts/relayer/relay.sh` from the contracts folder.
          </div>
        )}
        {entries.map((e, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-[10px] tabular text-[var(--color-ink-muted)] mt-[2px] shrink-0">
              {new Date(e.ts).toLocaleTimeString("en-GB", { hour12: false })}
            </span>
            <span style={{ color: accent[e.kind] }} className="break-all">
              {e.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
