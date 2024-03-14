// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDvrsfySwapper {
    function swap(address[] calldata _assets) external view returns (uint256);
}
