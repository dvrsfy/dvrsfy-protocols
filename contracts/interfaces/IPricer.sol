// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

interface IDvrsfyPricer {
    error InvalidFactory();

    event FactoryUpdated(address _uniswapV3Factory);

    function getPrices(
        address _baseToken,
        address[] calldata _assets,
        uint24[] calldata _fees
    ) external view returns (uint256[] memory _prices);

    function updateFactory(IUniswapV3Factory _uniswapV3Factory) external;

    function getETHPrice(
        address _baseToken,
        uint24 _fee
    ) external view returns (uint256 ethPrice);

    function validatePricingPools(
        address _baseToken,
        address[] calldata _assets,
        uint24[] calldata _fees
    ) external view returns (bool _areValid);
}
