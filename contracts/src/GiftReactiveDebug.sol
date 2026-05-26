// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AbstractReactive} from "@reactive/abstract-base/AbstractReactive.sol";

/// @title GiftReactiveDebug
/// @notice One-off RSC. On every matching event, dispatches a callback to
/// GiftRecipient.adminMintGiftEntry where:
///   giftId    = topic_1
///   commitment = topic_2
///   expectedAmount = (lower 128 bits of topic_3)
///   expiresAt = (lower 64 bits of data[0:32])
/// So by inspecting what lands on Base we can see what topic_1, topic_2,
/// topic_3 actually contain — categorically. Discarded after diagnosis.
contract GiftReactiveDebug is AbstractReactive {
    uint64  public constant CALLBACK_GAS_LIMIT = 1_000_000;
    uint256 public immutable senderChainId;
    uint256 public immutable recipientChainId;
    address public immutable senderContract;
    address public immutable recipientContract;
    uint256 public immutable depositedTopic;

    constructor(
        uint256 _senderChainId,
        uint256 _recipientChainId,
        address _senderContract,
        address _recipientContract,
        uint256 _depositedTopic
    ) payable {
        senderChainId = _senderChainId;
        recipientChainId = _recipientChainId;
        senderContract = _senderContract;
        recipientContract = _recipientContract;
        depositedTopic = _depositedTopic;
        if (!vm) {
            service.subscribe(
                _senderChainId,
                _senderContract,
                _depositedTopic,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    function react(LogRecord calldata log) external vmOnly {
        if (
            log.chain_id == senderChainId &&
            log._contract == senderContract &&
            log.topic_0 == depositedTopic
        ) {
            // Pack the four LogRecord topic fields into mintGiftEntry args:
            //   arg1 (giftId)         = topic_1
            //   arg2 (commitment)     = topic_2
            //   arg3 (expectedAmount) = lower 128 bits of topic_3
            //   arg4 (expiresAt)      = upper 64 bits of topic_3 (rotated for visibility)
            bytes memory payload = abi.encodeWithSignature(
                "adminMintGiftEntry(bytes32,bytes32,uint128,uint64)",
                bytes32(log.topic_1),
                bytes32(log.topic_2),
                uint128(log.topic_3 & ((1 << 128) - 1)),
                uint64(log.topic_3 >> 128)
            );
            emit Callback(recipientChainId, recipientContract, CALLBACK_GAS_LIMIT, payload);
        }
    }
}
