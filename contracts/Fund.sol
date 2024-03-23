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
    bool public openForInvestments;
    uint256 public maxAssets = 10;
    address public pricer;
    address public swapper;
    address public baseToken;
    address public fundManager;

    constructor(
        address _owner,
        address _pricer,
        address _swapper,
        string memory _name,
        string memory _symbol,
        address _baseToken
    ) ERC20Permit(_name) ERC20(_name, _symbol) Ownable(_owner) {
        fundManager = _owner;
        baseToken = _baseToken;
        openForInvestments = true;
    }

    modifier fundIsOpen() {
        if (!openForInvestments) revert NewInvestmentsClosed();
        _;
    }

    modifier fundManagerOnly() {
        if (msg.sender != fundManager) revert Unauthorized(msg.sender);
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

    function buyShares(IDvrsfyPricer _pricer) public payable fundIsOpen {
        if (msg.value == 0) revert InvestmentInsufficient();
        uint256 _investment = msg.value;
        uint256 _shares = calculateShares(_pricer, _investment);
        // Swap funds for assets
        // IDvrsfySwapper.swap(assets, _shares);
        _mint(msg.sender, _shares);
        emit SharesBought(msg.sender, _shares);
    }

    function sellShares() external {}

    function invest(
        address[] calldata _tokens,
        uint256[] calldata _amounts,
        IDvrsfySwapper.SwapParams[] calldata _swapParams
    ) external fundManagerOnly {
        emit Investment(_tokens, _amounts);
    }

    function divest() external {}

    function rebalance() external {}

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
