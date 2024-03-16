// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IPricer.sol";

contract DvrsfyPricer is IDvrsfyPricer {
    function getPrices(
        address[] calldata _assets
    ) external view returns (uint256[] memory _prices) {
        uint256[] memory prices = new uint256[](_assets.length);
        // First price is the price of asset 0 by asset 0, so always 1
        prices[0] = 1;
        for (uint256 i = 1; i < _assets.length - 1; i++) {
            prices[i] = 1;
        }
        return prices;
    }
}
