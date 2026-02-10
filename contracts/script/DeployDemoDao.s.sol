// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {DemoDao} from "../src/demo/DemoDao.sol";
import {DemoDefi} from "../src/demo/DemoDefi.sol";

contract DeployDemoDao is Script {
    function run() external {
        vm.startBroadcast();

        address governanceTokenAddress = vm.envOr(
            "GOVERNANCE_TOKEN_ADDRESS",
            address(0)
        );
        address demoDefiAddress = vm.envOr("DEMO_DEFI_ADDRESS", address(0));

        if (governanceTokenAddress == address(0)) {
            if (demoDefiAddress != address(0)) {
                DemoDefi demoDefi = DemoDefi(demoDefiAddress);
                governanceTokenAddress = address(demoDefi.ppUSD());
                console.log(
                    "Using ppUSD from DemoDefi at:",
                    governanceTokenAddress
                );
            } else {
                console.log(
                    "Error: GOVERNANCE_TOKEN_ADDRESS or DEMO_DEFI_ADDRESS env var must be set"
                );
                return;
            }
        }

        uint256 minTokensToPropose = vm.envOr(
            "DAO_MIN_PROPOSE",
            uint256(100 ether)
        );
        uint256 minTokensToVote = vm.envOr("DAO_MIN_VOTE", uint256(10 ether));
        uint256 votingPeriod = vm.envOr("DAO_VOTING_PERIOD", uint256(3 days));
        uint256 quorumPercentage = vm.envOr("DAO_QUORUM", uint256(400)); // 4%

        DemoDao demoDao = new DemoDao(
            governanceTokenAddress,
            minTokensToPropose,
            minTokensToVote,
            votingPeriod,
            quorumPercentage
        );
        console.log("DemoDao deployed at:", address(demoDao));

        vm.stopBroadcast();
    }
}
