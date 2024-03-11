// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFund {
    error InsuffucientAssets();
    error IncorrectParameters(address[], uint256[]);

    event FundOpened();
    event FundClosed();

    function invest() external;

    function divest() external;

    function rebalance() external;

    function freezeAllocation() external;

    function closeFund() external;

    function openFund() external;
}
