"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { GiftCard } from "@/components/GiftCard";
import { ChainBadge } from "@/components/ChainBadge";
import { addresses } from "@/lib/contracts";
import { commitmentOf, generateSecretPhrase } from "@/lib/secret";
import { liquidityFor1to1 } from "@/lib/liquidity";
import {
  erc20Abi,
  giftSenderAbi,
  mockUsdtAbi,
} from "@/generated/wagmi";

const USDC_DECIMALS = 6;
const USDT_DECIMALS = 6;

function parseAmount(usd: string): bigint {
  const cleaned = usd.replace(/[,$]/g, "").trim();
  if (!cleaned || isNaN(Number(cleaned))) return 0n;
  // 6-decimal stable
  return BigInt(Math.round(Number(cleaned) * 10 ** USDC_DECIMALS));
}

export default function SendPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [usd, setUsd] = useState("25.00");
  const [recipientName, setRecipientName] = useState("Bob");
  const [secret, setSecret] = useState<string>("");
  const [recipientChain] = useState<"base">("base");

  // Generate a secret on first render so the UI never shows an empty value.
  useEffect(() => {
    if (!secret) setSecret(generateSecretPhrase());
  }, [secret]);

  const amount = useMemo(() => parseAmount(usd), [usd]);
  const liquidity = useMemo(() => (amount > 0n ? liquidityFor1to1(amount) : 0n), [amount]);

  const onUnichain = chainId === addresses.unichainSepolia.chainId;

  // Allowances + balances
  const { data: usdcAllowance } = useReadContract({
    address: addresses.unichainSepolia.usdc,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, addresses.unichainSepolia.giftSender!] : undefined,
    chainId: addresses.unichainSepolia.chainId,
    query: { enabled: !!address && onUnichain },
  });

  const { data: usdtAllowance } = useReadContract({
    address: addresses.unichainSepolia.usdt,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, addresses.unichainSepolia.giftSender!] : undefined,
    chainId: addresses.unichainSepolia.chainId,
    query: { enabled: !!address && onUnichain },
  });

  const { data: usdtBalance, refetch: refetchUsdt } = useReadContract({
    address: addresses.unichainSepolia.usdt,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: addresses.unichainSepolia.chainId,
    query: { enabled: !!address && onUnichain },
  });

  const { data: usdcBalance, refetch: refetchUsdc } = useReadContract({
    address: addresses.unichainSepolia.usdc,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: addresses.unichainSepolia.chainId,
    query: { enabled: !!address && onUnichain },
  });

  const needsApproveUsdc = !!usdcAllowance && usdcAllowance < amount;
  const needsApproveUsdt = !!usdtAllowance && usdtAllowance < amount;
  const insufficientUsdt = usdtBalance !== undefined && usdtBalance < amount;
  const insufficientUsdc = usdcBalance !== undefined && usdcBalance < amount;

  // Step state machine
  const [step, setStep] = useState<
    "idle" | "minting" | "approving" | "depositing" | "done"
  >("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();
  const { isLoading: txPending, isSuccess: txConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  // After deposit confirms, look up the latest giftId and redirect.
  const { refetch: refetchCount } = useReadContract({
    address: addresses.unichainSepolia.giftSender,
    abi: giftSenderAbi,
    functionName: "giftCount",
    chainId: addresses.unichainSepolia.chainId,
    query: { enabled: false },
  });

  useEffect(() => {
    if (step !== "depositing" || !txConfirmed) return;
    (async () => {
      const c = await refetchCount();
      const count = (c.data as bigint | undefined) ?? 0n;
      if (count === 0n) return;
      // Read the last giftId
      const idx = count - 1n;
      const res = await fetch(
        `/api/gifts/by-index?index=${idx.toString()}`,
      ).then((r) => r.json()).catch(() => null);
      if (res?.giftId) {
        router.push(`/sent/${res.giftId}?secret=${encodeURIComponent(secret)}`);
      } else {
        setStep("done");
      }
    })();
  }, [step, txConfirmed, refetchCount, router, secret]);

  async function handleMintTestUsdt() {
    if (!address) return;
    setError(null);
    try {
      setStep("minting");
      const hash = await writeContractAsync({
        address: addresses.unichainSepolia.usdt!,
        abi: mockUsdtAbi,
        functionName: "mint",
        args: [address, BigInt(1000) * 10n ** BigInt(USDT_DECIMALS)],
      });
      setTxHash(hash);
    } catch (e: unknown) {
      setError((e as Error).message ?? "mint failed");
      setStep("idle");
    }
  }

  // After mint confirms, refetch and reset to idle.
  useEffect(() => {
    if (step === "minting" && txConfirmed) {
      refetchUsdt();
      setTxHash(undefined);
      setStep("idle");
    }
  }, [step, txConfirmed, refetchUsdt]);

  async function handleApprove(token: "usdc" | "usdt") {
    setError(null);
    try {
      setStep("approving");
      const hash = await writeContractAsync({
        address:
          token === "usdc"
            ? addresses.unichainSepolia.usdc!
            : addresses.unichainSepolia.usdt!,
        abi: erc20Abi,
        functionName: "approve",
        args: [
          addresses.unichainSepolia.giftSender!,
          (1n << 256n) - 1n,
        ],
      });
      setTxHash(hash);
    } catch (e: unknown) {
      setError((e as Error).message ?? "approve failed");
      setStep("idle");
    }
  }

  // After approve confirms, refetch allowances.
  useEffect(() => {
    if (step === "approving" && txConfirmed) {
      setTxHash(undefined);
      setStep("idle");
    }
  }, [step, txConfirmed]);

  async function handleDeposit() {
    if (!address || amount === 0n) return;
    setError(null);
    const commitment = commitmentOf(secret);
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 3600);
    const dstChainId = addresses.baseSepolia.chainId;
    try {
      setStep("depositing");
      const hash = await writeContractAsync({
        address: addresses.unichainSepolia.giftSender!,
        abi: giftSenderAbi,
        functionName: "depositGift",
        args: [
          commitment,
          liquidity,
          amount,
          amount,
          dstChainId,
          expiresAt,
        ],
      });
      setTxHash(hash);
    } catch (e: unknown) {
      setError((e as Error).message ?? "deposit failed");
      setStep("idle");
    }
  }

  const human = (n?: bigint) =>
    n === undefined ? "—" : (Number(n) / 1e6).toFixed(2);

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

      <section className="mx-auto w-full max-w-[1240px] px-8 pt-8 pb-24 grid grid-cols-12 gap-10">
        {/* Left — form */}
        <div
          className="col-span-12 lg:col-span-7 animate-paper-rise"
          style={{ "--rise-delay": "60ms" } as React.CSSProperties}
        >
          <div
            className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-stamp)] font-semibold mb-4"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Counter I · Posting Window
          </div>
          <h1
            className="display text-[var(--color-ink)] leading-[0.95]"
            style={{
              fontSize: "clamp(40px, 5.4vw, 76px)",
              fontVariationSettings: "'opsz' 144, 'wght' 380, 'WONK' 1",
              letterSpacing: "-0.02em",
            }}
          >
            Compose a voucher.
          </h1>

          <div className="rule-brass my-8" />

          {/* Connect wallet first */}
          {!isConnected ? (
            <div className="bg-[var(--color-paper-warm)] border border-[var(--color-rule)] p-6 flex items-center justify-between">
              <div>
                <div
                  className="display text-[var(--color-ink)]"
                  style={{ fontSize: 18, fontVariationSettings: "'opsz' 144, 'wght' 500" }}
                >
                  Sign in at the counter to begin.
                </div>
                <div className="text-[12px] text-[var(--color-ink-muted)] mt-1">
                  We need a wallet on Unichain Sepolia to mint your voucher.
                </div>
              </div>
              <ConnectButton />
            </div>
          ) : !onUnichain ? (
            <div className="bg-[var(--color-paper-warm)] border border-[var(--color-rule)] p-6 flex items-center justify-between">
              <div>
                <div
                  className="display text-[var(--color-ink)]"
                  style={{ fontSize: 18, fontVariationSettings: "'opsz' 144, 'wght' 500" }}
                >
                  Switch to Unichain Sepolia.
                </div>
                <div className="text-[12px] text-[var(--color-ink-muted)] mt-1">
                  Vouchers are posted from the Unichain side.
                </div>
              </div>
              <button
                onClick={() => switchChain({ chainId: addresses.unichainSepolia.chainId })}
                className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] uppercase tracking-[0.2em] text-[11px] font-semibold rounded-sm"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Switch network
              </button>
            </div>
          ) : (
            <>
              {/* Form rows */}
              <FormRow label="Amount" hint={`Stable pair · USDC + USDT contributed equally`}>
                <div className="flex items-baseline gap-2">
                  <span
                    className="display text-[var(--color-ink-muted)]"
                    style={{ fontSize: 36, fontVariationSettings: "'opsz' 144, 'wght' 400" }}
                  >
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={usd}
                    onChange={(e) => setUsd(e.target.value)}
                    className="display tabular bg-transparent border-b border-[var(--color-ink-muted)] focus:border-[var(--color-stamp)] focus:outline-none w-44 text-[var(--color-ink)]"
                    style={{
                      fontSize: 56,
                      fontVariationSettings: "'opsz' 144, 'wght' 460",
                    }}
                  />
                </div>
                <div className="text-[11px] text-[var(--color-ink-muted)] mt-3" style={{ fontFamily: "var(--font-mono)" }}>
                  USDC bal: {human(usdcBalance)} · MockUSDT bal: {human(usdtBalance)}
                </div>
                {(insufficientUsdt || insufficientUsdc) && (
                  <div className="mt-3 flex items-center gap-3 text-[12px]" style={{ fontFamily: "var(--font-body)" }}>
                    <span className="text-[var(--color-stamp)]">
                      {insufficientUsdc ? "Need more USDC " : ""}
                      {insufficientUsdt ? "· Need more MockUSDT" : ""}
                    </span>
                    {insufficientUsdt && (
                      <button
                        onClick={handleMintTestUsdt}
                        disabled={step !== "idle"}
                        className="text-[10px] uppercase tracking-[0.22em] px-3 py-1.5 border border-[var(--color-stamp)] text-[var(--color-stamp)] hover:bg-[var(--color-stamp)] hover:text-[var(--color-paper)] transition-colors rounded-sm disabled:opacity-60"
                      >
                        Mint 1,000 mUSDT
                      </button>
                    )}
                  </div>
                )}
              </FormRow>

              <FormRow label="Recipient" hint="A label only. The actual claim is bearer-style.">
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Bob"
                  className="display bg-transparent border-b border-[var(--color-ink-muted)] focus:border-[var(--color-stamp)] focus:outline-none w-full text-[var(--color-ink)]"
                  style={{
                    fontSize: 28,
                    fontVariationSettings: "'opsz' 144, 'wght' 460",
                  }}
                />
              </FormRow>

              <FormRow
                label="Claim secret"
                hint="Share this phrase with the recipient. They'll need all four words."
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {secret.split("-").map((w, i) => (
                    <span
                      key={i}
                      className="display tabular bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-3 py-1.5 text-[var(--color-ink)]"
                      style={{
                        fontSize: 18,
                        fontVariationSettings: "'opsz' 144, 'wght' 500",
                      }}
                    >
                      {w}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSecret(generateSecretPhrase())}
                    className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-ink-muted)] hover:text-[var(--color-stamp)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    ↻ regenerate
                  </button>
                </div>
              </FormRow>

              <FormRow label="Delivery chain" hint="Where the recipient will collect.">
                <div className="flex items-center gap-3">
                  <ChainBadge chain={recipientChain} />
                  <span className="text-[12px] text-[var(--color-ink-muted)]" style={{ fontFamily: "var(--font-body)" }}>
                    Other destinations available in v2.
                  </span>
                </div>
              </FormRow>

              {/* Final action bar */}
              <div className="rule-brass mt-2 mb-6" />
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-ink-muted)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Counter II · Postage
                  </div>
                  <div
                    className="display text-[var(--color-ink)]"
                    style={{ fontSize: 22, fontVariationSettings: "'opsz' 144, 'wght' 500" }}
                  >
                    {needsApproveUsdc
                      ? "Stamp the USDC duty"
                      : needsApproveUsdt
                        ? "Stamp the USDT duty"
                        : "Press to post"}
                  </div>
                </div>

                <div className="flex gap-3">
                  {needsApproveUsdc && (
                    <button
                      onClick={() => handleApprove("usdc")}
                      disabled={step !== "idle" || txPending}
                      className="px-5 py-3 bg-[var(--color-paper-warm)] border border-[var(--color-rule)] text-[var(--color-ink)] uppercase tracking-[0.22em] text-[11px] font-semibold rounded-sm disabled:opacity-60"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {step === "approving" && txPending ? "approving…" : "Approve USDC"}
                    </button>
                  )}
                  {!needsApproveUsdc && needsApproveUsdt && (
                    <button
                      onClick={() => handleApprove("usdt")}
                      disabled={step !== "idle" || txPending}
                      className="px-5 py-3 bg-[var(--color-paper-warm)] border border-[var(--color-rule)] text-[var(--color-ink)] uppercase tracking-[0.22em] text-[11px] font-semibold rounded-sm disabled:opacity-60"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {step === "approving" && txPending ? "approving…" : "Approve mUSDT"}
                    </button>
                  )}
                  {!needsApproveUsdc && !needsApproveUsdt && (
                    <button
                      onClick={handleDeposit}
                      disabled={
                        step !== "idle" ||
                        txPending ||
                        amount === 0n ||
                        insufficientUsdc ||
                        insufficientUsdt
                      }
                      className="px-7 py-3 bg-[var(--color-stamp)] text-[var(--color-paper)] uppercase tracking-[0.28em] text-[12px] font-semibold rounded-sm disabled:opacity-60 hover:-translate-y-0.5 transition-transform"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {step === "depositing" ? (txPending ? "posting…" : "confirming…") : "Post Voucher"}
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div
                  className="mt-6 p-4 border border-[var(--color-stamp)] bg-[var(--color-paper-warm)] text-[12px] text-[var(--color-stamp)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  ✗ {error.split("\n")[0].slice(0, 240)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right — live gift card preview */}
        <div className="col-span-12 lg:col-span-5 flex flex-col items-end pt-12 lg:pt-20">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-stamp)] font-semibold mb-4" style={{ fontFamily: "var(--font-body)" }}>
            Preview
          </div>
          <GiftCard
            fromLine={address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "—"}
            toLine={recipientName ? `${recipientName} · Base Sepolia` : "—"}
            denomination={usd ? `$${Number(usd).toFixed(0)}` : "$"}
            growthLine={`Will earn ≈ 5.8% in transit`}
            postmarkCity="Unichain Sep."
            postmarkDate={new Date()
              .toLocaleDateString("en-US", { day: "2-digit", month: "short" })
              .toUpperCase()
              .replace(" ", " · ")}
          />
          <div className="mt-6 text-[11px] text-[var(--color-ink-muted)] max-w-[420px] text-right" style={{ fontFamily: "var(--font-mono)" }}>
            liquidity ≈ {liquidity.toString().slice(0, 12)} units · ticks [-100, 100] · fee 500
          </div>
        </div>
      </section>
    </main>
  );
}

function FormRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 gap-6 py-6 border-b border-[var(--color-rule)] last:border-b-0">
      <div className="col-span-12 md:col-span-3">
        <div
          className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-stamp)] font-semibold"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {label}
        </div>
        {hint ? (
          <div className="text-[11px] text-[var(--color-ink-muted)] mt-1.5" style={{ fontFamily: "var(--font-body)" }}>
            {hint}
          </div>
        ) : null}
      </div>
      <div className="col-span-12 md:col-span-9">{children}</div>
    </div>
  );
}
