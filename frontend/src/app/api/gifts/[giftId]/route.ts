import { NextResponse } from "next/server";
import { createPublicClient, http, encodeAbiParameters, keccak256 } from "viem";
import { unichainSepolia, baseSepolia } from "@/lib/chains";
import { addresses, giftPoolKey, HOOK_TRANSIT_FEE } from "@/lib/contracts";
import { giftSenderAbi, giftRecipientAbi, giftHookAbi } from "@/generated/wagmi";

const senderClient = createPublicClient({
  chain: unichainSepolia,
  transport: http(),
});

const recipientClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const senderStateNames = [
  "None",
  "Deposited",
  "Claimed",
  "Unwound",
  "Delivered",
  "Cancelled",
  "Refunded",
  "Expired",
] as const;

const recipientStateNames = [
  "None",
  "Mirrored",
  "Claimed",
  "Delivered",
] as const;

const POOL_ID = keccak256(
  encodeAbiParameters(
    [
      {
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
      },
    ],
    [
      {
        currency0: giftPoolKey.currency0,
        currency1: giftPoolKey.currency1,
        fee: giftPoolKey.fee,
        tickSpacing: giftPoolKey.tickSpacing,
        hooks: giftPoolKey.hooks,
      },
    ],
  ),
);

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ giftId: string }> },
) {
  const { giftId } = await ctx.params;
  const id = giftId as `0x${string}`;

  let senderSide: Record<string, unknown> | null = null;
  let recipientSide: Record<string, unknown> | null = null;
  let yieldData: Record<string, unknown> | null = null;

  try {
    const s = (await senderClient.readContract({
      address: addresses.unichainSepolia.giftSender!,
      abi: giftSenderAbi,
      functionName: "gifts",
      args: [id],
    })) as readonly [
      `0x${string}`,
      `0x${string}`,
      bigint,
      bigint,
      bigint,
      bigint,
      number,
      number,
    ];

    senderSide = {
      sender: s[0],
      commitment: s[1],
      liquidityShare: s[2].toString(),
      amount0Provided: s[3].toString(),
      amount1Provided: s[4].toString(),
      expiresAt: Number(s[5]),
      dstChainId: Number(s[6]),
      state: s[7],
      stateName: senderStateNames[Number(s[7])] ?? `state_${s[7]}`,
    };
  } catch {
    senderSide = null;
  }

  try {
    const r = (await recipientClient.readContract({
      address: addresses.baseSepolia.giftRecipient!,
      abi: giftRecipientAbi,
      functionName: "gifts",
      args: [id],
    })) as readonly [`0x${string}`, bigint, bigint, `0x${string}`, number];

    recipientSide = {
      commitment: r[0],
      expectedAmount: r[1].toString(),
      expiresAt: Number(r[2]),
      claimedBy: r[3],
      state: r[4],
      stateName: recipientStateNames[Number(r[4])] ?? `state_${r[4]}`,
    };
  } catch {
    recipientSide = null;
  }

  // Live-yield estimate: read totalLiquidity (GiftSender) + totalSwapVolume (GiftHook)
  // and approximate accrued fees as `volume × feeBps × giftShare/totalLiquidity`.
  if (senderSide) {
    try {
      const [totalLiquidity, totalSwapVolume] = await Promise.all([
        senderClient.readContract({
          address: addresses.unichainSepolia.giftSender!,
          abi: giftSenderAbi,
          functionName: "totalLiquidity",
        }) as Promise<bigint>,
        senderClient.readContract({
          address: addresses.unichainSepolia.giftHook!,
          abi: giftHookAbi,
          functionName: "totalSwapVolume",
          args: [POOL_ID],
        }) as Promise<bigint>,
      ]);

      const giftLiq = BigInt((senderSide.liquidityShare as string) ?? "0");
      const principalRaw =
        BigInt((senderSide.amount0Provided as string) ?? "0") +
        BigInt((senderSide.amount1Provided as string) ?? "0");

      // The pool is dynamic-fee: giftPoolKey.fee is the sentinel flag, NOT a
      // realized rate. Since the gift is the sole LP and the hook charges the
      // premium TRANSIT_FEE on every swap while a gift is in transit, the
      // honest realized rate for an in-transit gift is HOOK_TRANSIT_FEE
      // (hundredths of a bip, i.e. 3000 = 0.30%).
      const feeBps = HOOK_TRANSIT_FEE;
      const totalFeesRaw =
        totalLiquidity > 0n
          ? (totalSwapVolume * BigInt(feeBps)) / 1_000_000n
          : 0n;
      const giftFeesRaw =
        totalLiquidity > 0n ? (totalFeesRaw * giftLiq) / totalLiquidity : 0n;

      yieldData = {
        totalLiquidity: totalLiquidity.toString(),
        totalSwapVolume: totalSwapVolume.toString(),
        feeBps,
        principalRaw: principalRaw.toString(),
        accruedFeesRaw: giftFeesRaw.toString(),
        // Convenience fields in human dollars (USDC = 6dp, the lower-decimals
        // stable; both stables are 6dp here).
        principalUsd: Number(principalRaw) / 1e6,
        accruedFeesUsd: Number(giftFeesRaw) / 1e6,
      };
    } catch {
      yieldData = null;
    }
  }

  return NextResponse.json({ giftId: id, senderSide, recipientSide, yieldData });
}
