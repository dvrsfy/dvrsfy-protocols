// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFund {
    error InsuffucientAssets();
    error IncorrectAllocation(uint256, uint256);
    error IncorrectParameters(address[], uint256[]);
    error TooManyAssets(uint256);

    event FundOpened();
    event FundClosed();
    event Investment(
        address indexed investor,
        uint256[] allocations,
        uint256 shares
    );

    function invest(uint256[] calldata) external;

    function divest() external;

    function rebalance() external;

    function freezeAllocation() external;

    function closeFund() external;

    function openFund() external;
}
