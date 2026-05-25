"use client";

import { motion } from "motion/react";
import { useState, type ReactNode } from "react";

/**
 * Burgundy wax seal — used as the primary CTA on the claim page. Press
 * triggers a brief scale animation and bumps a counter so callers can chain
 * onClick. The visual: a textured circle with an embossed "P" monogram by
 * default (overrideable via `glyph`).
 */
export function WaxSeal({
  size = 120,
  glyph = "P",
  onClick,
  disabled,
  pressing,
  children,
}: {
  size?: number;
  glyph?: string;
  onClick?: () => void;
  disabled?: boolean;
  pressing?: boolean;
  children?: ReactNode;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative inline-flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-stamp)]/30 rounded-full"
      style={{ width: size, height: size }}
      aria-label="Break the seal"
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          scale: pressing ? [1, 0.92, 1.04, 1] : hover ? 1.03 : 1,
          rotate: pressing ? [0, -3, 6, 0] : 0,
        }}
        transition={{
          duration: pressing ? 0.32 : 0.2,
          ease: pressing ? [0.34, 1.56, 0.64, 1] : "easeOut",
        }}
        style={{
          background: `radial-gradient(circle at 30% 28%,
            #B83746 0%,
            #8B2538 35%,
            #6D1B2C 70%,
            #4F1320 100%)`,
          boxShadow: `
            inset 0 6px 12px rgba(255, 200, 200, 0.18),
            inset 0 -8px 16px rgba(20, 5, 8, 0.45),
            0 4px 8px rgba(45, 5, 10, 0.4),
            0 12px 32px rgba(45, 5, 10, 0.25)
          `,
        }}
      >
        {/* Decorative outer ring of wax drips */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const cx = 50 + Math.cos(a) * 47;
            const cy = 50 + Math.sin(a) * 47;
            const r = 1.6 + (i % 3) * 0.4;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="#4F1320"
                opacity={0.55}
              />
            );
          })}
        </svg>
        {/* Monogram */}
        <div
          className="absolute inset-0 flex items-center justify-center display"
          style={{
            color: "#3B0E1A",
            fontSize: size * 0.46,
            fontWeight: 700,
            fontVariationSettings: "'opsz' 144, 'wght' 700, 'WONK' 1",
            textShadow: "0 -1px 1px rgba(255,200,200,0.25), 0 1px 1px rgba(20,5,8,0.6)",
            letterSpacing: "0.02em",
          }}
        >
          {glyph}
        </div>
      </motion.div>
      {/* Caption underneath, optional */}
      {children ? (
        <div
          className="absolute -bottom-9 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.28em] text-[var(--color-stamp)] whitespace-nowrap"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {children}
        </div>
      ) : null}
    </button>
  );
}
