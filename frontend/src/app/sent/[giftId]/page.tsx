"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { GiftCard } from "@/components/GiftCard";
import { Timeline, type TimelineStep } from "@/components/Timeline";
import { YieldTicker } from "@/components/YieldTicker";
import { RelayLedger } from "@/components/RelayLedger";

type GiftState = {
  giftId: string;
  senderSide: {
    sender: string;
    commitment: string;
    liquidityShare: string;
    amount0Provided: string;
    amount1Provided: string;
    expiresAt: number;
    dstChainId: number;
    state: number;
    stateName: string;
  } | null;
  recipientSide: {
    commitment: string;
    expectedAmount: string;
    expiresAt: number;
    claimedBy: string;
    state: number;
    stateName: string;
  } | null;
  yieldData: {
    totalLiquidity: string;
    totalSwapVolume: string;
    feeBps: number;
    principalRaw: string;
    accruedFeesRaw: string;
    principalUsd: number;
    accruedFeesUsd: number;
  } | null;
};

function buildTimeline(state: GiftState | null): TimelineStep[] {
  const senderState = state?.senderSide?.stateName ?? "None";
  const recipState = state?.recipientSide?.stateName ?? "None";

  const stamp = (cond: boolean, active: boolean): "done" | "active" | "pending" =>
    cond ? "done" : active ? "active" : "pending";

  const deposited =
    senderState === "Deposited" ||
    senderState === "Claimed" ||
    senderState === "Unwound" ||
    senderState === "Cancelled" ||
    senderState === "Refunded" ||
    senderState === "Expired";
  const mirrored =
    recipState === "Mirrored" || recipState === "Claimed" || recipState === "Delivered";
  const claimed = recipState === "Claimed" || recipState === "Delivered";
  const unwound =
    senderState === "Unwound" || senderState === "Refunded";
  const delivered = recipState === "Delivered";

  return [
    {
      label: "Posted",
      caption: "GiftSender · Unichain Sepolia",
      state: stamp(deposited, true),
    },
    {
      label: "Mirrored on Base",
      caption: "GiftRecipient · adminMintGiftEntry",
      state: stamp(mirrored, deposited),
    },
    {
      label: "Seal broken",
      caption: deposited && !claimed ? "Awaiting recipient…" : "GiftRecipient · claimGift",
      state: stamp(claimed, mirrored),
    },
    {
      label: "Liquidity unwound",
      caption: "GiftSender · adminUnwindGift",
      state: stamp(unwound, claimed),
    },
    {
      label: "Delivered",
      caption: "GiftRecipient · adminDeliverGift (CCTP)",
      state: stamp(delivered, unwound),
    },
  ];
}

export default function SentPage() {
  const params = useParams<{ giftId: string }>();
  const search = useSearchParams();
  const giftId = (params?.giftId as string) ?? "";
  const secret = search.get("secret") ?? "";

  const [state, setState] = useState<GiftState | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!giftId) return;
    const tick = async () => {
      try {
        const r = await fetch(`/api/gifts/${giftId}`).then((r) => r.json());
        setState(r);
      } catch {
        /* swallow — keep last value */
      }
    };
    tick();
    const id = setInterval(tick, 6000);
    return () => clearInterval(id);
  }, [giftId]);

  const principalUsd = useMemo(() => {
    if (state?.yieldData?.principalUsd !== undefined) return state.yieldData.principalUsd;
    const a0 = state?.senderSide?.amount0Provided;
    const a1 = state?.senderSide?.amount1Provided;
    if (!a0 || !a1) return 0;
    return (Number(a0) + Number(a1)) / 1e6;
  }, [state]);

  const accruedUsd = state?.yieldData?.accruedFeesUsd ?? 0;

  const claimUrl = useMemo(
    () =>
      typeof window !== "undefined"
        ? `${window.location.origin}/claim/${giftId}`
        : `/claim/${giftId}`,
    [giftId],
  );

  const shareText = useMemo(
    () =>
      `You've got post.

Open the seal here: ${claimUrl}
The phrase is: ${secret || "(set this when sending)"}

It'll keep growing until you do. — Posthook`,
    [claimUrl, secret],
  );

  const sender = state?.senderSide?.sender;
  const senderShort = sender ? `${sender.slice(0, 6)}…${sender.slice(-4)}` : "—";

  return (
    <main className="relative flex-1 w-full overflow-hidden">
      <section className="mx-auto w-full max-w-[1240px] px-8 pt-12 pb-24 grid grid-cols-12 gap-12">
        {/* Left — receipt header + share + timeline */}
        <div className="col-span-12 lg:col-span-7 animate-paper-rise" style={{ "--rise-delay": "60ms" } as React.CSSProperties}>
          <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-stamp)] font-semibold mb-3" style={{ fontFamily: "var(--font-body)" }}>
            Counter III · Receipt of Posting
          </div>
          <h1
            className="display text-[var(--color-ink)] leading-[0.95]"
            style={{
              fontSize: "clamp(40px, 5.4vw, 76px)",
              fontVariationSettings: "'opsz' 144, 'wght' 380, 'WONK' 1",
              letterSpacing: "-0.02em",
            }}
          >
            Stamped &amp; in transit.
          </h1>

          <p
            className="mt-6 max-w-[520px] text-[15px] leading-[1.55] text-[var(--color-ink-soft)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Your voucher is on the LP, earning fees while it travels. Send the link below to your recipient
            along with the secret phrase. They can break the seal whenever — every minute they wait, the gift gets a
            little fatter.
          </p>

          <div className="rule-brass my-8" />

          {/* Tracking number */}
          <div className="grid grid-cols-12 gap-4 mb-8">
            <div className="col-span-12 md:col-span-7">
              <div
                className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-stamp)] font-semibold"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Tracking number
              </div>
              <div
                className="mt-1 text-[var(--color-ink)] break-all"
                style={{ fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.4 }}
              >
                {giftId.slice(0, 18)}…{giftId.slice(-14)}
              </div>
            </div>
            <div className="col-span-12 md:col-span-5">
              <div
                className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-stamp)] font-semibold"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Posted by
              </div>
              <div
                className="mt-1 text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
              >
                {senderShort}
              </div>
            </div>
          </div>

          {/* Claim link card */}
          <div className="bg-[var(--color-paper-warm)] border border-[var(--color-rule)] p-6">
            <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-stamp)] font-semibold mb-3" style={{ fontFamily: "var(--font-body)" }}>
              Mailable text
            </div>
            <pre
              className="bg-[var(--color-paper)] border border-[var(--color-rule)] p-4 text-[12px] whitespace-pre-wrap break-words text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {shareText}
            </pre>
            <div className="mt-3 flex gap-3 items-center">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(shareText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] uppercase tracking-[0.22em] text-[11px] font-semibold rounded-sm hover:-translate-y-0.5 transition-transform"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {copied ? "Copied" : "Copy entire note"}
              </button>
              <Link
                href={`/claim/${giftId}${secret ? `?secret=${encodeURIComponent(secret)}` : ""}`}
                className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-ink-muted)] hover:text-[var(--color-stamp)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                · preview the recipient view
              </Link>
            </div>
          </div>

          <div className="rule-brass my-10" />

          {/* Tracking timeline */}
          <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-stamp)] font-semibold mb-5" style={{ fontFamily: "var(--font-body)" }}>
            Postal tracking
          </div>
          <Timeline steps={buildTimeline(state)} />

          <div className="rule-brass my-10" />

          <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-stamp)] font-semibold mb-3" style={{ fontFamily: "var(--font-body)" }}>
            Sorting room
          </div>
          <p className="text-[12px] text-[var(--color-ink-muted)] mb-4 max-w-[520px]" style={{ fontFamily: "var(--font-body)" }}>
            Live cross-chain relays as our scrip&shy;tural relayer carries the voucher between Unichain and Base.
          </p>
          <RelayLedger />
        </div>

        {/* Right — gift card mockup with live yield */}
        <div className="col-span-12 lg:col-span-5 flex flex-col items-end pt-12 lg:pt-20">
          <GiftCard
            fromLine={senderShort}
            toLine="Recipient · Base Sepolia"
            denomination={`$${principalUsd.toFixed(0)}`}
            growthLine={`Posted ${state ? "✓" : "…"}  ·  Earning live`}
            postmarkCity="Unichain Sep."
            postmarkDate={new Date()
              .toLocaleDateString("en-US", { day: "2-digit", month: "short" })
              .toUpperCase()}
            centerSlot={
              principalUsd > 0 ? (
                <div className="bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-4 py-1.5 flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-[var(--color-ink-muted)]">
                    Now worth
                  </span>
                  <YieldTicker baseUsd={principalUsd} liveAccruedUsd={accruedUsd} />
                </div>
              ) : null
            }
          />
          <div className="mt-6 text-[11px] text-[var(--color-ink-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
            polled every 6 seconds
          </div>
        </div>
      </section>
    </main>
  );
}
