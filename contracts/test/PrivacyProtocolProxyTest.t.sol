// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {PrivacyProtocolProxy} from "../src/PrivacyProtocolProxy.sol";
import {IPrivacyProtocolProxy} from "../src/interfaces/IPrivacyProtocolProxy.sol";
import {ERC20Mock} from "openzeppelin/mocks/token/ERC20Mock.sol";

contract MockTarget {
    event Called(bytes data);
    event TokensReceived(address token, uint256 amount);

    function mockCall() external payable {
        emit Called(msg.data);
    }

    function mockCallWithTokens(address token, uint256 amount) external {
        ERC20Mock(token).transferFrom(msg.sender, address(this), amount);
        emit TokensReceived(token, amount);
    }

    function mockRevert() external pure {
        revert("Mock target revert");
    }
}

contract PrivacyProtocolProxyTest is Test {
    PrivacyProtocolProxy public proxy;
    ERC20Mock public token;
    MockTarget public target;

    address public pool = makeAddr("pool");
    address public user = makeAddr("user");
    bytes32 public actionId;
    bytes32 public secret;

    function setUp() public {
        proxy = new PrivacyProtocolProxy();
        token = new ERC20Mock();
        target = new MockTarget();

        // Generate a random secret and actionId
        secret = keccak256(abi.encodePacked("mySecret"));
        actionId = keccak256(abi.encodePacked(secret));

        // Initialize proxy
        proxy.initialize(actionId, pool);
    }

    /*//////////////////////////////////////////////////////////////
                            INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    function testInitialize() public view {
        assertEq(proxy.s_actionId(), actionId);
        assertEq(proxy.s_privacyProtocolPool(), pool);
    }

    function testCannotInitializeTwice() public {
        vm.expectRevert(); // Initializable: contract is already initialized
        proxy.initialize(actionId, pool);
    }

    /*//////////////////////////////////////////////////////////////
                                EXECUTE
    //////////////////////////////////////////////////////////////*/

    function testExecuteRevertIfUnauthorized() public {
        vm.prank(user);
        vm.expectRevert(IPrivacyProtocolProxy.PrivacyProtocolProxy__Unauthorized.selector);
        proxy.execute(address(0), 0, address(target), abi.encodeWithSelector(MockTarget.mockCall.selector));
    }

    function testExecuteSuccess() public {
        vm.prank(pool);
        vm.expectEmit(true, true, true, true);
        emit IPrivacyProtocolProxy.ActionExecuted(address(target), true);

        proxy.execute(address(0), 0, address(target), abi.encodeWithSelector(MockTarget.mockCall.selector));
    }

    function testExecuteWithTokens() public {
        uint256 amount = 100 ether;
        token.mint(address(proxy), amount);

        vm.prank(pool);
        proxy.execute(
            address(token),
            amount,
            address(target),
            abi.encodeWithSelector(MockTarget.mockCallWithTokens.selector, address(token), amount)
        );

        assertEq(token.balanceOf(address(target)), amount);
        assertEq(token.balanceOf(address(proxy)), 0);
    }

    function testExecuteRevertIfExecutionFailed() public {
        vm.prank(pool);
        vm.expectRevert(IPrivacyProtocolProxy.PrivacyProtocolProxy__ExecutionFailed.selector);
        proxy.execute(address(0), 0, address(target), abi.encodeWithSelector(MockTarget.mockRevert.selector));
    }

    /*//////////////////////////////////////////////////////////////
                                WITHDRAW
    //////////////////////////////////////////////////////////////*/

    function testWithdrawSuccess() public {
        uint256 amount = 50 ether;
        token.mint(address(proxy), amount);

        proxy.withdraw(address(token), user, secret);

        assertEq(token.balanceOf(user), amount);
        assertEq(token.balanceOf(address(proxy)), 0);
    }

    function testWithdrawRevertIfInvalidSecret() public {
        uint256 amount = 50 ether;
        token.mint(address(proxy), amount);
        bytes32 wrongSecret = keccak256("wrong");

        vm.expectRevert(IPrivacyProtocolProxy.PrivacyProtocolProxy__InvalidSecret.selector);
        proxy.withdraw(address(token), user, wrongSecret);
    }

    function testWithdrawNoBalance() public {
        // Should not revert but transfer 0
        proxy.withdraw(address(token), user, secret);
        assertEq(token.balanceOf(user), 0);
    }
}
