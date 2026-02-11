// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {DemoDao} from "../src/demo/DemoDao.sol";
import {PPUSD} from "../src/Constants.sol";

contract DeployDemoDao is Script {
    uint constant MIN_TOKENS_TO_PROPOSE = 10 ether;
    uint constant MIN_TOKENS_TO_VOTE = 10 ether;
    uint constant VOTING_PERIOD = 100 days;
    uint constant QUORUM_PERCENTAGE = 400;

    function run() external {
        vm.startBroadcast();

        DemoDao demoDao = new DemoDao(
            PPUSD,
            MIN_TOKENS_TO_PROPOSE,
            MIN_TOKENS_TO_VOTE,
            VOTING_PERIOD,
            QUORUM_PERCENTAGE
        );
        console.log("DemoDao deployed at:", address(demoDao));

        vm.stopBroadcast();
    }
}
