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

    /// @dev Reactive Lasna's LogRecord.data drops the first 32 bytes of the
    /// on-chain data. We put a sacrificial address as field 0 of every event
    /// so the actual cargo (giftId, ...) starts where the RSC's abi.decode
    /// expects.
    event GiftMirrored(address discard, bytes32 giftId, bytes32 commitment, uint128 expectedAmount, uint64 expiresAt);
    event GiftClaimed(address discard, bytes32 giftId, address claimer);
    event GiftDelivered(address discard, bytes32 giftId, address recipient, uint128 amount);

    error UnknownGift();
    error InvalidGiftState();
    error InvalidSecret();
    error GiftExpired();
    error NotOwner();

    address public owner;

    constructor(address _callbackProxy, IERC20 _usdc, address _owner) AbstractCallback(_callbackProxy) payable {
        usdc = _usdc;
        owner = _owner;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Called by the RSC immediately after the deposit on the sender chain.
    function mintGiftEntry(
        bytes32 giftId,
        bytes32 commitment,
        uint128 expectedAmount,
        uint64  expiresAt
    ) external rvmIdOnly(rvm_id) authorizedSenderOnly {
        _mintGiftEntry(giftId, commitment, expectedAmount, expiresAt);
    }

    /// @notice Owner-gated fallback for testnet operation when an external
    /// relayer drives the cross-chain bridge instead of an RSC. Identical
    /// effect to mintGiftEntry; bypasses the AbstractCallback auth.
    function adminMintGiftEntry(
        bytes32 giftId,
        bytes32 commitment,
        uint128 expectedAmount,
        uint64  expiresAt
    ) external onlyOwner {
        _mintGiftEntry(giftId, commitment, expectedAmount, expiresAt);
    }

    function _mintGiftEntry(
        bytes32 giftId,
        bytes32 commitment,
        uint128 expectedAmount,
        uint64  expiresAt
    ) internal {
        if (gifts[giftId].state != State.None) revert InvalidGiftState();
        gifts[giftId] = GiftEntry({
            commitment: commitment,
            expectedAmount: expectedAmount,
            expiresAt: expiresAt,
            claimedBy: address(0),
            state: State.Mirrored
        });
        allGiftIds.push(giftId);
        emit GiftMirrored(address(this), giftId, commitment, expectedAmount, expiresAt);
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
        emit GiftClaimed(msg.sender, giftId, msg.sender);
    }

    /// @notice Called by the RSC after Unichain side has unwound and (in v1)
    ///   CCTP has burned-and-minted USDC to this contract. Forwards to the
    ///   address that successfully claimed.
    function deliverGift(bytes32 giftId, uint128 amount)
        external
        rvmIdOnly(rvm_id)
        authorizedSenderOnly
    {
        _deliverGift(giftId, amount);
    }

    /// @notice Owner-gated fallback equivalent of `deliverGift` for testnet
    /// operation under the relayer pattern.
    function adminDeliverGift(bytes32 giftId, uint128 amount) external onlyOwner {
        _deliverGift(giftId, amount);
    }

    function _deliverGift(bytes32 giftId, uint128 amount) internal {
        GiftEntry storage g = gifts[giftId];
        if (g.state != State.Claimed) revert InvalidGiftState();
        g.state = State.Delivered;
        usdc.safeTransfer(g.claimedBy, amount);
        emit GiftDelivered(address(this), giftId, g.claimedBy, amount);
    }

    function giftCount() external view returns (uint256) {
        return allGiftIds.length;
    }
}
