// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {GiftHook} from "../src/GiftHook.sol";

/// @notice Mines a CREATE2 salt so the deployed GiftHook address has the
/// permission flag bits we declared in getHookPermissions(), then deploys.
contract DeployGiftHook is Script {
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external returns (GiftHook hook) {
        IPoolManager poolManager = IPoolManager(vm.envAddress("UNICHAIN_SEPOLIA_POOL_MANAGER"));
        address positionManager = vm.envAddress("UNICHAIN_SEPOLIA_POSITION_MANAGER");

        uint160 flags = uint160(
            Hooks.BEFORE_ADD_LIQUIDITY_FLAG |
            Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG |
            Hooks.AFTER_SWAP_FLAG
        );

        bytes memory ctorArgs = abi.encode(poolManager, positionManager);
        (address expected, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER, flags, type(GiftHook).creationCode, ctorArgs
        );
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);
        hook = new GiftHook{salt: salt}(poolManager, positionManager);
        vm.stopBroadcast();

        require(address(hook) == expected, "deploy address mismatch");
        console.log("GiftHook deployed at:", address(hook));
    }
}
