// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

interface IDvrsfyPricer {
    error InvalidFactory();

    function getPrices(
        address _baseToken,
        address[] calldata _assets,
        uint24[] calldata _fees
    ) external view returns (uint256[] memory _prices);

    function updateFactory(IUniswapV3Factory _uniswapV3Factory) external;
}
