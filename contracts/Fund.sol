// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IFund.sol";
import "./interfaces/IPricer.sol";
import "./interfaces/ISwapper.sol";
import "./interfaces/IERC20Decimal.sol";
import "hardhat/console.sol";

contract DvrsfyFund is IDvrsfyFund, ERC20Permit, Ownable {
    address[] public assets;
    uint256[] public allocations;
    uint24[] public pricingFees;
    IUniswapV3Pool[] public pricingPools;
    bool public variableAllocation;
    bool public openForInvestments;
    uint256 public maxAssets = 10;
    address public pricer;
    address public swapper;
    address public baseToken;
    uint256 constant FUND_DECIMALS = 18;
    mapping(address => bool) public investmentTokens;

    constructor(
        address _owner,
        address _pricer,
        address _swapper,
        string memory _name,
        string memory _symbol,
        address[] memory _assets,
        uint256[] memory _allocations,
        uint24[] memory _pricingFees,
        address _baseToken,
        bool _variableAllocation
    ) ERC20Permit(_name) ERC20(_name, _symbol) Ownable(_owner) {
        uint256 assetsLength = _assets.length;
        if (assetsLength > maxAssets) revert TooManyAssets(assetsLength);
        if (assetsLength == 0) revert InsuffucientAssets();
        if (_allocations.length != assetsLength)
            revert IncorrectParameters(_assets, _allocations);
        assets = _assets;
        for (uint256 i = 0; i < assetsLength; ) {
            investmentTokens[_assets[i]] = true;
            unchecked {
                i++;
            }
        }
        allocations = _allocations;
        baseToken = _baseToken;
        pricingFees = _pricingFees;
        variableAllocation = _variableAllocation;
        openForInvestments = true;
    }

    modifier fundIsOpen() {
        if (!openForInvestments) revert NewInvestmentsClosed();
        _;
    }

    function calculateShares(
        IDvrsfyPricer _pricer,
        uint256 _investment
    ) public view returns (uint256) {
        uint256 _fundValue = 0;
        uint256 _shares = 0;
        uint256 _totalSupply = totalSupply();
        uint256[] memory prices = _pricer.getPrices(
            baseToken,
            assets,
            pricingFees
        );
        uint256 ethPrice = _pricer.getETHPrice(baseToken, 500);
        if (_totalSupply == 0) {
            _shares = _investment;
        } else {
            for (uint256 i = 0; i < assets.length; i++) {
                // Need to normalize the price to the same decimals as the asset
                _fundValue +=
                    IERC20(assets[i]).balanceOf(address(this)) *
                    prices[i];
            }
            _fundValue += ethPrice * (address(this).balance - _investment);
            _shares = (_investment * ethPrice * _totalSupply) / _fundValue;
        }
        return _shares;
    }

    function invest(IDvrsfyPricer _pricer) public payable fundIsOpen {
        uint256 _investment = msg.value;
        uint256 _shares = calculateShares(_pricer, _investment);
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
