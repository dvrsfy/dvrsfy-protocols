// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "./IPricer.sol";
import "./ISwapper.sol";

interface IDvrsfyFund {
    error InsuffucientAssets();
    error IncorrectAllocation(uint256, uint256);
    error IncorrectParameters(address[], uint256[]);
    error InsufficientBalance(uint256, uint256);
    error InvestmentInsufficient();
    error MinimumAmountNotMet(uint256, uint256);
    error NewInvestmentsClosed();
    error Unauthorized(address);
    error TooManyAssets(uint256);

    event Divestment(address[] _tokens, uint256[] _amounts);
    event FundOpened();
    event FundClosed();
    event Investment(address[] _tokens, uint256[] _amounts);
    event SharesBought(address indexed investor, uint256 shares);

    function buyShares(IDvrsfyPricer _pricer) external payable;

    function sellShares() external;

    function invest(
        address[] calldata _tokens,
        uint256[] calldata _amounts,
        uint256[] calldata _minAmountsBought,
        IDvrsfySwapper.SwapParams[] calldata _swapParams
    ) external;

    function divest(
        address[] calldata _tokens,
        uint256[] calldata _amounts,
        IDvrsfySwapper.SwapParams[] calldata _swapParams
    ) external;

    function closeFund() external;

    function openFund() external;
}
