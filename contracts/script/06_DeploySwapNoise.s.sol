// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {SwapNoise} from "../src/SwapNoise.sol";

contract DeploySwapNoise is Script {
    function run() external returns (SwapNoise noise) {
        IPoolManager pm = IPoolManager(vm.envAddress("UNICHAIN_SEPOLIA_POOL_MANAGER"));
        address usdc = vm.envAddress("UNICHAIN_SEPOLIA_USDC");
        address usdt = vm.envAddress("UNICHAIN_SEPOLIA_USDT");
        address hook = vm.envAddress("UNICHAIN_SEPOLIA_HOOK");
        uint256 pk = vm.envUint("PRIVATE_KEY");

        (address c0, address c1) = usdc < usdt ? (usdc, usdt) : (usdt, usdc);
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(c0),
            currency1: Currency.wrap(c1),
            fee: 500,
            tickSpacing: 10,
            hooks: IHooks(hook)
        });

        vm.startBroadcast(pk);
        noise = new SwapNoise(pm);
        noise.setPoolKey(key);
        vm.stopBroadcast();

        console.log("SwapNoise:", address(noise));
    }
}
