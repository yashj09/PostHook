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
    /// @notice Sentinel constant — bumped each refactor so we can confirm
    /// the on-chain bytecode is the same as our local source.
    uint256 public constant VERSION = 6;

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
        // OBSERVED Reactive Lasna behavior: LogRecord.data is the on-chain
        // log's data with the first 32 bytes lopped off. To compensate, we
        // decode starting from what would be field #2 in our event. (Our
        // events are designed so the first non-indexed field is a sacrificial
        // discriminator that we don't need on the RSC side.)

        // GiftDeposited(address discardSender, bytes32 giftId, bytes32 commitment,
        //               uint128 amount0, uint128 amount1, uint32 dstChainId, uint64 expiresAt)
        if (log.chain_id == senderChainId && log._contract == senderContract && log.topic_0 == depositedTopic) {
            (
                address discardSender,
                bytes32 giftId,
                bytes32 commitment,
                uint128 amount0,
                uint128 amount1,
                uint32 discardDstChainId,
                uint64 expiresAt
            ) = abi.decode(log.data, (address, bytes32, bytes32, uint128, uint128, uint32, uint64));
            discardSender;
            discardDstChainId;
            uint128 expectedAmount = amount0 + amount1;
            bytes memory payload = abi.encodeWithSignature(
                "mintGiftEntry(bytes32,bytes32,uint128,uint64)",
                giftId, commitment, expectedAmount, expiresAt
            );
            emit Callback(recipientChainId, recipientContract, CALLBACK_GAS_LIMIT, payload);
            return;
        }

        // GiftClaimed(bytes32 giftId, address claimer)
        // Reactive's view: data starts at `claimer`. Need a sacrificial first
        // field on the GiftRecipient side too.
        if (log.chain_id == recipientChainId && log._contract == recipientContract && log.topic_0 == claimedTopic) {
            (/*address claimer*/, bytes32 giftId, address claimerActual) = abi.decode(log.data, (address, bytes32, address));
            bytes memory payload = abi.encodeWithSignature(
                "unwindGift(bytes32,address)",
                giftId, claimerActual
            );
            emit Callback(senderChainId, senderContract, CALLBACK_GAS_LIMIT, payload);
            return;
        }

        // GiftUnwound(bytes32 giftId, address recipient, uint128 principalReturned,
        //             uint128 yieldReturned, uint32 dstChainId)
        if (log.chain_id == senderChainId && log._contract == senderContract && log.topic_0 == unwoundTopic) {
            (/*address recipient*/, bytes32 giftId, address recipientActual, uint128 principalReturned, uint128 yieldReturned, /*uint32 dstChainId*/)
                = abi.decode(log.data, (address, bytes32, address, uint128, uint128, uint32));
            recipientActual; // silence unused
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
