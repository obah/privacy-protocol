// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {PrivacyProtocolPool} from "../src/PrivacyProtocolPool.sol";
import {HonkVerifier} from "../src/Verifier.sol";
import {Poseidon2} from "poseidon/Poseidon2.sol";
import {ERC20Mock} from "openzeppelin/mocks/token/ERC20Mock.sol";
import {DemoDefi} from "../src/demo/DemoDefi.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        address deployerAddress = vm.envOr(
            "DEPLOYER",
            address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
        );
        console.log("Deploying from:", deployerAddress);

        Poseidon2 hasher = new Poseidon2();
        console.log("Poseidon2 deployed at:", address(hasher));

        HonkVerifier verifier = new HonkVerifier();
        console.log("HonkVerifier deployed at:", address(verifier));

        // ERC20Mock token = new ERC20Mock();
        // console.log("ERC20Mock deployed at:", address(token));

        DemoDefi demoDefi = new DemoDefi();
        console.log("DemoDefi deployed at:", address(demoDefi));
        console.log("ppUSD deployed at:", address(demoDefi.ppUSD()));
        console.log("USDTpp deployed at:", address(demoDefi.USDTpp()));

        PrivacyProtocolPool privacyProtocolPool = new PrivacyProtocolPool(
            hasher,
            20,
            verifier,
            deployerAddress
        );
        console.log(
            "PrivacyProtocolPool deployed at:",
            address(privacyProtocolPool)
        );

        // privacyProtocolPool.addSupportedToken(address(token));
        // console.log("Added ERC20Mock as supported token");

        privacyProtocolPool.addSupportedToken(address(demoDefi.ppUSD()));
        console.log("Added ppUSD as supported token");

        // token.mint(deployerAddress, 1000 ether);
        // console.log("Minted 1000 ether of ERC20Mock to deployer");

        demoDefi.faucet();
        console.log("Faucet minted 1000 ppUSD to deployer");

        vm.stopBroadcast();
    }
}

//   Deploying from: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
//   Poseidon2 deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
//   HonkVerifier deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
//   DemoDefi deployed at: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
//   ppUSD deployed at: 0x75537828f2ce51be7289709686A69CbFDbB714F1
//   USDTpp deployed at: 0xE451980132E65465d0a498c53f0b5227326Dd73F
//   PrivacyProtocolPool deployed at: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
//   Added ppUSD as supported token
//   Faucet minted 1000 ppUSD to deployer

//anvil
//forge script deploy
//export PRIVACY_PROTOCOL_POOL_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
//export TOKEN_ADDRESS=0x75537828f2ce51be7289709686A69CbFDbB714F1
//npx tsx sdk/scripts/test-sdk.ts
