"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Global navigation bar. Rendered on every route from the root layout.
 *
 * Mirrors the letterpress masthead: the hexagon "P" mark + wordmark on the
 * left double as the home link; the right-hand counter links use the same
 * small-caps idiom as the in-page section eyebrows. The active route is
 * inked in stamp burgundy via `usePathname()`.
 */
const links = [
  { href: "/send", label: "Send" },
  { href: "/claim", label: "Claim" },
  { href: "/sortingroom", label: "Sorting Room" },
  { href: "/about", label: "About" },
] as const;

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--color-rule)]/60">
      <nav className="mx-auto w-full max-w-[1240px] px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group" aria-label="Posthook — home">
          <Mark />
          <span
            className="text-[11px] uppercase tracking-[0.4em] text-[var(--color-ink)] font-semibold group-hover:text-[var(--color-stamp)] transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Posthook
          </span>
        </Link>

        <div className="flex items-center gap-6 sm:gap-8">
          {links.map((link) => {
            // Exact match for the home-adjacent roots; prefix match so that
            // e.g. /claim/<giftId> still highlights "Claim".
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`text-[11px] uppercase tracking-[0.3em] transition-colors ${
                  active
                    ? "text-[var(--color-stamp)]"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                }`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

/** The hexagonal wax-stamp "P" brand glyph (matches the landing masthead). */
function Mark() {
  return (
    <div
      className="w-8 h-8 flex items-center justify-center bg-[var(--color-stamp)]"
      style={{
        clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
      }}
    >
      <span
        className="display text-[var(--color-paper)] leading-none"
        style={{
          fontSize: 16,
          fontVariationSettings: "'opsz' 144, 'wght' 700, 'WONK' 1",
        }}
      >
        P
      </span>
    </div>
  );
}
