// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDT
/// @notice Trivial 6-decimal mintable ERC-20 used as the second stable in the
/// gift pool on Unichain Sepolia (which doesn't ship a canonical USDT).
/// Anyone can mint; do not deploy to mainnet.
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock Tether USD", "mUSDT") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
