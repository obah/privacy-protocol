// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {DemoDefi} from "../src/demo/DemoDefi.sol";

contract DeployDemoDefi is Script {
    function run() external {
        vm.startBroadcast();

        DemoDefi demoDefi = new DemoDefi();
        console.log("DemoDefi deployed at:", address(demoDefi));
        console.log("ppUSD deployed at:", address(demoDefi.ppUSD()));
        console.log("USDTpp deployed at:", address(demoDefi.USDTpp()));

        vm.stopBroadcast();
    }
}
