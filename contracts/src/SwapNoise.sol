// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title SwapNoise
/// @notice Tiny test helper that performs minimal alternating swaps on the
/// Posthook gift pool to generate visible LP fee accrual for the demo. Holds
/// a small inventory of USDC + USDT, swaps a tiny amount each call, alternates
/// direction so the pool stays near peg.
///
/// Pre-fund with `mintAndApprove(amount)` before first call. Then have an
/// off-chain caller (cron / cast loop) hit `tick()` once a minute.
contract SwapNoise is IUnlockCallback {
    using SafeERC20 for IERC20;

    IPoolManager public immutable poolManager;
    PoolKey public poolKey;
    address public owner;
    bool public direction; // toggles each tick

    uint160 public constant MIN_SQRT_RATIO_PLUS_1 = 4295128739 + 1;
    uint160 public constant MAX_SQRT_RATIO_MINUS_1 = 1461446703485210103287273052203988822378723970342 - 1;

    constructor(IPoolManager _pm) {
        poolManager = _pm;
        owner = msg.sender;
    }

    function setPoolKey(PoolKey calldata _key) external {
        require(msg.sender == owner, "owner only");
        poolKey = _key;
    }

    /// @notice Pull tokens from caller into this contract for use as swap inventory.
    function fund(uint256 amt0, uint256 amt1) external {
        require(msg.sender == owner, "owner only");
        IERC20(Currency.unwrap(poolKey.currency0)).safeTransferFrom(msg.sender, address(this), amt0);
        IERC20(Currency.unwrap(poolKey.currency1)).safeTransferFrom(msg.sender, address(this), amt1);
    }

    /// @notice Run a tiny exact-input swap, alternating direction each call.
    /// @param amountIn raw token units to swap (e.g. 100_000 = 0.1 USDC at 6dp)
    function tick(uint128 amountIn) external {
        bool zeroForOne = direction;
        direction = !direction;
        poolManager.unlock(abi.encode(zeroForOne, amountIn));
    }

    /// @notice PoolManager calls back here within unlock(). We perform the swap
    /// and settle balances.
    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        require(msg.sender == address(poolManager), "only PM");
        (bool zeroForOne, uint128 amountIn) = abi.decode(data, (bool, uint128));

        uint160 priceLimit = zeroForOne ? MIN_SQRT_RATIO_PLUS_1 : MAX_SQRT_RATIO_MINUS_1;
        BalanceDelta delta = poolManager.swap(
            poolKey,
            SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: -int256(uint256(amountIn)), // negative = exact input
                sqrtPriceLimitX96: priceLimit
            }),
            ""
        );

        // Settle: pay negative deltas first (we owe), then take positive ones (PM owes us).
        // For an exact-input swap, exactly one side is negative (input) and one positive (output).
        int128 amt0 = delta.amount0();
        int128 amt1 = delta.amount1();

        if (amt0 < 0) {
            poolManager.sync(poolKey.currency0);
            IERC20(Currency.unwrap(poolKey.currency0)).safeTransfer(address(poolManager), uint256(uint128(-amt0)));
            poolManager.settle();
        }
        if (amt1 < 0) {
            poolManager.sync(poolKey.currency1);
            IERC20(Currency.unwrap(poolKey.currency1)).safeTransfer(address(poolManager), uint256(uint128(-amt1)));
            poolManager.settle();
        }
        if (amt0 > 0) {
            poolManager.take(poolKey.currency0, address(this), uint128(amt0));
        }
        if (amt1 > 0) {
            poolManager.take(poolKey.currency1, address(this), uint128(amt1));
        }

        return "";
    }

    function withdraw(address to) external {
        require(msg.sender == owner, "owner only");
        IERC20 t0 = IERC20(Currency.unwrap(poolKey.currency0));
        IERC20 t1 = IERC20(Currency.unwrap(poolKey.currency1));
        uint256 b0 = t0.balanceOf(address(this));
        uint256 b1 = t1.balanceOf(address(this));
        if (b0 > 0) t0.safeTransfer(to, b0);
        if (b1 > 0) t1.safeTransfer(to, b1);
    }
}
