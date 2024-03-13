// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPricer {
    function getPrices(address[] _assets) external view returns (uint256);
}
