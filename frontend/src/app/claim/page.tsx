"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ClaimIndexPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [secret, setSecret] = useState("");

  const valid = /^0x[0-9a-fA-F]{64}$/.test(id.trim());

  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const url = `/claim/${id.trim()}${secret.trim() ? `?secret=${encodeURIComponent(secret.trim())}` : ""}`;
    router.push(url);
  }

  return (
    <main className="relative flex-1 w-full overflow-hidden">
      <div className="mx-auto w-full max-w-[1240px] px-8 pt-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <span>←</span> Back to lobby
        </Link>
      </div>

      <section
        className="mx-auto w-full max-w-[760px] px-8 pt-12 pb-24 animate-paper-rise"
        style={{ "--rise-delay": "60ms" } as React.CSSProperties}
      >
        <div
          className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-stamp)] font-semibold mb-3"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Counter IV · Pickup Window
        </div>
        <h1
          className="display text-[var(--color-ink)] leading-[0.95]"
          style={{
            fontSize: "clamp(40px, 5.4vw, 76px)",
            fontVariationSettings: "'opsz' 144, 'wght' 380, 'WONK' 1",
            letterSpacing: "-0.02em",
          }}
        >
          Got a tracking number?
        </h1>
        <p
          className="mt-6 text-[15px] leading-[1.55] text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Drop the voucher's tracking number below — the four-word phrase too if your sender shared it.
          We&rsquo;ll set you up at the seal-breaking station.
        </p>

        <form onSubmit={go} className="mt-12 space-y-8">
          <Field label="Tracking number" hint="A 0x-prefixed 64-character hex string.">
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="0x69ec15136ea52c8e305dc014…"
              className="w-full bg-transparent border-b border-[var(--color-ink-muted)] focus:border-[var(--color-stamp)] focus:outline-none text-[var(--color-ink)] py-2"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
              }}
            />
          </Field>

          <Field label="Secret phrase" hint="Optional. You can also enter it on the next page.">
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Postcard-Heath-Ember-Cobalt"
              className="display w-full bg-transparent border-b border-[var(--color-ink-muted)] focus:border-[var(--color-stamp)] focus:outline-none text-[var(--color-ink)] py-2"
              style={{
                fontSize: 22,
                fontVariationSettings: "'opsz' 144, 'wght' 460",
              }}
            />
          </Field>

          <div className="rule-brass" />

          <button
            type="submit"
            disabled={!valid}
            className="px-7 py-3 bg-[var(--color-stamp)] text-[var(--color-paper)] uppercase tracking-[0.28em] text-[12px] font-semibold rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-transform"
            style={{ fontFamily: "var(--font-body)" }}
          >
            To the pickup window →
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-stamp)] font-semibold mb-2"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {label}
      </div>
      {children}
      {hint ? (
        <div
          className="text-[11px] text-[var(--color-ink-muted)] mt-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}
