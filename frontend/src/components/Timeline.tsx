"use client";

import type { ReactNode } from "react";

export type TimelineStep = {
  label: string;
  caption?: string;
  state: "done" | "active" | "pending";
  meta?: ReactNode;
};

/**
 * Postal-tracking style vertical timeline. Steps render left-aligned with
 * brass dot markers and hairline rule connectors. "Active" pulses softly.
 */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative space-y-5">
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        const stateColor =
          s.state === "done"
            ? "var(--color-foliage)"
            : s.state === "active"
              ? "var(--color-stamp)"
              : "var(--color-rule)";
        return (
          <li key={i} className="relative pl-9">
            {/* Connector */}
            {!isLast ? (
              <span
                aria-hidden
                className="absolute left-[10px] top-4 bottom-[-20px] w-px"
                style={{ background: "var(--color-rule)" }}
              />
            ) : null}
            {/* Marker */}
            <span
              aria-hidden
              className="absolute left-1 top-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: s.state === "pending" ? "transparent" : stateColor,
                border: `1.5px solid ${stateColor}`,
                animation:
                  s.state === "active"
                    ? "seal-press 1500ms ease-in-out infinite alternate"
                    : undefined,
              }}
            >
              {s.state === "done" ? (
                <svg viewBox="0 0 12 12" className="w-3 h-3">
                  <path
                    d="M2 6 L 5 9 L 10 3"
                    stroke="var(--color-paper)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
            {/* Label */}
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div
                  className="display text-[var(--color-ink)]"
                  style={{ fontSize: 17, fontVariationSettings: "'opsz' 144, 'wght' 500" }}
                >
                  {s.label}
                </div>
                {s.caption ? (
                  <div
                    className="text-[12px] text-[var(--color-ink-muted)] mt-0.5"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {s.caption}
                  </div>
                ) : null}
              </div>
              {s.meta ? <div className="text-right">{s.meta}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
