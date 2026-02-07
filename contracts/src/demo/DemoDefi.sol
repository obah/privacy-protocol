// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {ERC20Mock} from "openzeppelin/mocks/token/ERC20Mock.sol";

/**
 * @title DemoDefi
 * @notice A simple DEFI contract that allows users to swap tokens
 * @dev This contract is a simple example of a DEFI contract that allows users to swap tokens
 */
contract DemoDefi {
    function swap(address tokenIn, uint256 amountIn, address tokenOut) external {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        // Mint/transfer tokenOut to msg.sender (the proxy)
        // 1:1 swap ratio
        ERC20Mock(tokenOut).mint(msg.sender, amountIn);
    }
}
