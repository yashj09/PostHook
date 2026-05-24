// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {GiftSender} from "../src/GiftSender.sol";

/// @notice Step 5 of testnet bringup. Initializes the v4 USDC/MockUSDT pool
/// with our hook attached, then registers the PoolKey on GiftSender so it
/// can subsequently mint LP positions on every depositGift.
///
/// Required env vars:
///   UNICHAIN_SEPOLIA_POOL_MANAGER
///   UNICHAIN_SEPOLIA_USDC, UNICHAIN_SEPOLIA_USDT
///   UNICHAIN_SEPOLIA_HOOK    (set after 00_DeployHook)
///   UNICHAIN_SEPOLIA_GIFT_SENDER (set after 01_DeployGiftSender)
///
/// Notes:
/// - Stable pair → starting price = 1.0, sqrtPriceX96 = 2**96.
/// - Tick spacing = 10 is standard for fee = 100 (0.01%); 60 for 3000; etc.
///   We use feeTier = 500 → tickSpacing = 10 for tight stable LP.
/// - Range chosen [-100, 100] gives ~1% price band around peg.
contract InitPoolAndPrime is Script {
    uint160 constant SQRT_PRICE_1_TO_1 = 79228162514264337593543950336; // 2**96
    uint24  constant FEE_TIER = 500;       // 0.05%
    int24   constant TICK_SPACING = 10;
    int24   constant TICK_LOWER = -100;
    int24   constant TICK_UPPER = 100;

    function run() external {
        IPoolManager poolManager = IPoolManager(vm.envAddress("UNICHAIN_SEPOLIA_POOL_MANAGER"));
        address usdc = vm.envAddress("UNICHAIN_SEPOLIA_USDC");
        address usdt = vm.envAddress("UNICHAIN_SEPOLIA_USDT");
        address hook = vm.envAddress("UNICHAIN_SEPOLIA_HOOK");
        GiftSender sender = GiftSender(payable(vm.envAddress("UNICHAIN_SEPOLIA_GIFT_SENDER")));

        // v4 PoolKey requires currency0 < currency1 (numerically).
        (address c0, address c1) = usdc < usdt ? (usdc, usdt) : (usdt, usdc);
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(c0),
            currency1: Currency.wrap(c1),
            fee: FEE_TIER,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(hook)
        });

        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        poolManager.initialize(key, SQRT_PRICE_1_TO_1);
        sender.setPoolKey(key, TICK_LOWER, TICK_UPPER);
        vm.stopBroadcast();

        console.log("Pool initialized; GiftSender configured.");
        console.log("currency0:", c0);
        console.log("currency1:", c1);
        console.log("hook:", hook);
    }
}
