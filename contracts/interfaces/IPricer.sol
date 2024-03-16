// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

interface IDvrsfyPricer {
    function getPrices(
        address[] calldata _assets
    ) external view returns (uint256[] memory _prices);

    function getPoolPrice(
        IUniswapV3Pool _pool,
        address _token0
    ) external view returns (uint256);
}
