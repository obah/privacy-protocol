// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "openzeppelin/proxy/utils/Initializable.sol";
import {IPrivacyProtocolProxy} from "./interfaces/IPrivacyProtocolProxy.sol";

contract PrivacyProtocolProxy is Initializable, IPrivacyProtocolProxy {
    using SafeERC20 for IERC20;

    bytes32 public override s_actionId;
    address public override s_privacyProtocolPool;

    function initialize(bytes32 _actionId, address _privacyProtocolPool) external override initializer {
        if (_privacyProtocolPool == address(0)) {
            revert PrivacyProtocolProxy__AddressZero();
        }

        s_actionId = _actionId;
        s_privacyProtocolPool = _privacyProtocolPool;
    }

    function execute(address token, uint256 amount, address target, bytes calldata data) external override {
        if (msg.sender != s_privacyProtocolPool) {
            revert PrivacyProtocolProxy__Unauthorized();
        }

        if (target == address(0)) {
            revert PrivacyProtocolProxy__AddressZero();
        }

        if (token != address(0) && amount > 0) {
            IERC20 tokenContract = IERC20(token);
            tokenContract.forceApprove(target, amount);
        }

        (bool success,) = target.call{value: 0}(data);
        if (!success) {
            revert PrivacyProtocolProxy__ExecutionFailed();
        }

        emit ActionExecuted(target, success);

        if (token != address(0) && amount > 0) {
            IERC20(token).forceApprove(target, 0);
        }
    }

    function withdraw(address token, address recipient, bytes32 secret) external override {
        if (keccak256(abi.encodePacked(secret)) != s_actionId) {
            revert PrivacyProtocolProxy__InvalidSecret();
        }

        if (recipient == address(0) || token == address(0)) {
            revert PrivacyProtocolProxy__AddressZero();
        }

        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        if (balance > 0) {
            tokenContract.safeTransfer(recipient, balance);
            emit FundsWithdrawn(token, recipient, balance);
        }
    }
}
