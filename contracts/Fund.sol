// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
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
    address public baseToken;

    constructor(
        address _owner,
        address _pricer,
        address _swapper,
        string memory _name,
        string memory _symbol,
        address[] memory _assets,
        uint256[] memory _allocations,
        address _baseToken,
        bool _variableAllocation
    ) ERC20Permit(_name) ERC20(_name, _symbol) Ownable(_owner) {
        uint256 assetsLength = _assets.length;
        if (assetsLength > maxAssets) revert TooManyAssets(assetsLength);
        if (assetsLength == 0) revert InsuffucientAssets();
        if (_allocations.length != assetsLength)
            revert IncorrectParameters(_assets, _allocations);
        assets = _assets;
        allocations = _allocations;
        baseToken = _baseToken;
        variableAllocation = _variableAllocation;
        openForInvestments = true;
    }

    modifier fundIsOpen() {
        if (!openForInvestments) revert NewInvestmentsClosed();
        _;
    }

    function calculateShares(
        IDvrsfyPricer _pricer,
        IUniswapV3Pool[] calldata _pools,
        uint256 _investment
    ) public view returns (uint256) {
        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) return 1000;
        uint256[] memory prices = _pricer.getPrices(_pools);
        uint256 _shares = 0;
        for (uint256 i = 0; i < assets.length; i++) {
            // Need to normalize the price to the same decimals as the asset
            _shares = IERC20(assets[i]).balanceOf(address(this)) * prices[i];
        }
        _shares = _shares / totalSupply();
        console.log(_shares);
        return _shares;
    }

    function invest(
        IDvrsfyPricer _pricer,
        IUniswapV3Pool[] calldata _pools,
        uint256 _amount,
        address _token
    ) public payable fundIsOpen {
        if (_amount == 0) revert("Implement custom error");
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        uint256 _investment = _amount;
        if (_token != assets[0]) {
            // get price of _token in terms of assets[0]
            // _investment = getPrice(_token);
        }
        uint256 _shares = calculateShares(_pricer, _pools, _investment);
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
