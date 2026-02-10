// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./interfaces/IPrivacyProtocolPool.sol";
import {IncrementalMerkleTree, Poseidon2} from "./IncrementalMerkleTree.sol";
import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "openzeppelin/utils/ReentrancyGuard.sol";
import {IVerifier} from "./Verifier.sol";
import {Ownable} from "openzeppelin/access/Ownable.sol";
import {Clones} from "openzeppelin/proxy/Clones.sol";
import {PrivacyProtocolProxy} from "./PrivacyProtocolProxy.sol";

contract PrivacyProtocolPool is IPrivacyProtocolPool, IncrementalMerkleTree, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using Clones for address;

    bytes32 private constant IMPLEMENTATION_LOCK_ACTION_ID = bytes32(uint256(1));
    bytes4 private constant INCREASE_ALLOWANCE_SELECTOR = 0x39509351;
    bytes4 private constant DECREASE_ALLOWANCE_SELECTOR = 0xa457c2d7;
    bytes4 private constant PERMIT_SELECTOR = 0xd505accf;

    IVerifier private s_verifier;
    PrivacyProtocolProxy public immutable i_privacyProtocolProxyImplementation;

    mapping(address tokenAddress => uint256 balance) public s_tokenBalances;
    mapping(bytes32 commitments => bool isUsed) public s_commitments;
    mapping(bytes32 nullifierHashes => bool isUsed) public s_nullifierHashes;
    mapping(address tokenAddress => bool isSupported) public s_supportedTokens;

    constructor(Poseidon2 _hasher, uint32 _merkleTreeDepth, IVerifier _verifier, address initialOwner)
        IncrementalMerkleTree(_merkleTreeDepth, _hasher)
        Ownable(initialOwner)
    {
        if (address(_verifier) == address(0) || address(_verifier).code.length == 0) {
            revert PrivacyProtocolPool__InvalidVerifier(address(_verifier));
        }

        s_verifier = _verifier;

        PrivacyProtocolProxy implementation = new PrivacyProtocolProxy();
        implementation.initialize(IMPLEMENTATION_LOCK_ACTION_ID, address(this));
        i_privacyProtocolProxyImplementation = implementation;
    }

    function deposit(address token, uint256 amount, bytes32 commitment) external nonReentrant {
        if (s_commitments[commitment]) {
            revert PrivacyProtocolPool__CommitmentAlreadyUsed(commitment);
        }

        if (amount == 0) {
            revert PrivacyProtocolPool__InvalidAmount();
        }

        if (!s_supportedTokens[token]) {
            revert PrivacyProtocolPool__TokenNotSupported(token);
        }

        IERC20 tokenContract = IERC20(token);
        uint256 balanceBefore = tokenContract.balanceOf(address(this));
        tokenContract.safeTransferFrom(msg.sender, address(this), amount);
        uint256 receivedAmount = tokenContract.balanceOf(address(this)) - balanceBefore;

        if (receivedAmount != amount) {
            revert PrivacyProtocolPool__UnsupportedTokenBehavior(token, amount, receivedAmount);
        }

        s_tokenBalances[token] += receivedAmount;

        uint32 _insertedLeafIndex = _insert(commitment);
        s_commitments[commitment] = true;

        emit PrivacyProtocolPool__Deposit(token, commitment, receivedAmount, _insertedLeafIndex, block.timestamp);
    }

    function withdraw(
        address token,
        address recipient,
        uint256 amount,
        bytes32 nullifierHash,
        bytes calldata proof,
        bytes32 rootHash,
        bytes32 calldataHash,
        bytes32 newCommitment
    ) external nonReentrant {
        if (!s_supportedTokens[token]) {
            revert PrivacyProtocolPool__TokenNotSupported(token);
        }

        if (recipient == address(0)) {
            revert PrivacyProtocolPool__InvalidRecipient(recipient);
        }

        if (s_commitments[newCommitment]) {
            revert PrivacyProtocolPool__CommitmentAlreadyUsed(newCommitment);
        }

        if (s_nullifierHashes[nullifierHash]) {
            revert PrivacyProtocolPool__NullifierUsed(nullifierHash);
        }

        if (!isKnownRoot(rootHash)) {
            revert PrivacyProtocolPool__InvalidRootHash(rootHash);
        }

        uint256 availableBalance = s_tokenBalances[token];
        if (availableBalance < amount) {
            revert PrivacyProtocolPool__InsufficientBalance(token, amount, availableBalance);
        }

        bytes32[] memory publicInputs = new bytes32[](6);
        publicInputs[0] = rootHash;
        publicInputs[1] = nullifierHash;
        publicInputs[2] = bytes32(uint256(uint160(recipient)));
        publicInputs[3] = calldataHash;
        publicInputs[4] = bytes32(amount);
        publicInputs[5] = newCommitment;

        bool isVerified = s_verifier.verify(proof, publicInputs);
        if (!isVerified) {
            revert PrivacyProtocolPool__InvalidProof();
        }

        s_nullifierHashes[nullifierHash] = true;
        s_tokenBalances[token] = availableBalance - amount;

        uint32 _insertedLeafIndex = _insert(newCommitment);
        s_commitments[newCommitment] = true;

        IERC20(token).safeTransfer(recipient, amount);

        emit PrivacyProtocolPool__Withdrawal(
            newCommitment, recipient, token, amount, _insertedLeafIndex, block.timestamp
        );
    }

    function executeAction(ActionRequest calldata request) external nonReentrant returns (bool success) {
        bytes calldata actionData = request.data;

        if (request.target == address(this) || request.target == address(0)) {
            revert PrivacyProtocolPool__ExecutionFailed();
        }

        if (!s_supportedTokens[request.token]) {
            revert PrivacyProtocolPool__TokenNotSupported(request.token);
        }

        if (request.target == request.token) {
            revert PrivacyProtocolPool__TargetIsToken(request.token);
        }

        if (s_commitments[request.newCommitment]) {
            revert PrivacyProtocolPool__CommitmentAlreadyUsed(request.newCommitment);
        }

        if (s_nullifierHashes[request.nullifierHash]) {
            revert PrivacyProtocolPool__NullifierUsed(request.nullifierHash);
        }

        uint256 availableBalance = s_tokenBalances[request.token];
        if (availableBalance < request.amount) {
            revert PrivacyProtocolPool__InsufficientBalance(request.token, request.amount, availableBalance);
        }

        // Prevent direct token allowance/transfer operations from being proxied.
        if (actionData.length >= 4) {
            bytes4 selector;
            assembly ("memory-safe") {
                selector := calldataload(actionData.offset)
            }
            if (
                selector == IERC20.approve.selector || selector == IERC20.transfer.selector
                    || selector == IERC20.transferFrom.selector || selector == INCREASE_ALLOWANCE_SELECTOR
                    || selector == DECREASE_ALLOWANCE_SELECTOR || selector == PERMIT_SELECTOR
            ) {
                revert PrivacyProtocolPool__ExecutionFailed();
            }
        }

        if (!isKnownRoot(request.rootHash)) {
            revert PrivacyProtocolPool__InvalidRootHash(request.rootHash);
        }

        bytes32[] memory publicInputs = new bytes32[](6);
        publicInputs[0] = request.rootHash;
        publicInputs[1] = request.nullifierHash;
        publicInputs[2] = bytes32(uint256(uint160(request.target)));
        publicInputs[3] = bytes32(uint256(keccak256(abi.encodePacked(request.actionId, actionData))) >> 8);
        publicInputs[4] = bytes32(request.amount);
        publicInputs[5] = request.newCommitment;

        if (!s_verifier.verify(request.proof, publicInputs)) {
            revert PrivacyProtocolPool__InvalidProof();
        }

        s_nullifierHashes[request.nullifierHash] = true;

        address proxy = address(i_privacyProtocolProxyImplementation).clone();
        PrivacyProtocolProxy(proxy).initialize(request.actionId, address(this));

        if (request.amount > 0) {
            s_tokenBalances[request.token] = availableBalance - request.amount;
            IERC20(request.token).safeTransfer(proxy, request.amount);
        }

        PrivacyProtocolProxy(proxy).execute(request.token, request.amount, request.target, actionData);

        _insert(request.newCommitment);
        s_commitments[request.newCommitment] = true;

        emit PrivacyProtocolPool__ActionExecuted(request.nullifierHash, proxy);

        success = true;
    }

    function isKnownRoot(bytes32 _root) public view returns (bool) {
        if (_root == bytes32(0)) {
            return false;
        }

        uint32 _currentIndex = s_currentRootIndex;
        uint32 i = _currentIndex;

        do {
            if (_root == s_roots[i]) {
                return true;
            }

            if (i == 0) {
                i = ROOT_MAX_SIZE;
            }
            i--;
        } while (i != _currentIndex);

        return false;
    }

    function addSupportedToken(address token) external onlyOwner {
        if (token == address(0)) {
            revert PrivacyProtocolPool__AddressZero();
        }

        if (s_supportedTokens[token]) {
            revert PrivacyProtocolPool__TokenSupported(token);
        }

        s_supportedTokens[token] = true;

        emit PrivacyProtocolPool__TokenAdded(token, block.timestamp);
    }

    // function removeSupportedToken(address token) external onlyOwner {
    //     if (token == address(0)) {
    //         revert PrivacyProtocolPool__AddressZero();
    //     }

    //     if (!s_supportedTokens[token]) {
    //         revert PrivacyProtocolPool__TokenNotSupported(token);
    //     }

    //     s_supportedTokens[token] = false;

    //     emit PrivacyProtocolPool__TokenRemoved(token, block.timestamp);
    // }

    function isTokenSupported(address token) external view returns (bool) {
        return s_supportedTokens[token];
    }

    function updateVerifier(address newVerifier) external onlyOwner {
        if (newVerifier == address(0) || newVerifier.code.length == 0) {
            revert PrivacyProtocolPool__InvalidVerifier(newVerifier);
        }

        s_verifier = IVerifier(newVerifier);

        emit PrivacyProtocolPool__VerifierUpdated(newVerifier, block.timestamp);
    }

    function getVerifier() external view returns (address) {
        return address(s_verifier);
    }
}
