//SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {DemoDao} from "../src/demo/DemoDao.sol";
import {ERC20Mock} from "openzeppelin/mocks/token/ERC20Mock.sol";

contract DemoDaoTest is Test {
    DemoDao demoDao;
    ERC20Mock governanceToken;

    address OWNER = makeAddr("OWNER");
    address VOTER1 = makeAddr("VOTER1");
    address VOTER2 = makeAddr("VOTER2");
    address NON_MEMBER = makeAddr("NON_MEMBER");

    uint256 constant MIN_TOKENS_TO_PROPOSE = 100 ether;
    uint256 constant MIN_TOKENS_TO_VOTE = 10 ether;
    uint256 constant VOTING_PERIOD = 3 days;
    uint256 constant QUORUM_PERCENTAGE = 400; // 4%

    function setUp() public {
        governanceToken = new ERC20Mock();
        demoDao = new DemoDao(
            address(governanceToken),
            MIN_TOKENS_TO_PROPOSE,
            MIN_TOKENS_TO_VOTE,
            VOTING_PERIOD,
            QUORUM_PERCENTAGE
        );

        governanceToken.mint(OWNER, 1000 ether);
        governanceToken.mint(VOTER1, 500 ether);
        governanceToken.mint(VOTER2, 300 ether);
    }

    // ============ Create Proposal Test ============

    function testCreateProposal() public {
        vm.prank(OWNER);
        uint256 proposalId = demoDao.createProposal(address(0x123), "", 0);

        assertEq(proposalId, 1);
        assertEq(demoDao.getProposalCount(), 1);

        (address proposer, , , , , , ) = demoDao.s_proposals(proposalId);
        assertEq(proposer, OWNER);
    }

    // ============ Vote Tests ============

    function testVote() public {
        vm.prank(OWNER);
        uint256 proposalId = demoDao.createProposal(address(0x123), "", 0);

        vm.prank(VOTER1);
        demoDao.vote(proposalId, 1); // For

        vm.prank(VOTER2);
        demoDao.vote(proposalId, 0); // Against

        (uint256 forVotes, uint256 againstVotes, ) = demoDao.s_proposalVotes(
            proposalId
        );

        assertEq(forVotes, 1);
        assertEq(againstVotes, 1);
    }

    function testVoteRevertsForNonMember() public {
        vm.prank(OWNER);
        uint256 proposalId = demoDao.createProposal(address(0x123), "", 0);

        vm.prank(NON_MEMBER);
        vm.expectRevert(DemoDao.DemoDao__NotAMember.selector);
        demoDao.vote(proposalId, 1);
    }

    // ============ Execute Test ============

    function testExecute() public {
        MockTarget mockTarget = new MockTarget();

        vm.prank(OWNER);
        uint256 proposalId = demoDao.createProposal(
            address(mockTarget),
            abi.encodeWithSignature("doSomething()"),
            0
        );

        uint256 votesNeeded = 4001; // Just above threshold
        for (uint i = 0; i < votesNeeded; i++) {
            vm.prank(OWNER);
            demoDao.vote(proposalId, 1);
        }

        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        demoDao.execute(proposalId);

        (, , , , , DemoDao.ProposalStatus status, bool executed) = demoDao
            .s_proposals(proposalId);
        assertTrue(executed);
        assertEq(uint8(status), uint8(DemoDao.ProposalStatus.Executed));
        assertTrue(mockTarget.called());
    }

    // ============ Close Proposal Test ============

    function testCloseProposal() public {
        vm.prank(OWNER);
        uint256 proposalId = demoDao.createProposal(address(0x123), "", 0);

        uint256 votesNeeded = 4001;
        for (uint i = 0; i < votesNeeded; i++) {
            vm.prank(OWNER);
            demoDao.vote(proposalId, 1);
        }

        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        demoDao.closeProposal(proposalId);

        (, , , , , DemoDao.ProposalStatus status, ) = demoDao.s_proposals(
            proposalId
        );
        assertEq(uint8(status), uint8(DemoDao.ProposalStatus.Passed));
    }
}

contract MockTarget {
    bool public called;

    function doSomething() external {
        called = true;
    }

    receive() external payable {}
}
