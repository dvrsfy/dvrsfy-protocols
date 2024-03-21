// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@uniswap/v3-periphery/contracts/libraries/LiquidityAmounts.sol";
import "./interfaces/IPricer.sol";
import "./interfaces/IERC20Decimal.sol";
import "hardhat/console.sol";

contract DvrsfyPricer is IDvrsfyPricer {
    IUniswapV3Factory uniswapV3Factory;

    constructor(IUniswapV3Factory _uniswapV3Factory) {
        if (address(_uniswapV3Factory) == address(0)) revert InvalidFactory();
        uniswapV3Factory = _uniswapV3Factory;
    }

    function getPrices(
        // pass tokens and get pool iwth the UniswapFactory
        IUniswapV3Pool[] calldata _pools
    ) external view returns (uint256[] memory _prices) {
        uint256[] memory prices = new uint256[](_pools.length);
        // First price is the price of asset 0 by asset 0, so always 1
        address pool = uniswapV3Factory.getPool(
            _pools[0].token0(),
            _pools[0].token1(),
            3000
        );
        console.log(pool);
        prices[0] = 1;
        for (uint256 i = 0; i < _pools.length; i++) {
            (uint160 sqrtPriceX96, , , , , , ) = _pools[i].slot0();
            uint256 numerator1 = uint256(sqrtPriceX96) * uint256(sqrtPriceX96);
            uint256 numerator2 = 10 **
                IERC20Decimals(_pools[i].token0()).decimals();
            prices[i] = (numerator1 * numerator2) / (1 << 192);
        }
        return prices;
    }

    function getInvertedPrices(
        IUniswapV3Pool[] calldata _pools
    ) external view returns (uint256[] memory _prices) {
        uint256[] memory prices = new uint256[](_pools.length);
        // First price is the price of asset 0 by asset 0, so always 1
        prices[0] = 1;
        for (uint256 i = 0; i < _pools.length; i++) {
            (uint160 sqrtPriceX96, , , , , , ) = _pools[i].slot0();
            prices[i] = ((1 << 96)) / sqrtPriceX96;
        }
        return prices;
    }

    function updateFactory(IUniswapV3Factory _uniswapV3Factory) external {
        if (address(_uniswapV3Factory) == address(0)) revert InvalidFactory();
        uniswapV3Factory = _uniswapV3Factory;
    }
}
