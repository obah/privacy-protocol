// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IPrivacyProtocolProxy {
    error PrivacyProtocolProxy__InvalidSecret();
    error PrivacyProtocolProxy__Unauthorized();
    error PrivacyProtocolProxy__ExecutionFailed();
    error PrivacyProtocolProxy__TransferFailed();
    error PrivacyProtocolProxy__AddressZero();

    event ActionExecuted(address indexed target, bool success);
    event FundsWithdrawn(address indexed token, address indexed recipient, uint256 amount);

    function initialize(bytes32 _actionId, address _privacyProtocolPool) external;

    function execute(address token, uint256 amount, address target, bytes calldata data) external;

    function withdraw(address token, address recipient, bytes32 secret) external;

    function s_actionId() external view returns (bytes32);

    function s_privacyProtocolPool() external view returns (address);
}
