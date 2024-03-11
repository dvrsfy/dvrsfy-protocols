// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IFund.sol";
import "hardhat/console.sol";

contract Fund is IFund, ERC20Permit, Ownable {
    address[] public assets;
    uint256[] public allocations;
    bool public variableAllocation;
    bool public openForInvestments;

    constructor(
        address _owner,
        string memory _name,
        string memory _symbol,
        address[] memory _assets,
        uint256[] memory _allocations,
        bool _variableAllocation
    ) ERC20Permit(_name) ERC20(_name, _symbol) Ownable(_owner) {
        if (_assets.length == 0) revert InsuffucientAssets();
        if (_allocations.length != _assets.length)
            revert IncorrectParameters(_assets, _allocations);
        assets = _assets;
        allocations = _allocations;
        variableAllocation = _variableAllocation;
        openForInvestments = true;
    }

    function invest() external {}

    function divest() external {}

    function rebalance() external {}

    function freezeAllocation() public onlyOwner {
        variableAllocation = true;
    }

    function closeFund() external onlyOwner {
        openForInvestments = false;
        emit FundClosed();
    }

    function openFund() external onlyOwner {
        openForInvestments = true;
        emit FundOpened();
    }
}
