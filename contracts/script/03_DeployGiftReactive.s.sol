// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {GiftReactive} from "../src/GiftReactive.sol";

/// @notice Deploys the RSC on Reactive Lasna. Topic hashes for the events we
/// subscribe to are precomputed and passed in via env so this script doesn't
/// depend on the other contracts' compilation artifacts at runtime.
///
/// Required env vars:
///   SENDER_CHAIN_ID, RECIPIENT_CHAIN_ID
///   GIFT_SENDER_ADDR (Unichain), GIFT_RECIPIENT_ADDR (Base)
///   TOPIC_DEPOSITED, TOPIC_CLAIMED, TOPIC_UNWOUND
///   RSC_FUNDING_WEI (default 0.05 ether)
contract DeployGiftReactive is Script {
    function run() external returns (GiftReactive rsc) {
        uint256 senderChainId = vm.envUint("SENDER_CHAIN_ID");
        uint256 recipientChainId = vm.envUint("RECIPIENT_CHAIN_ID");
        address giftSenderAddr = vm.envAddress("GIFT_SENDER_ADDR");
        address giftRecipientAddr = vm.envAddress("GIFT_RECIPIENT_ADDR");
        uint256 topicDeposited = vm.envUint("TOPIC_DEPOSITED");
        uint256 topicClaimed = vm.envUint("TOPIC_CLAIMED");
        uint256 topicUnwound = vm.envUint("TOPIC_UNWOUND");
        uint256 fundingWei = vm.envOr("RSC_FUNDING_WEI", uint256(0.05 ether));

        vm.startBroadcast();
        rsc = new GiftReactive{value: fundingWei}(
            senderChainId,
            recipientChainId,
            giftSenderAddr,
            giftRecipientAddr,
            topicDeposited,
            topicClaimed,
            topicUnwound
        );
        vm.stopBroadcast();

        console.log("GiftReactive deployed at:", address(rsc));
    }
}
