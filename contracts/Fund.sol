// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IFund.sol";
import "./interfaces/IPricer.sol";
import "./interfaces/ISwapper.sol";
import "hardhat/console.sol";

contract DvrsfyFund is IDvrsfyFund, ERC20Permit, Ownable {
    address[] public assets;
    uint256[] public allocations;
    bool public variableAllocation;
    bool public openForInvestments;
    uint256 public maxAssets = 10;
    address public pricer;
    address public swapper;

    constructor(
        address _owner,
        address _pricer,
        address _swapper,
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
        if (!openForInvestments) revert NewInvestmentsClosed();
        _;
    }

    function calculateNAV(IDvrsfyPricer _pricer) public view returns (uint256) {
        uint256[] memory prices = _pricer.getPrices(assets);
        uint256 nav = 0;
        for (uint256 i = 0; i < assets.length; i++) {
            // Review math
            // nav += prices[i] * allocations[i];
        }
        return nav;
    }

    function invest(
        uint256 _shares,
        IDvrsfyPricer _pricer
    ) public payable fundIsOpen {
        calculateNAV(_pricer);
        // Transfer funds from investor to the fund (nav*_shares)

        // Q: Write me a line to transfer part of the msg.value to another wallet
        // A: wallet.transfer(msg.value/2);
        // wallet.transfer(msg.value / 2);
        // Collect protocol fee
        // Swap funds for assets
        // IDvrsfySwapper.swap(assets, _shares);
        _mint(msg.sender, _shares);
        emit Investment(msg.sender, _shares);
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

    fallback() external payable {}

    receive() external payable {}
}
