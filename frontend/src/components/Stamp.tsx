"use client";

import type { ReactNode } from "react";

type ChainKind = "unichain" | "base" | "reactive";

const motifs: Record<ChainKind, ReactNode> = {
  unichain: (
    // A horse beneath a small sun — riffing on Unichain's Uniswap heritage
    <svg viewBox="0 0 60 36" className="h-9 w-15" aria-hidden>
      <circle cx="46" cy="9" r="3.5" fill="#7A1F2B" opacity="0.85" />
      <path
        d="M8 26 Q 14 18, 22 22 T 38 23 Q 44 23, 50 28"
        stroke="#7A1F2B"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* A simple horse silhouette */}
      <path
        d="M14 28 L 14 22 Q 14 18 18 18 L 26 18 Q 27 16 30 16 L 34 16 L 36 14 L 38 16 L 38 18 L 38 22 L 40 24 L 40 28 L 38 28 L 37 24 L 24 24 L 22 28 L 20 28 L 18 24 L 16 24 L 16 28 Z"
        fill="#7A1F2B"
      />
    </svg>
  ),
  base: (
    // Stylized wave + lighthouse for Base
    <svg viewBox="0 0 60 36" className="h-9 w-15" aria-hidden>
      <path
        d="M5 28 Q 10 24 16 26 T 26 26 T 36 26 T 46 26 T 56 26"
        stroke="#7A1F2B"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M3 23 Q 8 19 14 21 T 24 21 T 34 21 T 44 21 T 54 21"
        stroke="#7A1F2B"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.75"
      />
      {/* Lighthouse */}
      <path d="M44 8 L 44 17 L 49 17 L 49 8 Z" fill="#7A1F2B" />
      <path d="M43 8 L 50 8 L 50 6 L 43 6 Z" fill="#7A1F2B" />
      <circle cx="46.5" cy="4.5" r="1.6" fill="#7A1F2B" />
    </svg>
  ),
  reactive: (
    // Lightning + a clock face — reactive's CRON + dispatch motif
    <svg viewBox="0 0 60 36" className="h-9 w-15" aria-hidden>
      <circle cx="20" cy="18" r="9" stroke="#7A1F2B" strokeWidth="1.4" fill="none" />
      <path
        d="M20 12 L 20 18 L 24 21"
        stroke="#7A1F2B"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M40 6 L 36 18 L 42 18 L 38 30"
        stroke="#7A1F2B"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
};

const chainLabels: Record<ChainKind, string> = {
  unichain: "Unichain",
  base: "Base",
  reactive: "Reactive",
};

export function Stamp({
  chain,
  denomination,
  jitter,
  className = "",
  delay = 0,
}: {
  chain: ChainKind;
  denomination?: string;
  /** rotation in degrees, e.g. -2.4 */
  jitter?: number;
  className?: string;
  delay?: number;
}) {
  const j = jitter ?? -1.4;
  return (
    <div
      className={`animate-stamp-drop relative inline-block ${className}`}
      style={
        {
          "--jitter": `${j}deg`,
          "--stamp-delay": `${delay}ms`,
          transform: `rotate(${j}deg)`,
        } as React.CSSProperties
      }
    >
      <div
        className="stamp-edge bg-[var(--color-paper-warm)]"
        style={{
          padding: "10px 12px",
          boxShadow: "var(--shadow-stamp)",
        }}
      >
        <div className="border border-[var(--color-stamp)]/25 px-3 py-2 flex flex-col items-center gap-1">
          {motifs[chain]}
          <span
            className="text-[8px] uppercase tracking-[0.18em] font-semibold text-[var(--color-stamp)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {chainLabels[chain]}
          </span>
          {denomination ? (
            <span
              className="display text-base leading-none text-[var(--color-stamp)]"
              style={{ fontVariationSettings: "'opsz' 144, 'wght' 600" }}
            >
              {denomination}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
