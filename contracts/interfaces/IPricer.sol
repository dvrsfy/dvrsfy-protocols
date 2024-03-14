// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDvrsfyPricer {
    function getPrices(
        address[] calldata _assets
    ) external view returns (uint256[] memory _prices);
}
