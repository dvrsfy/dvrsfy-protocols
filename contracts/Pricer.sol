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
        // IUniswapV3Pool[] calldata _pools
        address _baseToken,
        address[] calldata _assets,
        uint24[] calldata _fees
    ) external view returns (uint256[] memory _prices) {
        _prices = new uint256[](_assets.length);
        for (uint256 i = 0; i < _assets.length; i++) {
            address _pool = uniswapV3Factory.getPool(
                _baseToken,
                _assets[i],
                _fees[i]
            );
            (uint160 _sqrtPriceX96, , , , , , ) = IUniswapV3Pool(_pool).slot0();
            uint256 numerator1 = uint256(_sqrtPriceX96) *
                uint256(_sqrtPriceX96);
            uint256 numerator2 = 10 **
                IERC20Decimals(IUniswapV3Pool(_pool).token0()).decimals();
            _prices[i] = (numerator1 * numerator2) / (1 << 192);
        }
    }

    function getInvertedPrices(
        IUniswapV3Pool[] calldata _pools
    ) external view returns (uint256[] memory _prices) {
        uint256[] memory prices = new uint256[](_pools.length);
        // First price is the price of asset 0 by asset 0, so always 1
        prices[0] = 1;
        for (uint256 i = 0; i < _pools.length; i++) {
            (uint160 _sqrtPriceX96, , , , , , ) = _pools[i].slot0();
            prices[i] = ((1 << 96)) / _sqrtPriceX96;
        }
        return prices;
    }

    function updateFactory(IUniswapV3Factory _uniswapV3Factory) external {
        if (address(_uniswapV3Factory) == address(0)) revert InvalidFactory();
        uniswapV3Factory = _uniswapV3Factory;
    }
}
