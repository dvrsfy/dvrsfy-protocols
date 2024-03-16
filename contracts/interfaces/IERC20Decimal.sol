// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Interface for using the decimals function of ERC20 tokens
interface IERC20Decimals is IERC20 {
    /// @notice Returns the number of decimals for a given token
    /// @return The number of decimals for the token
    function decimals() external view returns (uint256);
}
