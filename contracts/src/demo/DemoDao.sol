// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "openzeppelin/utils/ReentrancyGuard.sol";

/**
 * @title DemoDao
 * @notice A simple DAO contract that allows members to create proposals, vote, execute, and close proposals
 * @dev Members are defined by holding a minimum amount of governance tokens
 */
contract DemoDao is ReentrancyGuard {
    // ============ Errors ============
    error DemoDao__NotAMember();
    error DemoDao__ProposalDoesNotExist();
    error DemoDao__ProposalNotActive();
    error DemoDao__ProposalStillActive();
    error DemoDao__ProposalAlreadyExecuted();
    error DemoDao__ProposalNotPassed();
    error DemoDao__VotingPeriodEnded();
    error DemoDao__ExecutionFailed();
    error DemoDao__InvalidVotingPeriod();
    error DemoDao__InvalidQuorum();
    error DemoDao__AddressZero();
    error DemoDao__InsufficientTokenBalance();

    // ============ Types ============
    enum ProposalStatus {
        Active,
        Passed,
        Failed,
        Executed,
        Closed
    }

    struct ProposalCore {
        address proposer;
        address target;
        uint256 value;
        uint256 startTime;
        uint256 endTime;
        ProposalStatus status;
        bool executed;
    }

    struct ProposalVotes {
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
    }

    // ============ Events ============
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address target,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId, bool success);
    event ProposalClosed(uint256 indexed proposalId, ProposalStatus status);

    // ============ State Variables ============
    IERC20 public immutable governanceToken;
    uint256 public immutable minTokensToPropose;
    uint256 public immutable minTokensToVote;
    uint256 public immutable votingPeriod;
    uint256 public immutable quorumPercentage;

    uint256 public s_proposalCount;
    mapping(uint256 => ProposalCore) public s_proposals;
    mapping(uint256 => ProposalVotes) public s_proposalVotes;
    mapping(uint256 => bytes) public s_proposalData;
    mapping(uint256 => mapping(address => bool)) public s_hasVoted;

    // ============ Modifiers ============
    modifier onlyMember() {
        if (governanceToken.balanceOf(msg.sender) < minTokensToVote) {
            revert DemoDao__NotAMember();
        }
        _;
    }

    modifier proposalExists(uint256 proposalId) {
        if (proposalId == 0 || proposalId > s_proposalCount) {
            revert DemoDao__ProposalDoesNotExist();
        }
        _;
    }

    // ============ Constructor ============
    constructor(
        address _governanceToken,
        uint256 _minTokensToPropose,
        uint256 _minTokensToVote,
        uint256 _votingPeriod,
        uint256 _quorumPercentage
    ) {
        if (_governanceToken == address(0)) {
            revert DemoDao__AddressZero();
        }
        if (_votingPeriod == 0) {
            revert DemoDao__InvalidVotingPeriod();
        }
        if (_quorumPercentage == 0 || _quorumPercentage > 10000) {
            revert DemoDao__InvalidQuorum();
        }

        governanceToken = IERC20(_governanceToken);
        minTokensToPropose = _minTokensToPropose;
        minTokensToVote = _minTokensToVote;
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
    }

    // ============ External Functions ============

    function createProposal(
        address target,
        bytes calldata data,
        uint256 value
    ) external returns (uint256 proposalId) {
        if (governanceToken.balanceOf(msg.sender) < minTokensToPropose) {
            revert DemoDao__InsufficientTokenBalance();
        }

        s_proposalCount++;
        proposalId = s_proposalCount;

        s_proposals[proposalId] = ProposalCore({
            proposer: msg.sender,
            target: target,
            value: value,
            startTime: block.timestamp,
            endTime: block.timestamp + votingPeriod,
            status: ProposalStatus.Active,
            executed: false
        });

        s_proposalData[proposalId] = data;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            target,
            block.timestamp,
            block.timestamp + votingPeriod
        );
    }

    function vote(
        uint256 proposalId,
        uint8 support
    ) external onlyMember proposalExists(proposalId) {
        ProposalCore storage proposal = s_proposals[proposalId];

        if (proposal.status != ProposalStatus.Active) {
            revert DemoDao__ProposalNotActive();
        }

        if (block.timestamp > proposal.endTime) {
            revert DemoDao__VotingPeriodEnded();
        }

        uint256 voterWeight = 1;

        ProposalVotes storage votes = s_proposalVotes[proposalId];
        if (support == 0) {
            votes.againstVotes += voterWeight;
        } else if (support == 1) {
            votes.forVotes += voterWeight;
        } else {
            votes.abstainVotes += voterWeight;
        }

        emit VoteCast(proposalId, msg.sender, support, voterWeight);
    }

    function execute(
        uint256 proposalId
    ) external nonReentrant proposalExists(proposalId) {
        ProposalCore storage proposal = s_proposals[proposalId];

        if (proposal.executed) {
            revert DemoDao__ProposalAlreadyExecuted();
        }

        if (block.timestamp <= proposal.endTime) {
            revert DemoDao__ProposalStillActive();
        }

        if (proposal.status == ProposalStatus.Active) {
            _finalizeProposal(proposalId);
        }

        if (proposal.status != ProposalStatus.Passed) {
            revert DemoDao__ProposalNotPassed();
        }

        proposal.executed = true;
        proposal.status = ProposalStatus.Executed;

        bytes memory data = s_proposalData[proposalId];
        (bool success, ) = proposal.target.call{value: proposal.value}(data);

        if (!success) {
            revert DemoDao__ExecutionFailed();
        }

        emit ProposalExecuted(proposalId, success);
    }

    function closeProposal(
        uint256 proposalId
    ) external proposalExists(proposalId) {
        ProposalCore storage proposal = s_proposals[proposalId];

        if (proposal.status != ProposalStatus.Active) {
            revert DemoDao__ProposalNotActive();
        }

        if (block.timestamp <= proposal.endTime) {
            revert DemoDao__ProposalStillActive();
        }

        _finalizeProposal(proposalId);

        emit ProposalClosed(proposalId, proposal.status);
    }

    // ============ View Functions ============

    function getProposalCount() external view returns (uint256) {
        return s_proposalCount;
    }

    function hasVoted(
        uint256 proposalId,
        address voter
    ) external view returns (bool) {
        return s_hasVoted[proposalId][voter];
    }

    function hasReachedQuorum(uint256 proposalId) public view returns (bool) {
        ProposalVotes storage votes = s_proposalVotes[proposalId];
        uint256 totalVotes = votes.forVotes +
            votes.againstVotes +
            votes.abstainVotes;

        return totalVotes >= (quorumPercentage * 10);
    }

    function isMember(address account) external view returns (bool) {
        return governanceToken.balanceOf(account) >= minTokensToVote;
    }

    // ============ Internal Functions ============

    function _finalizeProposal(uint256 proposalId) internal {
        ProposalCore storage proposal = s_proposals[proposalId];
        ProposalVotes storage votes = s_proposalVotes[proposalId];

        bool quorumReached = hasReachedQuorum(proposalId);
        bool passed = quorumReached && votes.forVotes > votes.againstVotes;

        if (passed) {
            proposal.status = ProposalStatus.Passed;
        } else {
            proposal.status = ProposalStatus.Failed;
        }
    }

    receive() external payable {}
}
