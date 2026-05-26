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
      "0x8638F77441A603c28734cB77627918A4F13Cb411",
    ),
    giftHook: ENV(
      "NEXT_PUBLIC_UNICHAIN_SEPOLIA_HOOK",
      "0x80327218722e7f98d9D6bC5f46693d3d98194A40",
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
 * The shared pool key used for gift LP positions. currency0 < currency1.
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
    fee: 500, // 0.05%
    tickSpacing: 10,
    hooks: addresses.unichainSepolia.giftHook!,
    tickLower: -100,
    tickUpper: 100,
  } as const;
})();
