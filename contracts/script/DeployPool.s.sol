// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {PrivacyProtocolPool} from "../src/PrivacyProtocolPool.sol";
import {Poseidon2} from "poseidon/Poseidon2.sol";
import {HonkVerifier} from "../src/Verifier.sol";

contract DeployPool is Script {
    uint32 constant MERKLE_TREE_DEPTH = 20;

    function run() external {
        vm.startBroadcast();

        address deployerAddress = vm.envOr("DEPLOYER", address(0));

        address poseidonAddress = vm.envOr("POSEIDON_ADDRESS", address(0));
        address verifierAddress = vm.envOr("VERIFIER_ADDRESS", address(0));

        Poseidon2 hasher;
        if (poseidonAddress != address(0)) {
            hasher = Poseidon2(poseidonAddress);
            console.log("Using existing Poseidon2 at:", address(hasher));
        } else {
            hasher = new Poseidon2();
            console.log("Deployed new Poseidon2 at:", address(hasher));
        }

        HonkVerifier verifier;
        if (verifierAddress != address(0)) {
            verifier = HonkVerifier(verifierAddress);
            console.log("Using existing HonkVerifier at:", address(verifier));
        } else {
            verifier = new HonkVerifier();
            console.log("Deployed new HonkVerifier at:", address(verifier));
        }

        PrivacyProtocolPool privacyProtocolPool = new PrivacyProtocolPool(
            hasher,
            MERKLE_TREE_DEPTH,
            verifier,
            deployerAddress
        );
        console.log(
            "PrivacyProtocolPool deployed at:",
            address(privacyProtocolPool)
        );

        vm.stopBroadcast();
    }
}
