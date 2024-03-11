// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Fund.sol";

contract FundFactory {
    address[] public funds;

    event FundCreated(address, string, string, address[], uint256[], bool);

    constructor() {}

    function createFund(
        string calldata _name,
        string calldata _symbol,
        address[] memory _assets,
        uint256[] memory _allocations,
        bool _variableAllocation
    ) external returns (address fund) {
        fund = address(
            new Fund{salt: keccak256(abi.encodePacked(block.timestamp))}(
                msg.sender,
                _name,
                _symbol,
                _assets,
                _allocations,
                _variableAllocation
            )
        );
        funds.push(fund);
        emit FundCreated(
            msg.sender,
            _name,
            _symbol,
            _assets,
            _allocations,
            _variableAllocation
        );
    }
}
