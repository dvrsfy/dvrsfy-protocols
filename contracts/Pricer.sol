// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IPricer.sol";

contract DvrsfyPricer is IDvrsfyPricer {
    function getPrices(
        address[] calldata _assets
    ) external view returns (uint256[] memory _prices) {
        uint256[] memory prices = new uint256[](_assets.length - 1);
        for (uint256 i = 0; i < _assets.length - 1; i++) {
            prices[i] = 1;
        }
        return prices;
    }
}
