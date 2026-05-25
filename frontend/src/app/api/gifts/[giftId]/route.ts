import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { unichainSepolia, baseSepolia } from "@/lib/chains";
import { addresses } from "@/lib/contracts";
import { giftSenderAbi, giftRecipientAbi } from "@/generated/wagmi";

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

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ giftId: string }> },
) {
  const { giftId } = await ctx.params;
  const id = giftId as `0x${string}`;

  let senderSide: Record<string, unknown> | null = null;
  let recipientSide: Record<string, unknown> | null = null;

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

  return NextResponse.json({ giftId: id, senderSide, recipientSide });
}
