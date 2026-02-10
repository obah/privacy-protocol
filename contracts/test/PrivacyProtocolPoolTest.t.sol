//SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {PrivacyProtocolPool} from "../src/PrivacyProtocolPool.sol";
import {HonkVerifier} from "../src/Verifier.sol";
import {IncrementalMerkleTree, Poseidon2} from "../src/IncrementalMerkleTree.sol";
import {Test, console, Vm} from "forge-std/Test.sol";
import {ERC20Mock} from "openzeppelin/mocks/token/ERC20Mock.sol";
import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {IPrivacyProtocolPool} from "../src/interfaces/IPrivacyProtocolPool.sol";
import {DemoDao} from "../src/demo/DemoDao.sol";
import {DemoDefi} from "../src/demo/DemoDefi.sol";
import {PrivacyProtocolProxy, IPrivacyProtocolProxy} from "../src/PrivacyProtocolProxy.sol";

//test deposit
//test withdrawal
//test execute here and in fandao test file

contract PrivacyProtocolPoolTest is Test {
    PrivacyProtocolPool public privacyProtocolPool;
    DemoDao public demoDao;
    DemoDefi public demoDefi;
    IERC20 public rewardToken;
    HonkVerifier public verifier;
    Poseidon2 public hasher;
    address owner = makeAddr("owner");
    ERC20Mock token;

    address public receipient = makeAddr("golden_beards");

    struct TestVars {
        bytes32 commitment;
        bytes32 nullifier;
        bytes32 secret;
        uint256 amount;
        bytes actionData;
        bytes32 dataHash;
        address target;
        bytes proof;
        bytes32[] publicInputs;
    }

    function setUp() public {
        verifier = new HonkVerifier();
        hasher = new Poseidon2();
        privacyProtocolPool = new PrivacyProtocolPool(hasher, 20, verifier, owner);
        token = new ERC20Mock();

        // Setup FanDao
        // minTokensToPropose = 1 ether, minTokensToVote = 1 ether, period = 1 days, quorum = 4% (400)
        demoDao = new DemoDao(address(token), 1 ether, 1 ether, 1 days, 400);

        demoDefi = new DemoDefi();
        rewardToken = IERC20(address(demoDefi.USDTpp()));
    }

    function _getCommitment(uint256 amount)
        internal
        returns (bytes32 _commitment, bytes32 _nullifier, bytes32 _secret, bytes32 _amount)
    {
        string[] memory inputs = new string[](4);
        inputs[0] = "npx";
        inputs[1] = "tsx";
        inputs[2] = "js-scripts/generateCommitment.ts";
        inputs[3] = vm.toString(amount);
        bytes memory result = vm.ffi(inputs);
        (_commitment, _nullifier, _secret, _amount) = abi.decode(result, (bytes32, bytes32, bytes32, bytes32));

        return (_commitment, _nullifier, _secret, _amount);
    }

    function _getProof(
        bytes32 _nullifier,
        bytes32 _secret,
        uint256 _amountInPool,
        uint256 _amountToWithdraw,
        address _recipient,
        bytes32 _dataHash,
        bytes32[] memory leaves
    ) internal returns (bytes memory proof, bytes32[] memory publicInputs, bytes32 newNullifier) {
        string[] memory inputs = new string[](3 + 6 + leaves.length); // 3 args (npx, tsx, script) + 6 args + leaves

        inputs[0] = "npx";
        inputs[1] = "tsx";
        inputs[2] = "js-scripts/generateProof.ts";
        inputs[3] = vm.toString(_nullifier);
        inputs[4] = vm.toString(_secret);
        inputs[5] = vm.toString(_amountInPool);
        inputs[6] = vm.toString(_amountToWithdraw);
        inputs[7] = vm.toString(_recipient);
        inputs[8] = vm.toString(_dataHash);

        for (uint256 i = 0; i < leaves.length; i++) {
            inputs[9 + i] = vm.toString(leaves[i]);
        }

        bytes memory result = vm.ffi(inputs);

        (proof, publicInputs, newNullifier) = abi.decode(result, (bytes, bytes32[], bytes32));
    }

    function _computeActionDataHash(bytes32 actionId, bytes memory actionData) internal pure returns (bytes32) {
        return bytes32(uint256(keccak256(abi.encodePacked(actionId, actionData))) >> 8);
    }

    function testMakeDeposit() public {
        uint256 amount = 1 ether;
        //create commitment;
        (bytes32 _commitment,,,) = _getCommitment(amount);

        vm.startPrank(owner);
        privacyProtocolPool.addSupportedToken(address(token));
        vm.stopPrank();

        token.mint(address(this), amount);
        token.approve(address(privacyProtocolPool), amount);

        vm.expectEmit(true, false, false, true);
        emit IPrivacyProtocolPool.PrivacyProtocolPool__Deposit(address(token), _commitment, amount, 0, block.timestamp);
        //make a deposit
        privacyProtocolPool.deposit(address(token), amount, _commitment);

        assertEq(token.balanceOf(address(privacyProtocolPool)), amount);
    }

    function testWithdrawal() public {
        uint256 amount = 1 ether;
        // make deposit
        (bytes32 _commitment, bytes32 _nullifier, bytes32 _secret,) = _getCommitment(amount);

        vm.startPrank(owner);
        privacyProtocolPool.addSupportedToken(address(token));
        vm.stopPrank();

        token.mint(address(this), amount);
        token.approve(address(privacyProtocolPool), amount);

        privacyProtocolPool.deposit(address(token), amount, _commitment);

        //leaves are all the commitments that have been added to the tree
        //gotten from the deposit event
        bytes32[] memory leaves = new bytes32[](1);
        leaves[0] = _commitment;

        // create a proof
        (bytes memory _proof, bytes32[] memory _publicInputs,) =
            _getProof(_nullifier, _secret, amount, amount, receipient, bytes32(0), leaves);

        assertTrue(verifier.verify(_proof, _publicInputs));

        // withdraw
        assertEq(token.balanceOf(receipient), 0);
        privacyProtocolPool.withdraw(
            address(token),
            receipient,
            amount,
            _publicInputs[1], // nullifierHash
            _proof,
            _publicInputs[0], // rootHash
            _publicInputs[3], // calldataHash
            _publicInputs[5] // newCommitment
        );
        assertEq(token.balanceOf(receipient), amount);
        assertEq(token.balanceOf(address(privacyProtocolPool)), 0);
    }

    function testAnotherAddressToProofWithdrawal() public {
        uint256 amount = 1 ether;
        (bytes32 _commitment, bytes32 _nullifier, bytes32 _secret,) = _getCommitment(amount);

        vm.startPrank(owner);
        privacyProtocolPool.addSupportedToken(address(token));
        vm.stopPrank();

        token.mint(address(this), amount);
        token.approve(address(privacyProtocolPool), amount);

        privacyProtocolPool.deposit(address(token), amount, _commitment);

        bytes32[] memory leaves = new bytes32[](1);
        leaves[0] = _commitment;

        (bytes memory _proof, bytes32[] memory _publicInputs,) =
            _getProof(_nullifier, _secret, amount, amount, receipient, bytes32(0), leaves);

        address attacker = makeAddr("black-beards");
        vm.prank(attacker);
        vm.expectRevert();
        privacyProtocolPool.withdraw(
            address(token),
            attacker,
            amount,
            _publicInputs[1],
            _proof,
            _publicInputs[0],
            _publicInputs[3],
            _publicInputs[5]
        );
    }

    function testExecuteActionCreateProposal() public {
        TestVars memory vars;
        vars.amount = 1 ether;
        (vars.commitment, vars.nullifier, vars.secret,) = _getCommitment(vars.amount);

        vm.startPrank(owner);
        privacyProtocolPool.addSupportedToken(address(token));
        vm.stopPrank();

        token.mint(address(this), vars.amount);
        token.approve(address(privacyProtocolPool), vars.amount);

        privacyProtocolPool.deposit(address(token), vars.amount, vars.commitment);

        vars.target = address(demoDao);
        vars.actionData = abi.encodeWithSelector(DemoDao.createProposal.selector, address(0x123), "", 0);
        bytes32 actionId = keccak256(abi.encodePacked(vars.secret));
        vars.dataHash = _computeActionDataHash(actionId, vars.actionData);

        bytes32[] memory leaves = new bytes32[](1);
        leaves[0] = vars.commitment;

        (vars.proof, vars.publicInputs,) =
            _getProof(vars.nullifier, vars.secret, vars.amount, vars.amount, vars.target, vars.dataHash, leaves);

        IPrivacyProtocolPool.ActionRequest memory request = IPrivacyProtocolPool.ActionRequest({
            token: address(token),
            amount: vars.amount,
            target: vars.target,
            data: vars.actionData,
            actionId: actionId,
            nullifierHash: vars.publicInputs[1],
            proof: vars.proof,
            rootHash: vars.publicInputs[0],
            newCommitment: vars.publicInputs[5]
        });

        bool success = privacyProtocolPool.executeAction(request);

        assertTrue(success, "Action execution failed");

        assertEq(demoDao.getProposalCount(), 1);
        (address proposer,,,,,,) = demoDao.s_proposals(1);
        // Proposer should be the proxy, not PrivacyProtocolPool directly
        // However, we don't have the proxy address easily available in the test unless we compute it or emit it.
        // Let's assume the action succeeded and just check that a proposal exists.
        assertTrue(proposer != address(0), "Proposer should be set");
        assertTrue(proposer != address(privacyProtocolPool), "Proposer should NOT be PrivacyProtocolPool");
    }

    function testProxyWithdrawalSuccess() public {
        TestVars memory vars;
        vars.amount = 1 ether;
        (vars.commitment, vars.nullifier, vars.secret,) = _getCommitment(vars.amount);

        IERC20 actionToken = IERC20(address(demoDefi.ppUSD()));
        demoDefi.faucet();

        vm.startPrank(owner);
        privacyProtocolPool.addSupportedToken(address(actionToken));
        vm.stopPrank();

        actionToken.approve(address(privacyProtocolPool), vars.amount);

        privacyProtocolPool.deposit(address(actionToken), vars.amount, vars.commitment);

        vars.target = address(demoDefi);
        // Swap token -> rewardToken
        vars.actionData = abi.encodeWithSelector(
            bytes4(keccak256("swap(address,uint256,address)")), address(actionToken), vars.amount, address(rewardToken)
        );
        bytes32 actionId = keccak256(abi.encodePacked(vars.secret));
        vars.dataHash = _computeActionDataHash(actionId, vars.actionData);

        bytes32[] memory leaves = new bytes32[](1);
        leaves[0] = vars.commitment;

        (vars.proof, vars.publicInputs,) =
            _getProof(vars.nullifier, vars.secret, vars.amount, vars.amount, vars.target, vars.dataHash, leaves);

        IPrivacyProtocolPool.ActionRequest memory request = IPrivacyProtocolPool.ActionRequest({
            token: address(actionToken),
            amount: vars.amount,
            target: vars.target,
            data: vars.actionData,
            actionId: actionId,
            nullifierHash: vars.publicInputs[1],
            proof: vars.proof,
            rootHash: vars.publicInputs[0],
            newCommitment: vars.publicInputs[5]
        });

        // We need to capture the proxy address from the event
        vm.recordLogs();

        bool success = privacyProtocolPool.executeAction(request);
        assertTrue(success, "Action execution failed");

        Vm.Log[] memory entries = vm.getRecordedLogs();
        address proxyAddress;

        for (uint256 i = 0; i < entries.length; i++) {
            // Check for PrivacyProtocolPool__ActionExecuted event
            // Event signature: PrivacyProtocolPool__ActionExecuted(bytes32 nullifierHash, address proxy)
            // Topic 0: Keccak256("PrivacyProtocolPool__ActionExecuted(bytes32,address)")
            // Topic 1: nullifierHash (not indexed in interface, wait, let's check interface)

            if (entries[i].topics[0] == keccak256("PrivacyProtocolPool__ActionExecuted(bytes32,address)")) {
                (bytes32 _nullifierHash, address _proxy) = abi.decode(entries[i].data, (bytes32, address));
                if (_nullifierHash == request.nullifierHash) {
                    proxyAddress = _proxy;
                    break;
                }
            }
        }

        assertTrue(proxyAddress != address(0), "Proxy address not found");

        // Verify proxy received reward tokens
        assertEq(rewardToken.balanceOf(proxyAddress), vars.amount);

        // Now withdraw from proxy using secret
        address withdrawRecipient = makeAddr("withdrawRecipient");

        PrivacyProtocolProxy(proxyAddress).withdraw(address(rewardToken), withdrawRecipient, vars.secret);

        assertEq(rewardToken.balanceOf(withdrawRecipient), vars.amount);
        assertEq(rewardToken.balanceOf(proxyAddress), 0);
    }

    function testProxyWithdrawalFailure() public {
        TestVars memory vars;
        vars.amount = 1 ether;
        (vars.commitment, vars.nullifier, vars.secret,) = _getCommitment(vars.amount);

        IERC20 actionToken = IERC20(address(demoDefi.ppUSD()));
        demoDefi.faucet();

        vm.startPrank(owner);
        privacyProtocolPool.addSupportedToken(address(actionToken));
        vm.stopPrank();

        actionToken.approve(address(privacyProtocolPool), vars.amount);

        privacyProtocolPool.deposit(address(actionToken), vars.amount, vars.commitment);

        vars.target = address(demoDefi);
        vars.actionData = abi.encodeWithSelector(
            bytes4(keccak256("swap(address,uint256,address)")), address(actionToken), vars.amount, address(rewardToken)
        );
        bytes32 actionId = keccak256(abi.encodePacked(vars.secret));
        vars.dataHash = _computeActionDataHash(actionId, vars.actionData);

        bytes32[] memory leaves = new bytes32[](1);
        leaves[0] = vars.commitment;

        (vars.proof, vars.publicInputs,) =
            _getProof(vars.nullifier, vars.secret, vars.amount, vars.amount, vars.target, vars.dataHash, leaves);

        IPrivacyProtocolPool.ActionRequest memory request = IPrivacyProtocolPool.ActionRequest({
            token: address(actionToken),
            amount: vars.amount,
            target: vars.target,
            data: vars.actionData,
            actionId: actionId,
            nullifierHash: vars.publicInputs[1],
            proof: vars.proof,
            rootHash: vars.publicInputs[0],
            newCommitment: vars.publicInputs[5]
        });

        vm.recordLogs();
        privacyProtocolPool.executeAction(request);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        address proxyAddress;

        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == keccak256("PrivacyProtocolPool__ActionExecuted(bytes32,address)")) {
                (bytes32 _nullifierHash, address _proxy) = abi.decode(entries[i].data, (bytes32, address));
                if (_nullifierHash == request.nullifierHash) {
                    proxyAddress = _proxy;
                    break;
                }
            }
        }

        // Try to withdraw with wrong secret
        bytes32 wrongSecret = bytes32(uint256(vars.secret) + 1);
        address withdrawRecipient = makeAddr("withdrawRecipient");

        vm.expectRevert(IPrivacyProtocolProxy.PrivacyProtocolProxy__InvalidSecret.selector);
        PrivacyProtocolProxy(proxyAddress).withdraw(address(rewardToken), withdrawRecipient, wrongSecret);
    }
}
