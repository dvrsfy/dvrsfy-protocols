// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Roles.sol";
import "./interfaces/IFund.sol";
import "./interfaces/IPricer.sol";
import "./interfaces/ISwapper.sol";
import "hardhat/console.sol";

contract Fund is IFund, ERC20Permit, Ownable {
    address[] public assets;
    uint256[] public allocations;
    bool public variableAllocation;
    bool public openForInvestments;
    uint256 public maxAssets = 10;

    constructor(
        address _owner,
        string memory _name,
        string memory _symbol,
        address[] memory _assets,
        uint256[] memory _allocations,
        bool _variableAllocation
    ) ERC20Permit(_name) ERC20(_name, _symbol) Ownable(_owner) {
        uint256 assetsLength = _assets.length;
        if (assetsLength > maxAssets) revert TooManyAssets(assetsLength);
        if (assetsLength == 0) revert InsuffucientAssets();
        if (_allocations.length != assetsLength)
            revert IncorrectParameters(_assets, _allocations);
        assets = _assets;
        allocations = _allocations;
        variableAllocation = _variableAllocation;
        openForInvestments = true;
    }

    modifier fundIsOpen() {
        require(openForInvestments, "Fund is closed");
        _;
    }

    function _calculateShares(
        uint256[] memory _userAllocations
    ) internal view returns (uint256 _shares) {
        // TODO - calculate the shares to be issued
        // for (uint256 i = 0; i < assets.length; i++) {
        //     _shares += (_userAllocations[i] * totalSupply()) / allocations[i];
        // }
        return 100;
    }

    function invest(
        uint256[] calldata _userAllocations,
        IPricer _pricer
    ) external fundIsOpen returns (uint256 _shares) {
        uint256 assetsLength = assets.length;
        uint256 userAllocationsLength = _userAllocations.length;
        if (userAllocationsLength != assetsLength)
            revert IncorrectAllocation(userAllocationsLength, assetsLength);
        _shares = _calculateShares(_userAllocations);
        // Need to get token prices to calculate the shares to be issued
        // if (variableAllocation) {
        //     for (uint256 i = 0; i < assetsLength; i++) {
        //         if (userAllocations[i] > allocations[i])
        //             revert IncorrectParameters(assets, userAllocations);
        //     }
        // }
        // for (uint256 i = 0; i < _userAllocations.length; i++) {
        // IERC20(assets[i]).transferFrom(msg.sender, address(this), _userAllocations[i]);
        // _mint(msg.sender, _userAllocations[i]);
        // }
        emit Investment(msg.sender, _userAllocations, _shares);
    }

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
