//SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console, Vm} from "forge-std/Test.sol";
import {DemoDefi} from "../src/demo/DemoDefi.sol";
import {ERC20Mock} from "openzeppelin/mocks/token/ERC20Mock.sol";

contract DemoDefiTest is Test {
    DemoDefi public demoDefi;
    ERC20Mock public token;
    ERC20Mock public rewardToken;

    function setUp() public {
        demoDefi = new DemoDefi();
        token = new ERC20Mock();
        rewardToken = new ERC20Mock();

        token.mint(address(this), 100 ether);
        token.approve(address(demoDefi), 100 ether);
    }

    function testSwap() public {
        demoDefi.swap(address(token), 100 ether, address(rewardToken));

        assertEq(token.balanceOf(address(this)), 0);
        assertEq(rewardToken.balanceOf(address(this)), 100 ether);
    }
}
