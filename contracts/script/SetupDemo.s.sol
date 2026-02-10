// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {PrivacyProtocolPool} from "../src/PrivacyProtocolPool.sol";
import {DemoDefi} from "../src/demo/DemoDefi.sol";
import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";

contract SetupDemo is Script {
    function run() external {
        vm.startBroadcast();

        address poolAddress = vm.envOr("POOL_ADDRESS", address(0));
        address demoDefiAddress = vm.envOr("DEMO_DEFI_ADDRESS", address(0));

        if (poolAddress == address(0)) {
            console.log("Error: POOL_ADDRESS env var not set");
            return;
        }
        if (demoDefiAddress == address(0)) {
            console.log("Error: DEMO_DEFI_ADDRESS env var not set");
            return;
        }

        PrivacyProtocolPool pool = PrivacyProtocolPool(poolAddress);
        DemoDefi demoDefi = DemoDefi(demoDefiAddress);
        address ppUSD = address(demoDefi.ppUSD());

        if (!pool.isTokenSupported(ppUSD)) {
            pool.addSupportedToken(ppUSD);
            console.log("Added ppUSD as supported token");
        } else {
            console.log("ppUSD is already supported");
        }

        demoDefi.faucet();
        console.log("Faucet minted 1000 ppUSD to deployer");

        vm.stopBroadcast();
    }
}
