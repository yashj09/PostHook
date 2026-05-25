"use client";

import type { ReactNode } from "react";
import { Stamp } from "./Stamp";
import { Postmark } from "./Postmark";

/**
 * The signature visual. A cream postal envelope with perforated top + bottom
 * edges, a hand-printed FROM/TO ledger, two vintage stamps in the upper
 * right (source and destination chains), an optional postmark at the
 * bottom-right, and a slot for a wax seal or denomination plaque centered.
 *
 * The card is intentionally not "interactive" — pages compose it inside a
 * frame and add controls beside or beneath. Keep it picture-like.
 */
export function GiftCard({
  fromLine,
  toLine,
  denomination,
  growthLine,
  postmarkCity,
  postmarkDate,
  sourceChain = "unichain",
  destinationChain = "base",
  centerSlot,
  className = "",
}: {
  fromLine: string;
  toLine: string;
  denomination?: string;
  growthLine?: string;
  postmarkCity?: string;
  postmarkDate?: string;
  sourceChain?: "unichain" | "base" | "reactive";
  destinationChain?: "unichain" | "base" | "reactive";
  centerSlot?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full max-w-[560px] aspect-[1.78/1] ${className}`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Soft drop shadow under the envelope */}
      <div
        aria-hidden
        className="absolute -inset-2 -z-10"
        style={{
          background: "radial-gradient(ellipse at center, rgba(45,30,15,0.25) 0%, transparent 65%)",
          filter: "blur(18px)",
          transform: "translateY(8px) scale(0.92)",
        }}
      />

      {/* The envelope body */}
      <div
        className="perf-y relative w-full h-full bg-[var(--color-paper)] overflow-hidden"
        style={{
          padding: "28px 32px",
          boxShadow: "var(--shadow-paper)",
          backgroundImage: `
            radial-gradient(rgba(45, 30, 15, 0.04) 1px, transparent 1px),
            linear-gradient(135deg, rgba(45, 30, 15, 0.025) 0%, transparent 70%)
          `,
          backgroundSize: "3px 3px, 100% 100%",
        }}
      >
        {/* Brass hairline frame */}
        <div
          aria-hidden
          className="absolute inset-3 pointer-events-none"
          style={{
            border: "1px solid var(--color-rule)",
            borderRadius: 1,
            opacity: 0.65,
          }}
        />

        {/* Header — AIRMAIL style label */}
        <div className="flex items-start justify-between relative">
          <div>
            <div
              className="text-[9px] uppercase tracking-[0.4em] font-semibold text-[var(--color-stamp)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Posthook · By Air
            </div>
            <div
              className="display mt-1 text-[var(--color-ink)] leading-none"
              style={{ fontSize: 22, fontVariationSettings: "'opsz' 144, 'wght' 500, 'WONK' 1" }}
            >
              Gift Voucher No.
              <span
                className="ml-2 tabular text-[var(--color-stamp)]"
                style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 18 }}
              >
                #
                {Math.floor(Math.random() * 9000 + 1000)
                  .toString()
                  .slice(0, 4)}
              </span>
            </div>
          </div>

          {/* Stamps in the upper-right corner, slightly overlapping */}
          <div className="flex gap-2 -mt-1 -mr-1">
            <Stamp chain={sourceChain} denomination={denomination ?? "$"} jitter={-2.5} delay={120} />
            <Stamp chain={destinationChain} denomination="DLY" jitter={3.2} delay={260} />
          </div>
        </div>

        {/* Brass divider */}
        <div className="rule-brass my-4" />

        {/* From/To ledger */}
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[var(--color-ink-soft)]">
          <span
            className="text-[10px] uppercase tracking-[0.32em] pt-1 text-[var(--color-stamp)]"
            style={{ fontWeight: 600 }}
          >
            From
          </span>
          <span
            className="display text-[var(--color-ink)] truncate"
            style={{ fontSize: 18, fontVariationSettings: "'opsz' 144, 'wght' 500" }}
          >
            {fromLine}
          </span>

          <span
            className="text-[10px] uppercase tracking-[0.32em] pt-1 text-[var(--color-stamp)]"
            style={{ fontWeight: 600 }}
          >
            To
          </span>
          <span
            className="display text-[var(--color-ink)] truncate"
            style={{ fontSize: 18, fontVariationSettings: "'opsz' 144, 'wght' 500" }}
          >
            {toLine}
          </span>
        </div>

        {/* Center slot — denomination plaque, wax seal, or yield ticker */}
        {centerSlot ? (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-9 flex items-center justify-center">
            {centerSlot}
          </div>
        ) : null}

        {/* Growth line, lower left */}
        {growthLine ? (
          <div
            className="absolute bottom-5 left-8 text-[10px] uppercase tracking-[0.28em] text-[var(--color-ink-muted)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {growthLine}
          </div>
        ) : null}

        {/* Postmark, lower right */}
        {postmarkCity && postmarkDate ? (
          <div className="absolute bottom-3 right-4">
            <Postmark city={postmarkCity} date={postmarkDate} jitter={-9} size={92} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
