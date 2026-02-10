// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import {ERC20} from "openzeppelin/token/ERC20/ERC20.sol";

contract DemoToken is ERC20 {
    address private immutable i_minter;

    constructor(string memory name_, string memory symbol_, address minter_) ERC20(name_, symbol_) {
        i_minter = minter_;
    }

    function mint(address account, uint256 amount) external {
        if (msg.sender != i_minter) {
            revert("DemoToken: Unauthorized");
        }
        _mint(account, amount);
    }
}

/**
 * @title DemoDefi
 * @notice Demo swap venue with faucet token for privacy protocol walkthroughs.
 */
contract DemoDefi {
    using SafeERC20 for IERC20;

    DemoToken public immutable ppUSD;
    DemoToken public immutable USDTpp;
    uint256 public constant FAUCET_AMOUNT = 1000 ether;

    constructor() {
        ppUSD = new DemoToken("ppUSD", "ppUSD", address(this));
        USDTpp = new DemoToken("USDTpp", "USDTpp", address(this));
    }

    function faucet() external {
        ppUSD.mint(msg.sender, FAUCET_AMOUNT);
    }

    function swap(uint256 amountIn) external {
        _swapPpUsdToUsdtpp(msg.sender, amountIn);
    }

    function swap(address tokenIn, uint256 amountIn, address tokenOut) external {
        if (tokenIn != address(ppUSD) || tokenOut != address(USDTpp)) {
            revert("DemoDefi: Unsupported pair");
        }
        _swapPpUsdToUsdtpp(msg.sender, amountIn);
    }

    function _swapPpUsdToUsdtpp(address account, uint256 amountIn) internal {
        IERC20(address(ppUSD)).safeTransferFrom(account, address(this), amountIn);
        USDTpp.mint(account, amountIn);
    }
}
