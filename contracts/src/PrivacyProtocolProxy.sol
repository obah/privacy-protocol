// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {Initializable} from "openzeppelin/proxy/utils/Initializable.sol";
import {IPrivacyProtocolProxy} from "./interfaces/IPrivacyProtocolProxy.sol";

contract PrivacyProtocolProxy is Initializable, IPrivacyProtocolProxy {
    bytes32 public override s_actionId;
    address public override s_fanPool;

    function initialize(bytes32 _actionId, address _fanPool) external override initializer {
        s_actionId = _actionId;
        s_fanPool = _fanPool;
    }

    function execute(address token, uint256 amount, address target, bytes calldata data) external override {
        if (msg.sender != s_fanPool) {
            revert PrivacyProtocolProxy__Unauthorized();
        }

        if (token != address(0) && amount > 0) {
            IERC20(token).approve(target, 0);
            IERC20(token).approve(target, amount);
        }

        (bool success,) = target.call{value: 0}(data);
        if (!success) {
            revert PrivacyProtocolProxy__ExecutionFailed();
        }

        emit ActionExecuted(target, success);

        if (token != address(0) && amount > 0) {
            IERC20(token).approve(target, 0);
        }
    }

    function withdraw(address token, address recipient, bytes32 secret) external override {
        if (keccak256(abi.encodePacked(secret)) != s_actionId) {
            revert PrivacyProtocolProxy__InvalidSecret();
        }

        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            bool success = IERC20(token).transfer(recipient, balance);
            if (!success) revert PrivacyProtocolProxy__TransferFailed();
            emit FundsWithdrawn(token, recipient, balance);
        }
    }
}
