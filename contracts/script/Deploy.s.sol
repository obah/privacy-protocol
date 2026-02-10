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
            10 ether,
            1 ether,
            10 days,
            400
        );
        console.log("DemoDao deployed at:", address(demoDao));

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

        privacyProtocolPool.addSupportedToken(address(demoDefi.ppUSD()));
        console.log("Added ppUSD as supported token");

        demoDefi.faucet();
        console.log("Faucet minted 1000 ppUSD to deployer");

        vm.stopBroadcast();
    }
}

// == Logs ==
//   Deploying from: 0x0000000000000000000000000000000000000000
//   Poseidon2 deployed at: 0xe06d39562bB02Aa92a3c55495Ef3dFb27f679f83
//   HonkVerifier deployed at: 0x4eE4661b8Ad32Ca08fED028Fe1490303f6D61BDA
//   DemoDefi deployed at: 0xA8DCc58D83Cae0FfF1076832Ef7E5a5D9B96D9d7
//   ppUSD deployed at: 0xba2A1482708e56b21f8EC7842650381855645c9A
//   USDTpp deployed at: 0x9eB5C2080E98c44b15cfd5a822414380458A7634
//   DemoDao deployed at: 0xEf7317a48f0e16B405706BD373627A846885dEB8
//   PrivacyProtocolPool deployed at: 0xA0806cf43f5E9A2C42c8291676EE814b39A6413e
//   Added ppUSD as supported token
//   Faucet minted 1000 ppUSD to deployer

//anvil
//forge script deploy
//export PRIVACY_PROTOCOL_POOL_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
//export TOKEN_ADDRESS=0x75537828f2ce51be7289709686A69CbFDbB714F1
//npx tsx sdk/scripts/test-sdk.ts
