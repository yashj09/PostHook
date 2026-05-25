"use client";

const colors = {
  unichain: { bg: "var(--color-paper-deep)", fg: "var(--color-ink)" },
  base: { bg: "#1B2A4E", fg: "var(--color-paper)" },
  reactive: { bg: "var(--color-stamp)", fg: "var(--color-paper)" },
} as const;

export function ChainBadge({
  chain,
  size = "md",
}: {
  chain: keyof typeof colors;
  size?: "sm" | "md";
}) {
  const px = size === "sm" ? "px-2 py-[3px]" : "px-3 py-1";
  const text = size === "sm" ? "text-[10px]" : "text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${px} ${text} uppercase tracking-[0.22em] font-semibold rounded-sm`}
      style={{
        fontFamily: "var(--font-body)",
        background: colors[chain].bg,
        color: colors[chain].fg,
      }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {chain === "unichain" ? "Unichain Sepolia" : chain === "base" ? "Base Sepolia" : "Reactive Lasna"}
    </span>
  );
}
