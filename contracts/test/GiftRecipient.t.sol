// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "solmate/src/test/utils/mocks/MockERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {GiftRecipient} from "../src/GiftRecipient.sol";

/// @notice Unit tests for GiftRecipient — the recipient-side claim state machine
/// (None → Mirrored → Claimed → Delivered) and its guard reverts. No PoolManager
/// needed; uses a MockERC20 as the delivered USDC.
contract TestGiftRecipient is Test {
    MockERC20 usdc;
    GiftRecipient recipient;

    address owner = address(this);
    address bob = address(0xB0B);
    address stranger = address(0x5747);

    // Convenience fixtures.
    bytes secret = bytes("Sparrow-Lantern-Quince-Driftwood");
    bytes32 commitment = keccak256(bytes("Sparrow-Lantern-Quince-Driftwood"));
    bytes32 giftId = keccak256("gift-1");
    uint128 constant EXPECTED = 1_000_000; // ~$1 (6dp)

    // Mirror the contract's events so expectEmit can match.
    event GiftMirrored(address discard, bytes32 giftId, bytes32 commitment, uint128 expectedAmount, uint64 expiresAt);
    event GiftClaimed(address discard, bytes32 giftId, address claimer);
    event GiftDelivered(address discard, bytes32 giftId, address recipient, uint128 amount);

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", 6);
        // callbackProxy + owner = this contract (admin* paths are owner-gated).
        recipient = new GiftRecipient(address(this), IERC20(address(usdc)), owner);
        // Pre-fund the recipient so deliveries can transfer out.
        usdc.mint(address(recipient), 100_000_000);
    }

    function _futureExpiry() internal view returns (uint64) {
        return uint64(block.timestamp + 30 days);
    }

    // ── mint / mirror ─────────────────────────────────────────────────────────

    function test_adminMint_setsMirrored() public {
        uint64 exp = _futureExpiry();
        vm.expectEmit(false, false, false, true, address(recipient));
        emit GiftMirrored(address(recipient), giftId, commitment, EXPECTED, exp);
        recipient.adminMintGiftEntry(giftId, commitment, EXPECTED, exp);

        (bytes32 c, uint128 amt, uint64 e, address claimedBy, GiftRecipient.State state) = recipient.gifts(giftId);
        assertEq(c, commitment);
        assertEq(amt, EXPECTED);
        assertEq(e, exp);
        assertEq(claimedBy, address(0));
        assertEq(uint8(state), uint8(GiftRecipient.State.Mirrored));
        assertEq(recipient.giftCount(), 1);
    }

    function test_mint_revertsOnDuplicate() public {
        recipient.adminMintGiftEntry(giftId, commitment, EXPECTED, _futureExpiry());
        vm.expectRevert(GiftRecipient.InvalidGiftState.selector);
        recipient.adminMintGiftEntry(giftId, commitment, EXPECTED, _futureExpiry());
    }

    function test_adminMint_revertsForNonOwner() public {
        vm.prank(stranger);
        vm.expectRevert(GiftRecipient.NotOwner.selector);
        recipient.adminMintGiftEntry(giftId, commitment, EXPECTED, _futureExpiry());
    }

    // ── claim ───────────────────────────────────────────────────────────────--

    function test_claim_happyPath() public {
        recipient.adminMintGiftEntry(giftId, commitment, EXPECTED, _futureExpiry());

        vm.expectEmit(false, false, false, true, address(recipient));
        emit GiftClaimed(bob, giftId, bob);
        vm.prank(bob);
        recipient.claimGift(giftId, secret);

        (, , , address claimedBy, GiftRecipient.State state) = recipient.gifts(giftId);
        assertEq(claimedBy, bob);
        assertEq(uint8(state), uint8(GiftRecipient.State.Claimed));
    }

    function test_claim_revertsWrongSecret() public {
        recipient.adminMintGiftEntry(giftId, commitment, EXPECTED, _futureExpiry());
        vm.prank(bob);
        vm.expectRevert(GiftRecipient.InvalidSecret.selector);
        recipient.claimGift(giftId, bytes("wrong-secret"));
    }

    function test_claim_revertsUnknownGift() public {
        vm.prank(bob);
        vm.expectRevert(GiftRecipient.UnknownGift.selector);
        recipient.claimGift(keccak256("does-not-exist"), secret);
    }

    function test_claim_revertsWhenExpired() public {
        uint64 exp = _futureExpiry();
        recipient.adminMintGiftEntry(giftId, commitment, EXPECTED, exp);
        vm.warp(uint256(exp) + 1);
        vm.prank(bob);
        vm.expectRevert(GiftRecipient.GiftExpired.selector);
        recipient.claimGift(giftId, secret);
    }

    function test_claim_revertsIfNotMirrored() public {
        recipient.adminMintGiftEntry(giftId, commitment, EXPECTED, _futureExpiry());
        vm.prank(bob);
        recipient.claimGift(giftId, secret); // → Claimed
        // Second claim: state is no longer Mirrored.
        vm.prank(bob);
        vm.expectRevert(GiftRecipient.InvalidGiftState.selector);
        recipient.claimGift(giftId, secret);
    }

    // ── deliver ─────────────────────────────────────────────────────────────--

    function test_deliver_happyPath() public {
        recipient.adminMintGiftEntry(giftId, commitment, EXPECTED, _futureExpiry());
        vm.prank(bob);
        recipient.claimGift(giftId, secret);

        uint256 before = usdc.balanceOf(bob);
        vm.expectEmit(false, false, false, true, address(recipient));
        emit GiftDelivered(address(recipient), giftId, bob, EXPECTED);
        recipient.adminDeliverGift(giftId, EXPECTED);

        assertEq(usdc.balanceOf(bob) - before, EXPECTED);
        (, , , , GiftRecipient.State state) = recipient.gifts(giftId);
        assertEq(uint8(state), uint8(GiftRecipient.State.Delivered));
    }

    function test_deliver_revertsIfNotClaimed() public {
        recipient.adminMintGiftEntry(giftId, commitment, EXPECTED, _futureExpiry());
        vm.expectRevert(GiftRecipient.InvalidGiftState.selector);
        recipient.adminDeliverGift(giftId, EXPECTED);
    }

    function test_deliver_revertsForNonOwner() public {
        recipient.adminMintGiftEntry(giftId, commitment, EXPECTED, _futureExpiry());
        vm.prank(bob);
        recipient.claimGift(giftId, secret);
        vm.prank(stranger);
        vm.expectRevert(GiftRecipient.NotOwner.selector);
        recipient.adminDeliverGift(giftId, EXPECTED);
    }
}
