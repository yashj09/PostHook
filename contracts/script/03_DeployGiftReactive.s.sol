// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {GiftReactive} from "../src/GiftReactive.sol";

/// @notice Deploys the RSC on Reactive Lasna. Topic hashes are computed at
/// script time from the event signatures so they cannot drift from the
/// contract source.
///
/// Required env vars:
///   SENDER_CHAIN_ID, RECIPIENT_CHAIN_ID
///   UNICHAIN_SEPOLIA_GIFT_SENDER, BASE_SEPOLIA_GIFT_RECIPIENT
///   RSC_FUNDING_WEI (default 0.05 ether)
contract DeployGiftReactive is Script {
    /// @dev Event signatures must match those declared in GiftSender / GiftRecipient.
    // The signature string is independent of which args are indexed — it reflects
    // type tuple only. So these don't change when we drop indexing on sender/recipient.
    string constant SIG_DEPOSITED = "GiftDeposited(bytes32,address,bytes32,uint128,uint128,uint32,uint64)";
    string constant SIG_CLAIMED = "GiftClaimed(bytes32,address)";
    string constant SIG_UNWOUND = "GiftUnwound(bytes32,address,uint128,uint128,uint32)";

    function run() external returns (GiftReactive rsc) {
        uint256 senderChainId = vm.envUint("SENDER_CHAIN_ID");
        uint256 recipientChainId = vm.envUint("RECIPIENT_CHAIN_ID");
        address giftSenderAddr = vm.envAddress("UNICHAIN_SEPOLIA_GIFT_SENDER");
        address giftRecipientAddr = vm.envAddress("BASE_SEPOLIA_GIFT_RECIPIENT");
        uint256 topicDeposited = uint256(keccak256(bytes(SIG_DEPOSITED)));
        uint256 topicClaimed = uint256(keccak256(bytes(SIG_CLAIMED)));
        uint256 topicUnwound = uint256(keccak256(bytes(SIG_UNWOUND)));
        uint256 fundingWei = vm.envOr("RSC_FUNDING_WEI", uint256(0.05 ether));
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);
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
