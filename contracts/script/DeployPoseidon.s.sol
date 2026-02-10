// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {Poseidon2} from "poseidon/Poseidon2.sol";

contract DeployPoseidon is Script {
    function run() external {
        vm.startBroadcast();

        Poseidon2 hasher = new Poseidon2();
        console.log("Poseidon2 deployed at:", address(hasher));

        vm.stopBroadcast();
    }
}
