// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

interface IDvrsfyPricer {
    error InvalidFactory();

    function getPrices(
        IUniswapV3Pool[] calldata _pools
    ) external view returns (uint256[] memory _prices);
}
