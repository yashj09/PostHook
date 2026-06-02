import Link from "next/link";
import { GiftCard } from "@/components/GiftCard";
import { ChainBadge } from "@/components/ChainBadge";
import { YieldTicker } from "@/components/YieldTicker";
import { demoGift } from "@/lib/demo";

export default function Home() {
  return (
    <main className="relative flex-1 w-full overflow-hidden">
      {/* Hero */}
      <section className="mx-auto w-full max-w-[1240px] px-8 pt-16 pb-12 grid grid-cols-12 gap-8">
        {/* Left column — masthead + value prop */}
        <div className="col-span-12 lg:col-span-7 animate-paper-rise" style={{ "--rise-delay": "60ms" } as React.CSSProperties}>
          <div className="flex items-center gap-3 mb-10">
            <Mark />
            <span
              className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-stamp)] font-semibold"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Posthook · Est. 2026
            </span>
          </div>

          <h1
            className="display text-[var(--color-ink)] leading-[0.95]"
            style={{
              fontSize: "clamp(54px, 7.6vw, 112px)",
              fontVariationSettings: "'opsz' 144, 'wght' 380, 'WONK' 1, 'SOFT' 50",
              letterSpacing: "-0.02em",
            }}
          >
            <span className="block">Send a gift</span>
            <span className="block italic" style={{ fontVariationSettings: "'opsz' 144, 'wght' 380, 'WONK' 1, 'SOFT' 100" }}>
              that <span className="text-[var(--color-stamp)]">grows</span>
            </span>
            <span className="block">in the post.</span>
          </h1>

          <p
            className="mt-8 max-w-[520px] text-[18px] leading-[1.55] text-[var(--color-ink-soft)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Every voucher rides a Uniswap v4 liquidity position. While it sits unclaimed, the LP earns
            real swap-fee yield. Recipient breaks the wax seal on{" "}
            <em className="not-italic font-semibold text-[var(--color-ink)]">whichever chain they prefer</em> — Reactive
            handles the crossing.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/send"
              className="group inline-flex items-center gap-3 px-6 py-3.5 bg-[var(--color-stamp)] text-[var(--color-paper)] uppercase tracking-[0.28em] text-[12px] font-semibold rounded-sm transition-transform hover:-translate-y-0.5 hover:shadow-lg"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Post a Voucher
              <svg viewBox="0 0 24 12" className="w-6 h-3">
                <path
                  d="M0 6 L 22 6 M 16 1 L 22 6 L 16 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
            <Link
              href="/claim"
              className="text-[12px] uppercase tracking-[0.28em] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
              style={{ fontFamily: "var(--font-body)" }}
            >
              · or claim one
            </Link>
          </div>

          {demoGift ? (
            <div className="mt-5">
              <Link
                href={`/sent/${demoGift.giftId}?secret=${encodeURIComponent(demoGift.secret)}`}
                className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.28em] text-[var(--color-stamp)] hover:text-[var(--color-wax)] transition-colors"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Try the demo — watch a live gift grow
                <span aria-hidden>→</span>
              </Link>
            </div>
          ) : null}

          <div className="rule-brass mt-14 mb-6" />

          <dl className="grid grid-cols-3 gap-6 max-w-[520px]">
            <Stat
              label="Underlying"
              value="Uniswap v4"
              caption="hook'd LP position"
            />
            <Stat
              label="Bridge"
              value="Reactive"
              caption="cross-chain RSC"
            />
            <Stat
              label="Stable APR"
              value="≈ 5.8%"
              caption="USDC ↔ USDT"
            />
          </dl>
        </div>

        {/* Right column — featured gift card visual */}
        <div className="col-span-12 lg:col-span-5 flex flex-col items-end justify-center pt-6 lg:pt-0 relative">
          {/* Decorative postmark behind */}
          <div className="absolute right-0 top-2 -z-0 opacity-50 hidden md:block">
            <PostmarkSvg />
          </div>

          <div
            className="animate-paper-rise relative z-10"
            style={{ "--rise-delay": "240ms" } as React.CSSProperties}
          >
            <GiftCard
              fromLine="Alice  ·  alice.eth"
              toLine="Bob  ·  basename.bob"
              denomination="$50"
              growthLine="Earning ≈ 5.8% while in transit"
              postmarkCity="Unichain Sep."
              postmarkDate="25 · MAY"
              sourceChain="unichain"
              destinationChain="base"
              centerSlot={
                <div className="bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-4 py-1.5 flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-[var(--color-ink-muted)]">
                    Now worth
                  </span>
                  <YieldTicker baseUsd={50.0} aprBps={580} />
                </div>
              }
            />
          </div>

          <div className="flex gap-2 mt-6 mr-2">
            <ChainBadge chain="unichain" size="sm" />
            <span className="text-[var(--color-ink-muted)]">→</span>
            <ChainBadge chain="reactive" size="sm" />
            <span className="text-[var(--color-ink-muted)]">→</span>
            <ChainBadge chain="base" size="sm" />
          </div>
        </div>
      </section>

      {/* Editorial three-column "how it works" */}
      <section className="mx-auto w-full max-w-[1240px] px-8 mt-12 mb-24">
        <div className="rule-brass mb-10" />
        <div className="grid grid-cols-12 gap-x-8 gap-y-10">
          <div className="col-span-12 md:col-span-3">
            <span
              className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-stamp)] font-semibold"
              style={{ fontFamily: "var(--font-body)" }}
            >
              How it travels
            </span>
            <h2
              className="display mt-3 text-[var(--color-ink)] leading-tight"
              style={{ fontSize: 34, fontVariationSettings: "'opsz' 144, 'wght' 460" }}
            >
              Four hands, one envelope.
            </h2>
          </div>

          {[
            {
              n: "I",
              title: "You post.",
              body: "Pick an amount, type a name, write a 4-word secret. We mint a real Uniswap LP position on Unichain Sepolia. The voucher's principal sits inside it.",
            },
            {
              n: "II",
              title: "It earns.",
              body: "While the gift waits, the LP collects swap fees. The voucher's worth ticks up, hour by hour, like a small compound clock inside the envelope.",
            },
            {
              n: "III",
              title: "They claim.",
              body: "Recipient opens the link on Base Sepolia, types the secret, presses the wax seal. Reactive sees the claim and dispatches the unwind on Unichain.",
            },
          ].map((step, i) => (
            <article
              key={step.n}
              className="col-span-12 md:col-span-3 animate-paper-rise"
              style={{ "--rise-delay": `${320 + i * 90}ms` } as React.CSSProperties}
            >
              <div
                className="display text-[var(--color-stamp)] mb-3"
                style={{
                  fontSize: 56,
                  lineHeight: 1,
                  fontVariationSettings: "'opsz' 144, 'wght' 360, 'WONK' 1",
                }}
              >
                {step.n}.
              </div>
              <h3
                className="display text-[var(--color-ink)]"
                style={{ fontSize: 22, fontVariationSettings: "'opsz' 144, 'wght' 500" }}
              >
                {step.title}
              </h3>
              <p
                className="mt-2 text-[15px] leading-[1.55] text-[var(--color-ink-soft)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Mark() {
  return (
    <div
      className="w-9 h-9 flex items-center justify-center bg-[var(--color-stamp)]"
      style={{
        clipPath:
          "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
      }}
    >
      <span
        className="display text-[var(--color-paper)] leading-none"
        style={{
          fontSize: 18,
          fontVariationSettings: "'opsz' 144, 'wght' 700, 'WONK' 1",
        }}
      >
        P
      </span>
    </div>
  );
}

function PostmarkSvg() {
  return (
    <svg viewBox="0 0 320 320" className="w-[320px] h-[320px]">
      <circle cx="160" cy="160" r="140" fill="none" stroke="var(--color-stamp)" strokeWidth="2" />
      <circle cx="160" cy="160" r="120" fill="none" stroke="var(--color-stamp)" strokeWidth="0.8" strokeDasharray="3 3" />
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M 60 ${160 + (i - 1.5) * 18}
              q 50 14, 100 0
              q 50 -14, 100 0`}
          stroke="var(--color-stamp)"
          strokeWidth="1"
          fill="none"
          opacity="0.4"
        />
      ))}
      <text
        x="160"
        y="80"
        textAnchor="middle"
        fill="var(--color-stamp)"
        opacity="0.6"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          letterSpacing: "0.4em",
          fontWeight: 600,
        }}
      >
        UHI · IX · 2026
      </text>
    </svg>
  );
}

function Stat({
  label,
  value,
  caption,
}: {
  label: string;
  value: React.ReactNode;
  caption?: string;
}) {
  return (
    <div>
      <div
        className="text-[9px] uppercase tracking-[0.3em] text-[var(--color-ink-muted)]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {label}
      </div>
      <div
        className="display mt-1 text-[var(--color-ink)] leading-tight"
        style={{ fontSize: 22, fontVariationSettings: "'opsz' 144, 'wght' 500" }}
      >
        {value}
      </div>
      {caption ? (
        <div
          className="text-[11px] text-[var(--color-ink-muted)] mt-0.5"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="mx-auto w-full max-w-[1240px] px-8 pb-10 pt-4 flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <span className="uppercase tracking-[0.28em]">UHI9 · Hookathon Submission</span>
      <span>
        Built with v4 hooks · Reactive Smart Contracts · CCTP · sealed by wax · {new Date().getFullYear()}
      </span>
    </footer>
  );
}
