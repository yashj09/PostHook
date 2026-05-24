// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AbstractReactive} from "@reactive/abstract-base/AbstractReactive.sol";
import {IReactive} from "@reactive/interfaces/IReactive.sol";

/// @title GiftReactive
/// @notice The Reactive Smart Contract deployed on Reactive Lasna. Subscribes
/// to events on Unichain Sepolia (sender side) and Base Sepolia (recipient
/// side). Translates each event into a `Callback` to the *opposite* chain.
///
/// State-machine wiring (event → action):
///   • GiftDeposited   on Unichain → mintGiftEntry on Base
///   • GiftClaimed     on Base     → unwindGift     on Unichain
///   • GiftUnwound     on Unichain → deliverGift    on Base   (after CCTP)
///   • GiftCancelled   on Unichain → (no-op; sender already refunded locally)
///   • GiftExpired     on Unichain → (no-op; sender already refunded locally)
///
/// All cross-chain auth is handled by AbstractCallback on the destination side.
contract GiftReactive is AbstractReactive {
    // event topic_0 hashes — must match the actual event signatures emitted
    // by GiftSender / GiftRecipient. Computed off-chain and passed in at
    // construction so this file doesn't have to import the other contracts.
    uint256 public immutable depositedTopic;     // GiftDeposited
    uint256 public immutable claimedTopic;       // GiftClaimed
    uint256 public immutable unwoundTopic;       // GiftUnwound

    uint256 public immutable senderChainId;      // Unichain Sepolia 1301
    uint256 public immutable recipientChainId;   // Base Sepolia 84532
    address public immutable senderContract;     // GiftSender on Unichain Sepolia
    address public immutable recipientContract;  // GiftRecipient on Base Sepolia

    uint64  public constant CALLBACK_GAS_LIMIT = 1_000_000;

    constructor(
        uint256 _senderChainId,
        uint256 _recipientChainId,
        address _senderContract,
        address _recipientContract,
        uint256 _depositedTopic,
        uint256 _claimedTopic,
        uint256 _unwoundTopic
    ) payable {
        senderChainId = _senderChainId;
        recipientChainId = _recipientChainId;
        senderContract = _senderContract;
        recipientContract = _recipientContract;
        depositedTopic = _depositedTopic;
        claimedTopic = _claimedTopic;
        unwoundTopic = _unwoundTopic;

        if (!vm) {
            // Subscribe to Sender-side events.
            service.subscribe(_senderChainId, _senderContract, _depositedTopic,
                REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
            service.subscribe(_senderChainId, _senderContract, _unwoundTopic,
                REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);

            // Subscribe to Recipient-side events.
            service.subscribe(_recipientChainId, _recipientContract, _claimedTopic,
                REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        }
    }

    function react(LogRecord calldata log) external vmOnly {
        // GiftDeposited on Unichain → mintGiftEntry on Base
        if (log.chain_id == senderChainId && log._contract == senderContract && log.topic_0 == depositedTopic) {
            // GiftDeposited(giftId indexed, sender indexed, commitment, amount0, amount1, dstChainId, expiresAt)
            // topic_1 = giftId; data = (commitment, amount0, amount1, dstChainId, expiresAt)
            bytes32 giftId = bytes32(log.topic_1);
            (bytes32 commitment, uint128 amount0, uint128 amount1, /*uint32 dstChainId*/, uint64 expiresAt)
                = abi.decode(log.data, (bytes32, uint128, uint128, uint32, uint64));
            uint128 expectedAmount = amount0 + amount1;
            bytes memory payload = abi.encodeWithSignature(
                "mintGiftEntry(bytes32,bytes32,uint128,uint64)",
                giftId, commitment, expectedAmount, expiresAt
            );
            emit Callback(recipientChainId, recipientContract, CALLBACK_GAS_LIMIT, payload);
            return;
        }

        // GiftClaimed on Base → unwindGift on Unichain
        if (log.chain_id == recipientChainId && log._contract == recipientContract && log.topic_0 == claimedTopic) {
            // GiftClaimed(giftId indexed, claimer indexed)
            bytes32 giftId = bytes32(log.topic_1);
            address claimer = address(uint160(log.topic_2));
            bytes memory payload = abi.encodeWithSignature(
                "unwindGift(bytes32,address)",
                giftId, claimer
            );
            emit Callback(senderChainId, senderContract, CALLBACK_GAS_LIMIT, payload);
            return;
        }

        // GiftUnwound on Unichain → deliverGift on Base (after CCTP arrives — in MVP,
        // we fire deliverGift immediately and rely on a separate CCTP relayer step).
        if (log.chain_id == senderChainId && log._contract == senderContract && log.topic_0 == unwoundTopic) {
            // GiftUnwound(giftId indexed, recipient indexed, principalReturned, yieldReturned, dstChainId)
            bytes32 giftId = bytes32(log.topic_1);
            (uint128 principalReturned, uint128 yieldReturned, /*uint32 dstChainId*/)
                = abi.decode(log.data, (uint128, uint128, uint32));
            uint128 totalAmount = principalReturned + yieldReturned;
            bytes memory payload = abi.encodeWithSignature(
                "deliverGift(bytes32,uint128)",
                giftId, totalAmount
            );
            emit Callback(recipientChainId, recipientContract, CALLBACK_GAS_LIMIT, payload);
            return;
        }
    }
}
