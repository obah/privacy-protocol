// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {PrivacyProtocolPool} from "../src/PrivacyProtocolPool.sol";
import {HonkVerifier} from "../src/Verifier.sol";
import {Poseidon2} from "poseidon/Poseidon2.sol";
import {ERC20Mock} from "openzeppelin/mocks/token/ERC20Mock.sol";
import {DemoDefi} from "../src/demo/DemoDefi.sol";
import {DemoDao} from "../src/demo/DemoDao.sol";

contract Deploy is Script {
    uint constant MIN_TOKENS_TO_PROPOSE = 10 ether;
    uint constant MIN_TOKENS_TO_VOTE = 10 ether;
    uint constant VOTING_PERIOD = 100 days;
    uint constant QUORUM_PERCENTAGE = 400;
    uint32 constant MERKLE_TREE_DEPTH = 20;

    function run() external {
        vm.startBroadcast();

        address deployerAddress = vm.envOr("DEPLOYER", address(0));
        console.log("Deploying from:", deployerAddress);

        Poseidon2 hasher = new Poseidon2();
        console.log("Poseidon2 deployed at:", address(hasher));

        HonkVerifier verifier = new HonkVerifier();
        console.log("HonkVerifier deployed at:", address(verifier));

        DemoDefi demoDefi = new DemoDefi();
        console.log("DemoDefi deployed at:", address(demoDefi));
        console.log("ppUSD deployed at:", address(demoDefi.ppUSD()));
        console.log("USDTpp deployed at:", address(demoDefi.USDTpp()));

        DemoDao demoDao = new DemoDao(
            address(demoDefi.ppUSD()),
            MIN_TOKENS_TO_PROPOSE,
            MIN_TOKENS_TO_VOTE,
            VOTING_PERIOD,
            QUORUM_PERCENTAGE
        );
        console.log("DemoDao deployed at:", address(demoDao));

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

        privacyProtocolPool.addSupportedToken(address(demoDefi.ppUSD()));
        console.log("Added ppUSD as supported token");

        demoDefi.faucet();
        console.log("Faucet minted 1000 ppUSD to deployer");

        vm.stopBroadcast();
    }
}
