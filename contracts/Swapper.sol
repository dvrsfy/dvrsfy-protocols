// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/ISwapper.sol";

contract DvrsfySwapper is IDvrsfySwapper {
    function swap(address[] calldata _assets) external view returns (uint256) {
        return 1;
    }
}
