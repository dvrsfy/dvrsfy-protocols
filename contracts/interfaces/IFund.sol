// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "./IPricer.sol";
import "./ISwapper.sol";

interface IDvrsfyFund {
    error InsuffucientAssets();
    error IncorrectAllocation(uint256, uint256);
    error IncorrectParameters(address[], uint256[]);
    error InvestmentInsufficient();
    error NewInvestmentsClosed();
    error Unauthorized(address);
    error TooManyAssets(uint256);

    event FundOpened();
    event FundClosed();
    event SharesBought(address indexed investor, uint256 shares);
    event Investment(address[] _tokens, uint256[] _amounts);

    function buyShares(IDvrsfyPricer _pricer) external payable;

    function sellShares() external;

    function invest(
        address[] calldata _tokens,
        uint256[] calldata _amounts,
        IDvrsfySwapper.SwapParams[] calldata _swapParams
    ) external;

    function divest() external;

    function rebalance() external;

    function closeFund() external;

    function openFund() external;
}
