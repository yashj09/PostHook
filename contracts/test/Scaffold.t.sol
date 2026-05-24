// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {GiftRecipient} from "../src/GiftRecipient.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Tiny smoke test — just confirms the toolchain is wired up.
/// Real flow tests come in Week 1 Day 5 (GiftFlow.t.sol).
contract ScaffoldTest is Test {
    function test_canConstructGiftRecipient() public {
        // Use this contract address as the "callback proxy" placeholder.
        // AbstractCallback.constructor takes any address; auth is enforced
        // at call time, not construction.
        GiftRecipient r = new GiftRecipient(address(this), IERC20(address(0xdead)), address(this));
        assertEq(r.giftCount(), 0);
    }
}
