// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "uniswap-hooks/base/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {ModifyLiquidityParams, SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

/// @title GiftHook
/// @notice v4 hook attached to the gift-card stable pool. Enforces that the
/// only liquidity provider is the GiftSender contract, and exposes per-pool
/// swap-volume accounting used by the demo dashboard.
///
/// Yield accrues passively via the standard v4 fee mechanism on the
/// position NFT held by GiftSender. Per-gift apportionment is computed at
/// unwind time inside GiftSender (pro-rata to liquidity share), which keeps
/// this hook minimal.
contract GiftHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    address public immutable giftSender;

    mapping(PoolId => uint256) public totalSwapVolume;

    error OnlyGiftSenderMayProvideLiquidity();

    constructor(IPoolManager _poolManager, address _giftSender) BaseHook(_poolManager) {
        giftSender = _giftSender;
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: true,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function _beforeAddLiquidity(
        address sender,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) internal view override returns (bytes4) {
        if (sender != giftSender) revert OnlyGiftSenderMayProvideLiquidity();
        return BaseHook.beforeAddLiquidity.selector;
    }

    function _beforeRemoveLiquidity(
        address sender,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) internal view override returns (bytes4) {
        if (sender != giftSender) revert OnlyGiftSenderMayProvideLiquidity();
        return BaseHook.beforeRemoveLiquidity.selector;
    }

    function _afterSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata params,
        BalanceDelta,
        bytes calldata
    ) internal override returns (bytes4, int128) {
        uint256 absAmount = params.amountSpecified >= 0
            ? uint256(params.amountSpecified)
            : uint256(-params.amountSpecified);
        totalSwapVolume[key.toId()] += absAmount;
        return (BaseHook.afterSwap.selector, 0);
    }
}
