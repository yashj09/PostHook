import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { unichainSepolia } from "@/lib/chains";
import { addresses } from "@/lib/contracts";
import { giftSenderAbi } from "@/generated/wagmi";

const client = createPublicClient({
  chain: unichainSepolia,
  transport: http(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idx = url.searchParams.get("index");
  if (!idx) return NextResponse.json({ error: "index required" }, { status: 400 });

  const giftId = (await client.readContract({
    address: addresses.unichainSepolia.giftSender!,
    abi: giftSenderAbi,
    functionName: "allGiftIds",
    args: [BigInt(idx)],
  })) as `0x${string}`;

  return NextResponse.json({ giftId });
}
