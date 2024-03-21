// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "./IPricer.sol";

interface IDvrsfyFund {
    error InsuffucientAssets();
    error IncorrectAllocation(uint256, uint256);
    error IncorrectParameters(address[], uint256[]);
    error NewInvestmentsClosed();
    error Unauthorized(address);
    error TooManyAssets(uint256);

    event FundOpened();
    event FundClosed();
    event Investment(address indexed investor, uint256 shares);

    function invest(
        IDvrsfyPricer _pricer,
        uint256 _amount,
        address _token
    ) external payable;

    function divest() external;

    function rebalance() external;

    function freezeAllocation() external;

    function closeFund() external;

    function openFund() external;
}
