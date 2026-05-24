// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {GiftSender} from "../src/GiftSender.sol";
import {IPositionManager} from "@uniswap/v4-periphery/src/interfaces/IPositionManager.sol";

contract DeployGiftSender is Script {
    function run() external returns (GiftSender sender) {
        address callbackProxy = vm.envAddress("UNICHAIN_SEPOLIA_CALLBACK_PROXY");
        IPositionManager positionManager = IPositionManager(vm.envAddress("UNICHAIN_SEPOLIA_POSITION_MANAGER"));
        address owner = vm.envAddress("DEPLOYER_ADDRESS");
        uint256 fundingWei = vm.envOr("GIFT_SENDER_FUNDING_WEI", uint256(0.05 ether));
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);
        sender = new GiftSender{value: fundingWei}(callbackProxy, positionManager, owner);
        vm.stopBroadcast();

        console.log("GiftSender deployed at:", address(sender));
    }
}
