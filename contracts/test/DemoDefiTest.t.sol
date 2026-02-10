//SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {DemoDefi} from "../src/demo/DemoDefi.sol";
import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";

contract DemoDefiTest is Test {
    DemoDefi public demoDefi;
    IERC20 public token;
    IERC20 public rewardToken;

    function setUp() public {
        demoDefi = new DemoDefi();
        token = IERC20(address(demoDefi.ppUSD()));
        rewardToken = IERC20(address(demoDefi.USDTpp()));

        demoDefi.faucet();
        token.approve(address(demoDefi), 100 ether);
    }

    function testSwap() public {
        demoDefi.swap(address(token), 100 ether, address(rewardToken));

        assertEq(token.balanceOf(address(this)), 900 ether);
        assertEq(rewardToken.balanceOf(address(this)), 100 ether);
    }
}
