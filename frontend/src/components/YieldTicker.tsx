"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Monetary ticker showing principal + accrued yield. Two modes:
 *
 *   - LIVE mode (preferred):  pass `liveAccruedUsd`; ticker shows `baseUsd +
 *     liveAccruedUsd` exactly. Caller is responsible for refreshing this on
 *     a poll cadence — typically the page polls `/api/gifts/[id]` every 6s
 *     and computes accrued yield from on-chain `totalSwapVolume`.
 *
 *   - APPROXIMATE mode:  if `liveAccruedUsd` is omitted, the ticker fakes a
 *     gentle compound curve at `aprBps` (default 580 = 5.8%) so the digits
 *     visibly tick. Used on the landing page where we have no specific gift.
 */
export function YieldTicker({
  baseUsd,
  liveAccruedUsd,
  aprBps = 580,
  intervalMs = 1500,
  className = "",
}: {
  baseUsd: number;
  /** Real on-chain accrued LP fees in USD. If provided, takes precedence. */
  liveAccruedUsd?: number;
  /** Approximation rate when liveAccruedUsd is unavailable. */
  aprBps?: number;
  intervalMs?: number;
  className?: string;
}) {
  const [now, setNow] = useState<number>(() => Date.now());
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    if (liveAccruedUsd !== undefined) return; // live mode — no internal interval
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, liveAccruedUsd]);

  let value: number;
  if (liveAccruedUsd !== undefined) {
    value = baseUsd + liveAccruedUsd;
  } else {
    const elapsedSeconds = (now - startRef.current) / 1000;
    const yieldUsd =
      baseUsd * (Math.exp((aprBps / 10_000) * (elapsedSeconds / (365 * 24 * 3600))) - 1);
    value = baseUsd + yieldUsd;
  }

  // 4 decimals when accrued < $1 (sub-dollar visibility); 2 dp otherwise
  const accrued = value - baseUsd;
  const display =
    Math.abs(accrued) < 1 ? value.toFixed(4) : value.toFixed(2);
  return (
    <span
      className={`tabular text-[var(--color-stamp)] inline-block ${className}`}
      style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
    >
      ${display}
    </span>
  );
}
