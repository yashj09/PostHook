// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDT} from "../src/MockUSDT.sol";

contract DeployMockUSDT is Script {
    function run() external returns (MockUSDT token) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        token = new MockUSDT();
        vm.stopBroadcast();
        console.log("MockUSDT deployed at:", address(token));
        console.log("Update UNICHAIN_SEPOLIA_USDT in .env with this address.");
    }
}
