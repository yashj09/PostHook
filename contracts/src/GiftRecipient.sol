// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AbstractCallback} from "@reactive/abstract-base/AbstractCallback.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title GiftRecipient
/// @notice Recipient-facing claim contract on the destination chain (Base
/// Sepolia). The user's only on-chain action is `claimGift` with the secret;
/// the RSC handles everything else.
///
/// Lifecycle from the recipient's view:
///   1. Sender deposits on Unichain. RSC mirrors gift entry here via mintGiftEntry.
///   2. Recipient calls claimGift(giftId, secret). Emits GiftClaimed.
///   3. RSC sees GiftClaimed, triggers unwindGift on Unichain.
///   4. Unichain GiftSender ships USDC via CCTP to this contract.
///   5. RSC fires deliverGift here once CCTP confirms; we forward to the user.
contract GiftRecipient is AbstractCallback {
    using SafeERC20 for IERC20;

    enum State { None, Mirrored, Claimed, Delivered }

    struct GiftEntry {
        bytes32 commitment;
        uint128 expectedAmount;     // approximate; final amount comes from CCTP
        uint64  expiresAt;
        address claimedBy;          // 0x0 until claimed
        State   state;
    }

    /// @notice The USDC token on this chain (the CCTP-minted asset users receive).
    IERC20 public immutable usdc;

    mapping(bytes32 => GiftEntry) public gifts;
    bytes32[] public allGiftIds;

    event GiftMirrored(bytes32 indexed giftId, bytes32 commitment, uint128 expectedAmount, uint64 expiresAt);
    event GiftClaimed(bytes32 indexed giftId, address indexed claimer);
    event GiftDelivered(bytes32 indexed giftId, address indexed recipient, uint128 amount);

    error UnknownGift();
    error InvalidGiftState();
    error InvalidSecret();
    error GiftExpired();

    constructor(address _callbackProxy, IERC20 _usdc) AbstractCallback(_callbackProxy) payable {
        usdc = _usdc;
    }

    /// @notice Called by the RSC immediately after Alice's deposit on Unichain
    ///   to mirror the gift here so the recipient has something to claim against.
    function mintGiftEntry(
        bytes32 giftId,
        bytes32 commitment,
        uint128 expectedAmount,
        uint64  expiresAt
    ) external rvmIdOnly(rvm_id) authorizedSenderOnly {
        if (gifts[giftId].state != State.None) revert InvalidGiftState();
        gifts[giftId] = GiftEntry({
            commitment: commitment,
            expectedAmount: expectedAmount,
            expiresAt: expiresAt,
            claimedBy: address(0),
            state: State.Mirrored
        });
        allGiftIds.push(giftId);
        emit GiftMirrored(giftId, commitment, expectedAmount, expiresAt);
    }

    /// @notice Recipient claims the gift by revealing the secret matching the commitment.
    ///   Emits GiftClaimed; the RSC sees this and triggers the unwind on the sender chain.
    function claimGift(bytes32 giftId, bytes calldata secret) external {
        GiftEntry storage g = gifts[giftId];
        if (g.state == State.None) revert UnknownGift();
        if (g.state != State.Mirrored) revert InvalidGiftState();
        if (block.timestamp >= g.expiresAt) revert GiftExpired();
        if (keccak256(secret) != g.commitment) revert InvalidSecret();

        g.claimedBy = msg.sender;
        g.state = State.Claimed;
        emit GiftClaimed(giftId, msg.sender);
    }

    /// @notice Called by the RSC after Unichain side has unwound and (in v1)
    ///   CCTP has burned-and-minted USDC to this contract. Forwards to the
    ///   address that successfully claimed.
    function deliverGift(bytes32 giftId, uint128 amount)
        external
        rvmIdOnly(rvm_id)
        authorizedSenderOnly
    {
        GiftEntry storage g = gifts[giftId];
        if (g.state != State.Claimed) revert InvalidGiftState();
        g.state = State.Delivered;
        usdc.safeTransfer(g.claimedBy, amount);
        emit GiftDelivered(giftId, g.claimedBy, amount);
    }

    function giftCount() external view returns (uint256) {
        return allGiftIds.length;
    }
}
