// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AbstractReactive} from "@reactive/abstract-base/AbstractReactive.sol";

/// @title GiftReactiveProbe
/// @notice Diagnostic-only RSC. Subscribes to GiftDeposited events on a single
/// origin chain and echoes the raw LogRecord topic fields + first 32 bytes of
/// data via Probe events emitted from the ReactVM. Lets us observe exactly
/// how the system contract maps EVM event topics into the LogRecord struct.
///
/// This emits NO callbacks — it's pure observability. Discard after debugging.
contract GiftReactiveProbe is AbstractReactive {
    event Probe(
        uint256 chainId,
        address contractAddr,
        uint256 topic0,
        uint256 topic1,
        uint256 topic2,
        uint256 topic3,
        bytes32 dataHead
    );

    constructor(uint256 chainId, address contractAddr, uint256 topic0) payable {
        if (!vm) {
            service.subscribe(chainId, contractAddr, topic0,
                REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        }
    }

    function react(LogRecord calldata log) external vmOnly {
        bytes32 head = log.data.length >= 32 ? bytes32(log.data[:32]) : bytes32(0);
        emit Probe(log.chain_id, log._contract, log.topic_0, log.topic_1, log.topic_2, log.topic_3, head);
    }
}
