// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {HonkVerifier} from "../src/Verifier.sol";

contract DeployVerifier is Script {
    function run() external {
        vm.startBroadcast();

        HonkVerifier verifier = new HonkVerifier();
        console.log("HonkVerifier deployed at:", address(verifier));

        vm.stopBroadcast();
    }
}
