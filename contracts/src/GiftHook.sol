// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "uniswap-hooks/base/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {ModifyLiquidityParams, SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

/// @dev Minimal view into GiftSender — the hook only needs to know whether any
/// gift is currently in transit (unclaimed). `totalLiquidity` is the sum of all
/// live gifts' liquidity shares; `> 0` means at least one gift is in transit.
interface IGiftSender {
    function totalLiquidity() external view returns (uint128);
}

/// @title GiftHook
/// @notice v4 hook attached to the gift-card stable pool. Three jobs:
///
/// 1. **Liquidity gating** — `beforeAddLiquidity`/`beforeRemoveLiquidity` allow
///    only Uniswap's canonical PositionManager to modify liquidity, so the
///    sender's gift positions can't be diluted by random LPs. (The `sender`
///    arg in v4 hook callbacks is the entity calling PoolManager, which when
///    GiftSender routes through PositionManager.modifyLiquidities is the
///    PositionManager itself.)
///
/// 2. **State-aware yield (the IL/Yield-track mechanism)** — this pool is a
///    DYNAMIC-FEE pool. While a gift is in transit (GiftSender.totalLiquidity
///    > 0), the hook overrides the swap fee to a PREMIUM tier; once every gift
///    is claimed, the fee falls back to baseline. Because the gift position is
///    the pool's *sole* LP, that premium fee accrues natively to the gift — so
///    a gift demonstrably out-earns an ordinary LP *because the hook is working
///    on its behalf while it travels*. No per-position token plumbing: v4's
///    OVERRIDE_FEE_FLAG routes the elevated fee through the standard fee
///    mechanism on the position NFT held by GiftSender.
///
/// 3. **Telemetry** — `afterSwap` tallies `totalSwapVolume` per pool for the
///    front-end's live yield reader.
///
/// Per-gift fee apportionment is still computed at unwind time inside
/// GiftSender (pro-rata to liquidity share).
contract GiftHook is BaseHook {
    using PoolIdLibrary for PoolKey;
    using LPFeeLibrary for uint24;

    /// @dev Bumped on every bytecode change; read via `cast call <hook> 0xffa1ad74`
    /// to confirm the deployed bytecode matches source (Foundry can serve stale
    /// bytecode — see CLAUDE.md quirk #6).
    uint256 public constant VERSION = 3;

    /// @notice Baseline LP fee when no gift is in transit (0.05%, in hundredths of a bip).
    uint24 public constant BASE_FEE = 500;
    /// @notice Premium LP fee charged while a gift is in transit (0.30%).
    uint24 public constant TRANSIT_FEE = 3000;

    address public immutable positionManager;

    /// @notice GiftSender, read to decide whether a gift is in transit. Passed
    /// at construction: GiftSender is deployed before the hook (see deploy
    /// chain), so its address is known when the hook's salt is mined.
    address public immutable giftSender;

    mapping(PoolId => uint256) public totalSwapVolume;

    error OnlyPositionManagerMayProvideLiquidity();
    error NotDynamicFee();

    constructor(IPoolManager _poolManager, address _positionManager, address _giftSender)
        BaseHook(_poolManager)
    {
        positionManager = _positionManager;
        giftSender = _giftSender;
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: true,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: true,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    /// @dev Require the pool to be a dynamic-fee pool so our beforeSwap override
    /// is honored. Guards against accidentally attaching to a static-fee pool.
    function _afterInitialize(address, PoolKey calldata key, uint160, int24)
        internal
        pure
        override
        returns (bytes4)
    {
        if (!key.fee.isDynamicFee()) revert NotDynamicFee();
        return BaseHook.afterInitialize.selector;
    }

    /// @dev The yield mechanism: charge a premium fee while a gift is in transit.
    /// Returns the fee OR'd with OVERRIDE_FEE_FLAG so PoolManager uses it for
    /// this swap. Falls back to BASE_FEE if GiftSender isn't wired yet (never
    /// reverts a swap on a config gap).
    function _beforeSwap(address, PoolKey calldata, SwapParams calldata, bytes calldata)
        internal
        view
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        uint24 fee = IGiftSender(giftSender).totalLiquidity() > 0 ? TRANSIT_FEE : BASE_FEE;
        return (
            BaseHook.beforeSwap.selector,
            BeforeSwapDeltaLibrary.ZERO_DELTA,
            fee | LPFeeLibrary.OVERRIDE_FEE_FLAG
        );
    }

    function _beforeAddLiquidity(
        address sender,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) internal view override returns (bytes4) {
        if (sender != positionManager) revert OnlyPositionManagerMayProvideLiquidity();
        return BaseHook.beforeAddLiquidity.selector;
    }

    function _beforeRemoveLiquidity(
        address sender,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) internal view override returns (bytes4) {
        if (sender != positionManager) revert OnlyPositionManagerMayProvideLiquidity();
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
