"use client";

import { encodeAbiParameters, keccak256 } from "viem";
import { addresses, giftPoolKey } from "@/lib/contracts";

/**
 * Compute the v4 PoolId from a PoolKey: keccak256(abi.encode(PoolKey)).
 * The order of fields must match the on-chain struct.
 */
export function computePoolId(): `0x${string}` {
  return keccak256(
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
}

/**
 * Estimate accrued LP fees for a single gift, based on:
 *   gift's share of totalLiquidity × cumulative pool swap volume × poolFee
 *
 * This is a real on-chain read (totalSwapVolume + totalLiquidity) but the
 * fee derivation is an approximation: it assumes all swaps have happened
 * within our gift's tick range and that the gift held its liquidity for
 * the entire window. Both are approximately true in the demo because the
 * pool is stable-near-peg (always in range) and our gift is the only LP.
 */
export function estimateGiftFeesUsdc(opts: {
  giftLiquidity: bigint;
  totalLiquidity: bigint;
  totalSwapVolume: bigint; // in raw token units (6dp for USDC/USDT)
  feeBps: number; // pool fee in bps × 100 (i.e. fee=500 → 0.05%)
}): number {
  if (opts.totalLiquidity === 0n) return 0;
  // total fees in raw token units = volume × fee / 1_000_000
  const totalFeesRaw =
    (opts.totalSwapVolume * BigInt(opts.feeBps)) / 1_000_000n;
  // gift's share
  const giftShareRaw =
    (totalFeesRaw * opts.giftLiquidity) / opts.totalLiquidity;
  // both stables are 6dp; convert to USD
  return Number(giftShareRaw) / 1e6;
}

export const POOL_FEE_BPS = giftPoolKey.fee; // 500 = 0.05%
export { addresses };
