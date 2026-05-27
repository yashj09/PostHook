"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { GiftCard } from "@/components/GiftCard";
import { WaxSeal } from "@/components/WaxSeal";
import { Timeline, type TimelineStep } from "@/components/Timeline";
import { YieldTicker } from "@/components/YieldTicker";
import { addresses } from "@/lib/contracts";
import { commitmentOf, secretBytes } from "@/lib/secret";
import { giftRecipientAbi } from "@/generated/wagmi";

type ApiState = {
  giftId: string;
  senderSide: { amount0Provided: string; amount1Provided: string; stateName: string } | null;
  recipientSide: {
    commitment: string;
    expectedAmount: string;
    expiresAt: number;
    claimedBy: string;
    state: number;
    stateName: string;
  } | null;
  yieldData: {
    principalUsd: number;
    accruedFeesUsd: number;
  } | null;
};

function buildTimeline(state: ApiState | null): TimelineStep[] {
  const senderState = state?.senderSide?.stateName ?? "None";
  const recipState = state?.recipientSide?.stateName ?? "None";
  const stamp = (cond: boolean, active: boolean): "done" | "active" | "pending" =>
    cond ? "done" : active ? "active" : "pending";
  const mirrored = recipState === "Mirrored" || recipState === "Claimed" || recipState === "Delivered";
  const claimed = recipState === "Claimed" || recipState === "Delivered";
  const unwound = senderState === "Unwound" || senderState === "Refunded";
  const delivered = recipState === "Delivered";
  return [
    { label: "Mirrored", caption: "Voucher reached this side", state: stamp(mirrored, false) },
    { label: "Seal broken", caption: "You broke the seal", state: stamp(claimed, mirrored) },
    { label: "Unwound", caption: "Liquidity returned to escrow", state: stamp(unwound, claimed) },
    { label: "Delivered", caption: "USDC arrived", state: stamp(delivered, unwound) },
  ];
}

export default function ClaimPage() {
  const params = useParams<{ giftId: string }>();
  const search = useSearchParams();
  const giftId = (params?.giftId as string) ?? "";
  const presetSecret = search.get("secret") ?? "";

  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const onBase = chainId === addresses.baseSepolia.chainId;

  const [secret, setSecret] = useState(presetSecret);
  const [state, setState] = useState<ApiState | null>(null);
  const [pressing, setPressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll the gift state.
  useEffect(() => {
    if (!giftId) return;
    const tick = async () => {
      try {
        const r = await fetch(`/api/gifts/${giftId}`).then((r) => r.json());
        setState(r);
      } catch {
        /* swallow */
      }
    };
    tick();
    const id = setInterval(tick, 6000);
    return () => clearInterval(id);
  }, [giftId]);

  const principalUsd = useMemo(() => {
    const a0 = state?.senderSide?.amount0Provided;
    const a1 = state?.senderSide?.amount1Provided;
    if (!a0 || !a1) return 0;
    return (Number(a0) + Number(a1)) / 1e6;
  }, [state]);

  const recipState = state?.recipientSide?.stateName ?? "Loading";

  // Validate secret matches the on-chain commitment
  const expectedCommitment = state?.recipientSide?.commitment ?? "";
  const enteredCommitment = useMemo(() => (secret ? commitmentOf(secret) : "0x"), [secret]);
  const secretMatches =
    expectedCommitment.length > 2 &&
    secret.length > 0 &&
    enteredCommitment.toLowerCase() === expectedCommitment.toLowerCase();

  // Claim contract write
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: txPending } = useWaitForTransactionReceipt({ hash: txHash });

  async function handleSeal() {
    if (!secretMatches || !giftId) return;
    setError(null);
    setPressing(true);
    setTimeout(() => setPressing(false), 320);
    try {
      const hash = await writeContractAsync({
        address: addresses.baseSepolia.giftRecipient!,
        abi: giftRecipientAbi,
        functionName: "claimGift",
        args: [giftId as `0x${string}`, secretBytes(secret)],
      });
      setTxHash(hash);
    } catch (e: unknown) {
      setError((e as Error).message ?? "claim failed");
    }
  }

  const isDelivered = recipState === "Delivered";
  const isClaimed = recipState === "Claimed" || isDelivered;

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

      <section className="mx-auto w-full max-w-[1240px] px-8 pt-8 pb-24 grid grid-cols-12 gap-12">
        {/* Left — masthead + secret entry + seal */}
        <div className="col-span-12 lg:col-span-7 animate-paper-rise" style={{ "--rise-delay": "60ms" } as React.CSSProperties}>
          <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-stamp)] font-semibold mb-3" style={{ fontFamily: "var(--font-body)" }}>
            Counter IV · Sealed Mail
          </div>
          <h1
            className="display text-[var(--color-ink)] leading-[0.95]"
            style={{
              fontSize: "clamp(40px, 5.4vw, 76px)",
              fontVariationSettings: "'opsz' 144, 'wght' 380, 'WONK' 1",
              letterSpacing: "-0.02em",
            }}
          >
            {isDelivered
              ? "Delivered."
              : isClaimed
                ? "Sealed open."
                : "There's post for you."}
          </h1>

          <p
            className="mt-6 max-w-[520px] text-[15px] leading-[1.55] text-[var(--color-ink-soft)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {isDelivered
              ? "Your USDC has landed on Base. Thank you for using Posthook."
              : isClaimed
                ? "Reactive is unwinding the gift's liquidity on Unichain. CCTP delivers shortly."
                : "Type the four-word phrase your sender shared, then press the wax seal. The voucher unwinds on Unichain and the proceeds arrive here on Base."}
          </p>

          <div className="rule-brass my-8" />

          {/* Connection / chain prompt */}
          {!isConnected ? (
            <div className="bg-[var(--color-paper-warm)] border border-[var(--color-rule)] p-6 flex items-center justify-between mb-10">
              <div>
                <div
                  className="display text-[var(--color-ink)]"
                  style={{ fontSize: 18, fontVariationSettings: "'opsz' 144, 'wght' 500" }}
                >
                  Identify yourself at the counter.
                </div>
                <div className="text-[12px] text-[var(--color-ink-muted)] mt-1">
                  Wallet on Base Sepolia, please.
                </div>
              </div>
              <ConnectButton />
            </div>
          ) : !onBase ? (
            <div className="bg-[var(--color-paper-warm)] border border-[var(--color-rule)] p-6 flex items-center justify-between mb-10">
              <div>
                <div
                  className="display text-[var(--color-ink)]"
                  style={{ fontSize: 18, fontVariationSettings: "'opsz' 144, 'wght' 500" }}
                >
                  Switch to Base Sepolia.
                </div>
                <div className="text-[12px] text-[var(--color-ink-muted)] mt-1">
                  The voucher is collected on the Base side of the desk.
                </div>
              </div>
              <button
                onClick={() => switchChain({ chainId: addresses.baseSepolia.chainId })}
                className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] uppercase tracking-[0.2em] text-[11px] font-semibold rounded-sm"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Switch network
              </button>
            </div>
          ) : null}

          {/* Secret entry */}
          {!isClaimed && (
            <div className="mb-10">
              <div
                className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-stamp)] font-semibold mb-3"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Phrase on the envelope
              </div>
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Postcard-Heath-Ember-Cobalt"
                className="display w-full bg-transparent border-b border-[var(--color-ink-muted)] focus:border-[var(--color-stamp)] focus:outline-none text-[var(--color-ink)]"
                style={{
                  fontSize: 28,
                  fontVariationSettings: "'opsz' 144, 'wght' 460",
                }}
              />
              {secret && (
                <div className="mt-3 text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
                  {secretMatches ? (
                    <span className="text-[var(--color-foliage)]">✓ commitment matches</span>
                  ) : expectedCommitment ? (
                    <span className="text-[var(--color-stamp)]">
                      ✗ that's not quite the phrase
                    </span>
                  ) : (
                    <span className="text-[var(--color-ink-muted)]">… looking up commitment</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Wax seal CTA */}
          <div className="flex flex-col items-center pt-4 pb-12 relative">
            <motion.div
              animate={
                isDelivered
                  ? { rotate: [-2, -8, -2], scale: [1, 1.05, 1] }
                  : isClaimed
                    ? { opacity: 0.5, scale: 0.92 }
                    : { rotate: 0 }
              }
              transition={{ duration: 0.4 }}
            >
              <WaxSeal
                size={132}
                onClick={handleSeal}
                disabled={
                  !isConnected || !onBase || !secretMatches || isClaimed || txPending
                }
                pressing={pressing}
              >
                {isDelivered
                  ? "Delivered ·"
                  : isClaimed
                    ? "Seal broken ·"
                    : txPending
                      ? "pressing…"
                      : "Press to break ·"}
              </WaxSeal>
            </motion.div>
          </div>

          {error && (
            <div
              className="p-4 border border-[var(--color-stamp)] bg-[var(--color-paper-warm)] text-[12px] text-[var(--color-stamp)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              ✗ {error.split("\n")[0].slice(0, 240)}
            </div>
          )}

          <div className="rule-brass my-10" />

          <div
            className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-stamp)] font-semibold mb-5"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Postal tracking
          </div>
          <Timeline steps={buildTimeline(state)} />
        </div>

        {/* Right — gift card with envelope animation */}
        <div className="col-span-12 lg:col-span-5 flex flex-col items-end pt-12 lg:pt-20">
          <motion.div
            animate={
              isDelivered
                ? { rotate: [0, -1.4, 0.8, 0], scale: [1, 1.04, 1] }
                : isClaimed
                  ? { rotate: -2, y: -4 }
                  : { rotate: 0 }
            }
            transition={{ duration: 0.6 }}
          >
            <GiftCard
              fromLine="Posthook · Air Mail"
              toLine="To: You"
              denomination={principalUsd > 0 ? `$${principalUsd.toFixed(0)}` : "$"}
              growthLine={
                isDelivered
                  ? "Delivered · paid out in USDC"
                  : isClaimed
                    ? "Unwinding…"
                    : "Sealed · still earning"
              }
              postmarkCity="Base Sep."
              postmarkDate={new Date()
                .toLocaleDateString("en-US", { day: "2-digit", month: "short" })
                .toUpperCase()}
              centerSlot={
                principalUsd > 0 && !isClaimed ? (
                  <div className="bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-4 py-1.5 flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-[var(--color-ink-muted)]">
                      Now worth
                    </span>
                    <YieldTicker baseUsd={principalUsd} liveAccruedUsd={state?.yieldData?.accruedFeesUsd ?? 0} />
                  </div>
                ) : isDelivered ? (
                  <div
                    className="display text-[var(--color-foliage)] tabular"
                    style={{
                      fontSize: 32,
                      fontVariationSettings: "'opsz' 144, 'wght' 600",
                    }}
                  >
                    ${(Number(state?.recipientSide?.expectedAmount ?? 0) / 1e6).toFixed(2)}
                  </div>
                ) : null
              }
            />
          </motion.div>

          <div
            className="mt-6 text-[11px] text-[var(--color-ink-muted)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            state: {recipState}
          </div>
        </div>
      </section>
    </main>
  );
}
