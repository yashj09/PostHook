/**
 * Deployed addresses across the testnet flotilla. Public — these are testnet
 * contracts. The private key for the deployer is never imported here.
 */

import { getAddress } from "viem";
import { unichainSepolia, baseSepolia } from "@/lib/chains";

const ENV = (key: string, fallback?: string): `0x${string}` | undefined => {
  const raw = process.env[key] ?? fallback;
  if (!raw) return undefined;
  // Normalize to EIP-55 checksum form so viem accepts it.
  try {
    return getAddress(raw) as `0x${string}`;
  } catch {
    return raw as `0x${string}`;
  }
};

export const addresses = {
  unichainSepolia: {
    chainId: unichainSepolia.id,
    poolManager: ENV(
      "NEXT_PUBLIC_UNICHAIN_SEPOLIA_POOL_MANAGER",
      "0x00B036B58a818B1BC34d502D3fE730Db729e62AC",
    ),
    positionManager: ENV(
      "NEXT_PUBLIC_UNICHAIN_SEPOLIA_POSITION_MANAGER",
      "0xf969Aee60879C54bAAed9F3eD26147Db216Fd664",
    ),
    giftSender: ENV(
      "NEXT_PUBLIC_UNICHAIN_SEPOLIA_GIFT_SENDER",
      "0xe51ccEb811b78b0d4d4592fF82422680d0959EaD",
    ),
    giftHook: ENV(
      "NEXT_PUBLIC_UNICHAIN_SEPOLIA_HOOK",
      "0xdBaE3F68d81580eF851aF7d7EA9d26C8EE2a5ac0",
    ),
    stateView: ENV(
      "NEXT_PUBLIC_UNICHAIN_SEPOLIA_STATE_VIEW",
      "0xc199F1072a74D4e905ABa1A84d9a45E2546B6222",
    ),
    usdc: ENV(
      "NEXT_PUBLIC_UNICHAIN_SEPOLIA_USDC",
      "0x31d0220469e10c4E71834a79b1f276d740d3768F",
    ),
    usdt: ENV(
      "NEXT_PUBLIC_UNICHAIN_SEPOLIA_USDT",
      "0x7FDF67698D0A83EB97eA770D9bcA66d3557556c0",
    ),
  },
  baseSepolia: {
    chainId: baseSepolia.id,
    giftRecipient: ENV(
      "NEXT_PUBLIC_BASE_SEPOLIA_GIFT_RECIPIENT",
      "0x6C5E1FE9eDa67BE07f80582C1e4488ad416bF5C2",
    ),
    usdc: ENV(
      "NEXT_PUBLIC_BASE_SEPOLIA_USDC",
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    ),
  },
} as const;

/**
 * v4's dynamic-fee sentinel (LPFeeLibrary.DYNAMIC_FEE_FLAG = 0x800000). The
 * gift pool is a dynamic-fee pool: GiftHook sets the realized fee per swap.
 */
export const DYNAMIC_FEE_FLAG = 0x800000;

/**
 * GiftHook fee tiers (hundredths of a bip). The hook charges TRANSIT_FEE while
 * a gift is in transit (GiftSender.totalLiquidity > 0) and BASE_FEE otherwise.
 * Mirrors the constants in contracts/src/GiftHook.sol — keep in sync.
 */
export const HOOK_BASE_FEE = 500; // 0.05%
export const HOOK_TRANSIT_FEE = 3000; // 0.30%

/**
 * The shared pool key used for gift LP positions. currency0 < currency1.
 * `fee` is the dynamic-fee sentinel so the TS-computed PoolId matches on-chain.
 */
export const giftPoolKey = (() => {
  const usdc = addresses.unichainSepolia.usdc!.toLowerCase();
  const usdt = addresses.unichainSepolia.usdt!.toLowerCase();
  const [c0, c1] =
    usdc < usdt
      ? [addresses.unichainSepolia.usdc!, addresses.unichainSepolia.usdt!]
      : [addresses.unichainSepolia.usdt!, addresses.unichainSepolia.usdc!];
  return {
    currency0: c0,
    currency1: c1,
    fee: DYNAMIC_FEE_FLAG,
    tickSpacing: 10,
    hooks: addresses.unichainSepolia.giftHook!,
    tickLower: -100,
    tickUpper: 100,
  } as const;
})();
