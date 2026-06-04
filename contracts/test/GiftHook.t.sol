// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";

import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {PoolSwapTest} from "v4-core/test/PoolSwapTest.sol";
import {PoolModifyLiquidityTest} from "v4-core/test/PoolModifyLiquidityTest.sol";

import {Currency} from "v4-core/types/Currency.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolId} from "v4-core/types/PoolId.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {LPFeeLibrary} from "v4-core/libraries/LPFeeLibrary.sol";
import {TickMath} from "v4-core/libraries/TickMath.sol";
import {SwapParams, ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";

import {GiftHook} from "../src/GiftHook.sol";

/// @dev Minimal stand-in for GiftSender — the hook only reads `totalLiquidity()`
/// to decide whether a gift is "in transit". We set it directly to flip the fee.
contract MockGiftSender {
    uint128 public totalLiquidity;

    function setTotalLiquidity(uint128 v) external {
        totalLiquidity = v;
    }
}

/// @notice Unit tests for GiftHook on a real PoolManager: the state-aware dynamic
/// fee (0.05% idle / 0.30% in transit), swap-volume telemetry, liquidity gating,
/// and the dynamic-fee-pool requirement.
contract TestGiftHook is Test, Deployers {
    GiftHook hook;
    MockGiftSender mockSender;
    Currency c0;
    Currency c1;
    PoolKey poolKey;

    // The v4 Swap event topic0 (to find it in recorded logs).
    bytes32 constant SWAP_TOPIC =
        keccak256("Swap(bytes32,address,int128,int128,uint160,uint128,int24,uint24)");

    function setUp() public {
        deployFreshManagerAndRouters();
        (c0, c1) = deployMintAndApprove2Currencies();

        mockSender = new MockGiftSender();

        // Mine the local hook address: the exact 5 permission bits from
        // GiftHook.getHookPermissions(). positionManager = modifyLiquidityRouter
        // so the gating allows our liquidity router (it's the `sender` v4 passes).
        uint160 flags = uint160(
            Hooks.AFTER_INITIALIZE_FLAG |
                Hooks.BEFORE_ADD_LIQUIDITY_FLAG |
                Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG |
                Hooks.BEFORE_SWAP_FLAG |
                Hooks.AFTER_SWAP_FLAG
        );
        address desired = address(flags);
        deployCodeTo(
            "GiftHook.sol:GiftHook",
            abi.encode(manager, address(modifyLiquidityRouter), address(mockSender)),
            desired
        );
        hook = GiftHook(desired);

        // Dynamic-fee pool (fee = DYNAMIC_FEE_FLAG), exactly like production.
        (poolKey, ) = initPool(c0, c1, IHooks(hook), LPFeeLibrary.DYNAMIC_FEE_FLAG, SQRT_PRICE_1_1);

        // Seed liquidity through the canonical router so swaps have depth.
        modifyLiquidityRouter.modifyLiquidity(
            poolKey,
            ModifyLiquidityParams({
                tickLower: -120,
                tickUpper: 120,
                liquidityDelta: 10 ether,
                salt: bytes32(0)
            }),
            ""
        );
    }

    // ── helpers ─────────────────────────────────────────────────────────────--

    /// Perform a tiny exact-input swap and return the realized fee from the Swap event.
    function _swapAndReadFee() internal returns (uint24 fee) {
        vm.recordLogs();
        swapRouter.swap(
            poolKey,
            SwapParams({
                zeroForOne: true,
                amountSpecified: -0.001 ether,
                sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ""
        );
        Vm.Log[] memory logs = vm.getRecordedLogs();
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length > 0 && logs[i].topics[0] == SWAP_TOPIC) {
                // data = (int128 amount0, int128 amount1, uint160 sqrtPriceX96,
                //         uint128 liquidity, int24 tick, uint24 fee) — fee is last.
                (, , , , , uint24 f) =
                    abi.decode(logs[i].data, (int128, int128, uint160, uint128, int24, uint24));
                return f;
            }
        }
        revert("Swap event not found");
    }

    // ── tests ─────────────────────────────────────────────────────────────────

    function test_version() public view {
        assertEq(hook.VERSION(), 3);
    }

    function test_permissionsFlagsMatchAddress() public view {
        uint160 expected = uint160(
            Hooks.AFTER_INITIALIZE_FLAG |
                Hooks.BEFORE_ADD_LIQUIDITY_FLAG |
                Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG |
                Hooks.BEFORE_SWAP_FLAG |
                Hooks.AFTER_SWAP_FLAG
        );
        assertEq(uint160(address(hook)) & Hooks.ALL_HOOK_MASK, expected);
    }

    function test_baseFee_whenNoGiftInTransit() public {
        mockSender.setTotalLiquidity(0);
        assertEq(_swapAndReadFee(), hook.BASE_FEE()); // 500 = 0.05%
    }

    function test_transitFee_whenGiftInTransit() public {
        mockSender.setTotalLiquidity(1 ether);
        assertEq(_swapAndReadFee(), hook.TRANSIT_FEE()); // 3000 = 0.30%
    }

    function test_feeFlipsWithState() public {
        mockSender.setTotalLiquidity(0);
        assertEq(_swapAndReadFee(), hook.BASE_FEE());

        mockSender.setTotalLiquidity(5 ether);
        assertEq(_swapAndReadFee(), hook.TRANSIT_FEE());

        mockSender.setTotalLiquidity(0);
        assertEq(_swapAndReadFee(), hook.BASE_FEE());
    }

    function test_afterSwap_talliesVolume() public {
        PoolId id = poolKey.toId();
        uint256 before = hook.totalSwapVolume(id);
        _swapAndReadFee(); // one 0.001 ether exact-input swap
        assertEq(hook.totalSwapVolume(id) - before, 0.001 ether);
    }

    function test_gating_revertsForNonPositionManager() public {
        // A second liquidity router is NOT the configured positionManager, so the
        // hook's beforeAddLiquidity must reject its modifyLiquidity.
        PoolModifyLiquidityTest rogue = new PoolModifyLiquidityTest(manager);
        vm.expectRevert();
        rogue.modifyLiquidity(
            poolKey,
            ModifyLiquidityParams({
                tickLower: -120,
                tickUpper: 120,
                liquidityDelta: 1 ether,
                salt: bytes32(0)
            }),
            ""
        );
    }

    function test_revert_notDynamicFee() public {
        // Same hook, but a STATIC-fee pool → _afterInitialize must revert.
        PoolKey memory staticKey = PoolKey({
            currency0: c0,
            currency1: c1,
            fee: 3000, // static, not DYNAMIC_FEE_FLAG
            tickSpacing: 60,
            hooks: IHooks(hook)
        });
        vm.expectRevert();
        manager.initialize(staticKey, SQRT_PRICE_1_1);
    }
}
