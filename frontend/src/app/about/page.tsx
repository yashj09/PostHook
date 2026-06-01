import type { Metadata } from "next";
import { ChainBadge } from "@/components/ChainBadge";
import { Timeline } from "@/components/Timeline";
import { addresses, giftPoolKey } from "@/lib/contracts";
import { unichainSepolia, baseSepolia } from "@/lib/chains";

export const metadata: Metadata = {
  title: "About — Posthook",
  description:
    "What's in the envelope: the three-chain architecture, the deployed contracts, and an honest note on the bridge.",
};

/**
 * The /about dossier. Deliberately honest: it documents the real deployed
 * topology AND the caveat that the Reactive RSC bridge is unreliable on Lasna,
 * so a bash relayer is the load-bearing path today (see "A note on the bridge").
 * Per CLAUDE.md, pitch materials must disclose this rather than overclaim.
 */

// Reactive Lasna is not a wallet chain (users never connect to it), so its
// address lives here rather than in lib/contracts.ts. Pinned from CLAUDE.md.
const REACTIVE_LASNA = {
  giftReactive: "0xc1fC884999997bbdD30B92E61a0b9851F3444F40",
  explorer: "https://lasna.reactscan.net",
} as const;

const uniscan = unichainSepolia.blockExplorers!.default.url;
const basescan = baseSepolia.blockExplorers!.default.url;

type Row = {
  contract: string;
  chain: "unichain" | "base" | "reactive";
  address?: string;
  explorer: string;
  note?: string;
};

const rows: Row[] = [
  { contract: "GiftSender", chain: "unichain", address: addresses.unichainSepolia.giftSender, explorer: uniscan, note: "owns the LP NFT" },
  { contract: "GiftHook", chain: "unichain", address: addresses.unichainSepolia.giftHook, explorer: uniscan, note: "v4 hook · gates + telemetry" },
  { contract: "PoolManager", chain: "unichain", address: addresses.unichainSepolia.poolManager, explorer: uniscan, note: "canonical Uniswap v4" },
  { contract: "PositionManager", chain: "unichain", address: addresses.unichainSepolia.positionManager, explorer: uniscan, note: "canonical Uniswap v4" },
  { contract: "MockUSDT", chain: "unichain", address: addresses.unichainSepolia.usdt, explorer: uniscan, note: "test stable" },
  { contract: "GiftRecipient", chain: "base", address: addresses.baseSepolia.giftRecipient, explorer: basescan, note: "pre-funded USDC for demo" },
  { contract: "USDC", chain: "base", address: addresses.baseSepolia.usdc, explorer: basescan, note: "delivered to recipient" },
  { contract: "GiftReactive", chain: "reactive", address: REACTIVE_LASNA.giftReactive, explorer: REACTIVE_LASNA.explorer, note: "RSC · subscribed, see note below" },
];

export default function AboutPage() {
  return (
    <main className="relative flex-1 w-full overflow-hidden">
      {/* Masthead */}
      <section
        className="mx-auto w-full max-w-[1240px] px-8 pt-12 pb-4 animate-paper-rise"
        style={{ "--rise-delay": "60ms" } as React.CSSProperties}
      >
        <div
          className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-stamp)] font-semibold mb-3"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Colophon · Dossier
        </div>
        <h1
          className="display text-[var(--color-ink)] leading-[0.95]"
          style={{
            fontSize: "clamp(40px, 5.4vw, 76px)",
            fontVariationSettings: "'opsz' 144, 'wght' 380, 'WONK' 1",
            letterSpacing: "-0.02em",
          }}
        >
          What&rsquo;s in the envelope.
        </h1>
        <p
          className="mt-6 max-w-[640px] text-[16px] leading-[1.6] text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Posthook is a DeFi gift card. A sender deposits two stables into a
          Uniswap&nbsp;v4 hook&rsquo;d liquidity position on Unichain Sepolia.
          While the gift sits unclaimed, the position earns real swap-fee yield —
          the voucher grows in transit. The recipient claims it on a{" "}
          <em className="not-italic font-semibold text-[var(--color-ink)]">different chain</em>{" "}
          (Base Sepolia) by revealing a four-word secret. Reactive Smart
          Contracts watch for the claim and dispatch the unwind back on Unichain.
        </p>
      </section>

      {/* Three-chain state machine */}
      <section
        className="mx-auto w-full max-w-[1240px] px-8 pt-8 pb-4 animate-paper-rise"
        style={{ "--rise-delay": "140ms" } as React.CSSProperties}
      >
        <div className="rule-brass mb-10" />
        <div className="grid grid-cols-12 gap-x-8 gap-y-10">
          <div className="col-span-12 md:col-span-3">
            <div
              className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-stamp)] font-semibold mb-3"
              style={{ fontFamily: "var(--font-body)" }}
            >
              The route
            </div>
            <h2
              className="display text-[var(--color-ink)] leading-tight"
              style={{ fontSize: 30, fontVariationSettings: "'opsz' 144, 'wght' 460" }}
            >
              One state machine, three chains.
            </h2>
            <div className="mt-6 flex flex-col gap-2 items-start">
              <ChainBadge chain="unichain" size="sm" />
              <span className="text-[var(--color-ink-muted)] pl-3">↓</span>
              <ChainBadge chain="reactive" size="sm" />
              <span className="text-[var(--color-ink-muted)] pl-3">↓</span>
              <ChainBadge chain="base" size="sm" />
            </div>
          </div>

          <div className="col-span-12 md:col-span-5">
            <div
              className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-ink-muted)] mb-4"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Sender side · Unichain Sepolia
            </div>
            <Timeline
              steps={[
                { label: "Deposited", caption: "depositGift → LP minted, principal locked", state: "done" },
                { label: "Claimed", caption: "Reactive (or relayer) signals the claim", state: "done" },
                { label: "Unwound", caption: "position burned, stables released", state: "done" },
                { label: "Cancelled / Expired → Refunded", caption: "sender's escape hatches", state: "pending" },
              ]}
            />
          </div>

          <div className="col-span-12 md:col-span-4">
            <div
              className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-ink-muted)] mb-4"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Recipient side · Base Sepolia
            </div>
            <Timeline
              steps={[
                { label: "Mirrored", caption: "gift entry created on Base", state: "done" },
                { label: "Claimed", caption: "secret revealed, commitment matched", state: "done" },
                { label: "Delivered", caption: "USDC transferred to recipient", state: "done" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Deployed addresses */}
      <section
        className="mx-auto w-full max-w-[1240px] px-8 pt-10 pb-4 animate-paper-rise"
        style={{ "--rise-delay": "220ms" } as React.CSSProperties}
      >
        <div className="rule-brass mb-10" />
        <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
          <h2
            className="display text-[var(--color-ink)] leading-tight"
            style={{ fontSize: 30, fontVariationSettings: "'opsz' 144, 'wght' 460" }}
          >
            Deployed on testnet.
          </h2>
          <div
            className="text-[11px] text-[var(--color-ink-muted)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Pool: USDC/USDT · fee {giftPoolKey.fee} · tickSpacing {giftPoolKey.tickSpacing} · range [{giftPoolKey.tickLower}, {giftPoolKey.tickUpper}]
          </div>
        </div>

        <div className="border-t border-[var(--color-rule)]">
          {rows.map((r) => (
            <AddressRow key={`${r.chain}-${r.contract}`} row={r} />
          ))}
        </div>
      </section>

      {/* The honest caveat */}
      <section
        className="mx-auto w-full max-w-[1240px] px-8 pt-10 pb-4 animate-paper-rise"
        style={{ "--rise-delay": "300ms" } as React.CSSProperties}
      >
        <div className="rule-brass mb-10" />
        <div className="grid grid-cols-12 gap-x-8 gap-y-6">
          <div className="col-span-12 md:col-span-3">
            <div
              className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-stamp)] font-semibold"
              style={{ fontFamily: "var(--font-body)" }}
            >
              In the open
            </div>
            <h2
              className="display mt-3 text-[var(--color-ink)] leading-tight"
              style={{ fontSize: 30, fontVariationSettings: "'opsz' 144, 'wght' 460" }}
            >
              A note on the bridge.
            </h2>
          </div>

          <div className="col-span-12 md:col-span-9">
            <div className="border-l-2 border-[var(--color-stamp)] pl-6 flex flex-col gap-4">
              <p
                className="text-[15px] leading-[1.65] text-[var(--color-ink-soft)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                The Reactive Smart Contract topology is real: <code className="text-[var(--color-stamp)]">GiftReactive</code> is
                deployed on Reactive Lasna and subscribed to the sender&rsquo;s and
                recipient&rsquo;s events. But Lasna&rsquo;s relayer shifts the first 32
                bytes off <code>LogRecord.data</code> when it feeds events into{" "}
                <code>react()</code>, which made the RSC bridge unreliable. We worked
                around it with a sacrificial <code>address discard</code> field on every
                subscribed event — but it&rsquo;s still flaky.
              </p>
              <p
                className="text-[15px] leading-[1.65] text-[var(--color-ink-soft)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                So the <em className="not-italic font-semibold text-[var(--color-ink)]">load-bearing
                bridge today is <code>contracts/relayer/relay.sh</code></em> — a
                transparent bash watcher that tails both chains and calls the{" "}
                <code>admin*</code> functions directly. The{" "}
                <a href="/sortingroom" className="text-[var(--color-stamp)] underline underline-offset-2">sorting room</a>{" "}
                shows it working line by line, in real time.
              </p>
              <p
                className="text-[15px] leading-[1.65] text-[var(--color-ink-soft)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Cross-chain delivery is likewise a stub: <code>GiftRecipient</code> is
                pre-funded with USDC on Base and transfers from its own balance on
                claim. Real CCTP wiring (<code>depositForBurn</code> → attestation →{" "}
                <code>receiveMessage</code>) is designed but not yet wired.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function AddressRow({ row }: { row: Row }) {
  const href = row.address ? `${row.explorer}/address/${row.address}` : undefined;
  const short = row.address
    ? `${row.address.slice(0, 10)}…${row.address.slice(-8)}`
    : "—";
  return (
    <div className="grid grid-cols-12 gap-4 items-center py-4 border-b border-[var(--color-rule)]">
      <div className="col-span-12 sm:col-span-3">
        <div
          className="display text-[var(--color-ink)]"
          style={{ fontSize: 17, fontVariationSettings: "'opsz' 144, 'wght' 500" }}
        >
          {row.contract}
        </div>
        {row.note ? (
          <div
            className="text-[11px] text-[var(--color-ink-muted)] mt-0.5"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {row.note}
          </div>
        ) : null}
      </div>
      <div className="col-span-6 sm:col-span-3">
        <ChainBadge chain={row.chain} size="sm" />
      </div>
      <div className="col-span-6 sm:col-span-6 text-right sm:text-left">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-stamp)] underline underline-offset-2 decoration-[var(--color-rule)] hover:decoration-[var(--color-stamp)] transition-colors break-all"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {short} ↗
          </a>
        ) : (
          <span
            className="text-[13px] text-[var(--color-ink-muted)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {short}
          </span>
        )}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="mx-auto w-full max-w-[1240px] px-8 pb-10 pt-12 flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <span className="uppercase tracking-[0.28em]">UHI9 · Hookathon Submission</span>
      <span>Built with v4 hooks · Reactive Smart Contracts · sealed by wax</span>
    </footer>
  );
}
