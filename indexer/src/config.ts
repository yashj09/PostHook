import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import {
  type Address,
  type Hex,
  encodeAbiParameters,
  getAddress,
  keccak256,
} from "viem";

// Load the shared contracts/.env (one level up from indexer/). The indexer is
// read-only, so it only consumes RPC URLs + addresses — never a private key.
const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, "../../contracts/.env") });

const env = (key: string, fallback: string): string =>
  process.env[key]?.trim() || fallback;

const addr = (key: string, fallback: string): Address =>
  getAddress(env(key, fallback));

// ── RPC endpoints (public testnet defaults; override via contracts/.env) ──────
export const UNICHAIN_RPC = env("UNICHAIN_SEPOLIA_RPC", "https://sepolia.unichain.org");
export const BASE_RPC = env("BASE_SEPOLIA_RPC", "https://sepolia.base.org");

// ── Contract addresses (defaults = current live deployment) ───────────────────
export const GIFT_SENDER = addr("UNICHAIN_SEPOLIA_GIFT_SENDER", "0xe51ccEb811b78b0d4d4592fF82422680d0959EaD");
export const GIFT_HOOK = addr("UNICHAIN_SEPOLIA_HOOK", "0xdBaE3F68d81580eF851aF7d7EA9d26C8EE2a5ac0");
export const POOL_MANAGER = addr("UNICHAIN_SEPOLIA_POOL_MANAGER", "0x00B036B58a818B1BC34d502D3fE730Db729e62AC");
export const GIFT_RECIPIENT = addr("BASE_SEPOLIA_GIFT_RECIPIENT", "0x6C5E1FE9eDa67BE07f80582C1e4488ad416bF5C2");
export const USDC = addr("UNICHAIN_SEPOLIA_USDC", "0x31d0220469e10c4E71834a79b1f276d740d3768F");
export const USDT = addr("UNICHAIN_SEPOLIA_USDT", "0x7FDF67698D0A83EB97eA770D9bcA66d3557556c0");

// ── Pool identity ─────────────────────────────────────────────────────────────
// The gift pool is a dynamic-fee pool: PoolKey.fee is the sentinel flag.
export const DYNAMIC_FEE_FLAG = 0x800000;

/** keccak256(abi.encode(PoolKey)) — used to filter the indexed Swap event. */
export const POOL_ID: Hex = (() => {
  const [c0, c1] =
    USDC.toLowerCase() < USDT.toLowerCase() ? [USDC, USDT] : [USDT, USDC];
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
      [{ currency0: c0, currency1: c1, fee: DYNAMIC_FEE_FLAG, tickSpacing: 10, hooks: GIFT_HOOK }],
    ),
  );
})();

// ── Hook fee tiers (hundredths of a bip) — mirror GiftHook.sol ────────────────
export const HOOK_BASE_FEE = 500; // 0.05%
export const HOOK_TRANSIT_FEE = 3000; // 0.30%

// ── Chain metadata ────────────────────────────────────────────────────────────
export type ChainKey = "unichain" | "base";

export const CHAINS = {
  unichain: {
    key: "unichain" as const,
    id: 1301,
    label: "Unichain Sepolia",
    rpc: UNICHAIN_RPC,
    explorer: "https://sepolia.uniscan.xyz",
    // Public RPC getLogs cap is 10k blocks/query; stay under it.
    logChunk: 9_500n,
  },
  base: {
    key: "base" as const,
    id: 84532,
    label: "Base Sepolia",
    rpc: BASE_RPC,
    explorer: "https://sepolia.basescan.org",
    // Base public RPC caps getLogs at 2k blocks/query.
    logChunk: 1_900n,
  },
} as const;

// How far back to look on first start (number of chunked windows per chain).
export const BACKFILL_WINDOWS = 4n;
// Live-tail poll interval.
export const POLL_MS = 4_000;
