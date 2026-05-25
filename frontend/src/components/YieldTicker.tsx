"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A flip-clock style monetary ticker. Smoothly increases from `from` to a
 * computed value over a window of `intervalMs` milliseconds, with the
 * implication that real LP fees are accruing. Pure visual fluff for the
 * pitch — actual on-chain reads come from the dashboard's gift state.
 */
export function YieldTicker({
  baseUsd,
  aprBps = 580, // 5.8% APR-ish for a stable pool with reasonable volume
  intervalMs = 4000,
  className = "",
}: {
  /** Principal in USD (e.g. 50.0) */
  baseUsd: number;
  aprBps?: number;
  intervalMs?: number;
  className?: string;
}) {
  const [now, setNow] = useState<number>(() => Date.now());
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const elapsedSeconds = (now - startRef.current) / 1000;
  // continuous-compound approximation; overall this is a vibe, not finance
  const yieldUsd = baseUsd * (Math.exp((aprBps / 10_000) * (elapsedSeconds / (365 * 24 * 3600))) - 1);
  const value = baseUsd + yieldUsd;

  const display = value.toFixed(2);
  return (
    <span
      className={`tabular text-[var(--color-stamp)] inline-block ${className}`}
      style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
    >
      ${display}
    </span>
  );
}
