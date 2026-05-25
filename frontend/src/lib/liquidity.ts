/**
 * Minimal port of Uniswap v4 LiquidityAmounts.getLiquidityForAmounts
 * for *concentrated* positions. Inputs/outputs are JS bigints.
 *
 * Reference: github.com/Uniswap/v4-core/blob/main/src/libraries/LiquidityAmounts.sol
 */

const Q96 = 1n << 96n;

function sqrtPriceX96AtTick(tick: number): bigint {
  // Math.pow loses precision past ~|tick|>200_000; the gift pool uses
  // [-100, 100] so this is fine. Returns a Q64.96 fixed-point number.
  const ratio = Math.pow(1.0001, tick / 2);
  return BigInt(Math.floor(ratio * Number(Q96)));
}

function mulDiv(a: bigint, b: bigint, c: bigint): bigint {
  return (a * b) / c;
}

function liquidity0(amount0: bigint, sqrtA: bigint, sqrtB: bigint): bigint {
  if (sqrtA > sqrtB) [sqrtA, sqrtB] = [sqrtB, sqrtA];
  const intermediate = mulDiv(sqrtA, sqrtB, Q96);
  return mulDiv(amount0, intermediate, sqrtB - sqrtA);
}

function liquidity1(amount1: bigint, sqrtA: bigint, sqrtB: bigint): bigint {
  if (sqrtA > sqrtB) [sqrtA, sqrtB] = [sqrtB, sqrtA];
  return mulDiv(amount1, Q96, sqrtB - sqrtA);
}

/**
 * Compute the v4 `liquidity` parameter for a given pair of token amounts and
 * tick range, given the current sqrtPriceX96.
 */
export function getLiquidityForAmounts(
  sqrtPriceX96: bigint,
  tickLower: number,
  tickUpper: number,
  amount0: bigint,
  amount1: bigint,
): bigint {
  const sqrtA = sqrtPriceX96AtTick(tickLower);
  const sqrtB = sqrtPriceX96AtTick(tickUpper);
  const [low, high] = sqrtA < sqrtB ? [sqrtA, sqrtB] : [sqrtB, sqrtA];

  if (sqrtPriceX96 <= low) {
    return liquidity0(amount0, low, high);
  } else if (sqrtPriceX96 < high) {
    const l0 = liquidity0(amount0, sqrtPriceX96, high);
    const l1 = liquidity1(amount1, low, sqrtPriceX96);
    return l0 < l1 ? l0 : l1;
  } else {
    return liquidity1(amount1, low, high);
  }
}

/** Stable pool starting price = 1.0, sqrtPriceX96 = 2^96. */
export const SQRT_PRICE_1_TO_1 = Q96;

/**
 * For a 1:1 stable pool with deposits in equal token amounts, compute the
 * liquidity to request. amount0 == amount1 expected.
 */
export function liquidityFor1to1(
  amountEach: bigint,
  tickLower = -100,
  tickUpper = 100,
): bigint {
  return getLiquidityForAmounts(SQRT_PRICE_1_TO_1, tickLower, tickUpper, amountEach, amountEach);
}
