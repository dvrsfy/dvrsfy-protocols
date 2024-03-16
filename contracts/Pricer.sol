// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@uniswap/v3-periphery/contracts/libraries/LiquidityAmounts.sol";
import "./interfaces/IPricer.sol";
import "./interfaces/IERC20Decimal.sol";

contract DvrsfyPricer is IDvrsfyPricer {
    constructor() {}

    function getPrices(
        address[] calldata _assets
    ) external view returns (uint256[] memory _prices) {
        uint256[] memory prices = new uint256[](_assets.length);
        // First price is the price of asset 0 by asset 0, so always 1
        prices[0] = 1;
        for (uint256 i = 1; i < _assets.length - 1; i++) {
            prices[i] = getPoolPrice(IUniswapV3Pool(_assets[i]), _assets[0]);
        }
        return prices;
    }

    /// @notice Calculates the latest Uniswap price in the pool, with token1 represented in the price of token0.
    /// @param _pool Address of the Uniswap V3 pool.
    /// @param _token0 Address of token0 in the pool.
    function getPoolPrice(
        IUniswapV3Pool _pool,
        address _token0
    ) public view returns (uint256) {
        (uint160 sqrtPriceX96, , , , , , ) = _pool.slot0();
        uint256 numerator1 = uint256(sqrtPriceX96) * uint256(sqrtPriceX96);
        uint256 numerator2 = 10 ** IERC20Decimals(_token0).decimals();
        return (numerator1 * numerator2) / (1 << 192);
    }
}
