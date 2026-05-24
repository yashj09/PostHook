// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {GiftRecipient} from "../src/GiftRecipient.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployGiftRecipient is Script {
    function run() external returns (GiftRecipient recipient) {
        address callbackProxy = vm.envAddress("BASE_SEPOLIA_CALLBACK_PROXY");
        IERC20 usdc = IERC20(vm.envAddress("BASE_SEPOLIA_USDC"));
        uint256 fundingWei = vm.envOr("GIFT_RECIPIENT_FUNDING_WEI", uint256(0.05 ether));

        vm.startBroadcast();
        recipient = new GiftRecipient{value: fundingWei}(callbackProxy, usdc);
        vm.stopBroadcast();

        console.log("GiftRecipient deployed at:", address(recipient));
    }
}
