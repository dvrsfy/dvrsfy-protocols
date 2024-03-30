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
    uint256 public constant DIVISOR = 10000;
    uint256 public maxAssets = 10;
    uint256 public protocolFee;
    uint256 public managementFee;
    address public pricer;
    address payable public swapper;
    address public baseToken;
    address public fundManager;
    address public weth;

    constructor(
        address _owner,
        address _pricer,
        address _swapper,
        string memory _name,
        string memory _symbol,
        address _baseToken,
        address _weth,
        uint256 _protocolFee,
        uint256 _managementFee
    ) ERC20Permit(_name) ERC20(_name, _symbol) Ownable(_owner) {
        fundManager = _owner;
        swapper = payable(_swapper);
        baseToken = _baseToken;
        weth = _weth;
        openForInvestments = true;
        protocolFee = _protocolFee;
        managementFee = _managementFee;
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
                _fundValue +=
                    (IERC20(assets[i]).balanceOf(address(this)) *
                        prices[i] *
                        IERC20Decimals(address(this)).decimals()) /
                    IERC20Decimals(assets[i]).decimals();
            }
            _fundValue += ethPrice * (address(this).balance - _investment);
            _shares = (_investment * ethPrice * _totalSupply) / _fundValue;
        }
        return _shares;
    }

    function buyShares(IDvrsfyPricer _pricer) public payable fundIsOpen {
        if (msg.value == 0) revert InvestmentInsufficient();
        uint256 _shares = calculateShares(_pricer, msg.value);
        uint256 _protocolFee = (msg.value * protocolFee) / DIVISOR;
        payable(owner()).transfer(_protocolFee);
        payable(address(this)).transfer(msg.value - _protocolFee);
        _mint(msg.sender, _shares);
        emit SharesBought(msg.sender, _shares);
    }

    function sellShares(
        uint256 _shares,
        IDvrsfySwapper.SwapParams[] calldata _swapParams
    ) external payable {
        uint256 _totalSupply = totalSupply();
        uint256 _userBalance = balanceOf(msg.sender);
        if (_userBalance < _shares)
            revert InsufficientBalance(_shares, _userBalance);
        if (_swapParams.length != assets.length)
            revert InvalidSellInstructions(_swapParams, assets);
        uint256 _userShares = (_shares * address(this).balance) / _totalSupply;
        for (uint256 i = 0; i < assets.length; i++) {
            if (address(_swapParams[i].buyToken) != address(weth))
                revert InvalidTargetToken(address(_swapParams[i].buyToken));
            if (address(_swapParams[i].sellToken) != assets[i])
                revert InvalidInvestedToken(address(_swapParams[i].sellToken));
            if (
                _swapParams[i].sellAmount >
                (IERC20(assets[i]).balanceOf(address(this)) * _shares) /
                    totalSupply()
            )
                revert InsufficientBalance(
                    _swapParams[i].sellAmount,
                    IERC20(assets[i]).balanceOf(address(this))
                );
            _userShares += _approveAndDivest(_swapParams[i], 0, i);
        }
        uint256 _managementFee = (_userShares * managementFee) / DIVISOR;
        fundManager.call{value: _managementFee}("");
        msg.sender.call{value: _userShares - _managementFee}("");
        _burn(msg.sender, _shares);
        emit SharesSold(msg.sender, _shares);
    }

    function invest(
        address[] calldata _tokens,
        uint256[] calldata _amounts,
        uint256[] calldata _minAmountsBought,
        IDvrsfySwapper.SwapParams[] calldata _swapParams
    ) external fundManagerOnly {
        uint256 _fundAmount = address(this).balance;
        uint256 _totalInvestment = 0;
        for (uint256 i = 0; i < _swapParams.length; i++) {
            _totalInvestment += _swapParams[i].sellAmount;
            if (_totalInvestment >= _fundAmount) {
                revert InsufficientBalance(_totalInvestment, _fundAmount);
            }
            _approveAndInvest(_swapParams[i], _minAmountsBought[i]);
            assets.push(address(_swapParams[i].buyToken));
        }

        emit Investment(_tokens, _amounts);
    }

    function divest(
        address[] calldata _tokens,
        uint256[] calldata _amounts,
        uint256[] calldata _minAmountsBought,
        IDvrsfySwapper.SwapParams[] calldata _swapParams
    ) external fundManagerOnly {
        for (uint256 i = 0; i < _swapParams.length; i++) {
            if (_swapParams[i].buyToken != IERC20(weth))
                revert InvalidDivestementToken(
                    address(_swapParams[i].buyToken)
                );
            uint256 _fundAmount = _swapParams[i].sellToken.balanceOf(
                address(this)
            );
            if (_fundAmount < _swapParams[i].sellAmount) {
                revert InsufficientBalance(
                    _fundAmount,
                    _swapParams[i].sellAmount
                );
            }
            _approveAndDivest(_swapParams[i], 0, i);
        }
        emit Divestment(_tokens, _amounts);
    }

    function closeFund() external onlyOwner {
        openForInvestments = false;
        emit FundClosed();
    }

    function openFund() external onlyOwner {
        openForInvestments = true;
        emit FundOpened();
    }

    function _approveAndDivest(
        IDvrsfySwapper.SwapParams calldata params,
        uint256 _minAmountBought,
        uint256 _assetIndex
    ) public payable returns (uint256 _amountBought) {
        params.sellToken.approve(address(swapper), params.sellAmount);
        // Need to always have enough ETH to pay for the fee
        // Need to adjust the fee to be paid from the contract
        if (params.sellAmount == params.sellToken.balanceOf(address(this))) {
            assets[_assetIndex] = assets[assets.length - 1];
            assets.pop();
        }
        _amountBought = IDvrsfySwapper(swapper).swap{value: params.protocolFee}(
            params
        );
        if (_amountBought < _minAmountBought)
            revert MinimumAmountNotMet(_minAmountBought, _amountBought);
    }

    function _approveAndInvest(
        IDvrsfySwapper.SwapParams calldata params,
        uint256 _minAmountBought
    ) public payable returns (uint256 _amountBought) {
        require(
            address(this).balance >= params.sellAmount,
            "Insufficient balance"
        );
        params.sellToken.approve(address(swapper), params.sellAmount);
        _amountBought = IDvrsfySwapper(swapper).swap{value: params.sellAmount}(
            params
        );
        if (_amountBought < _minAmountBought)
            revert MinimumAmountNotMet(_minAmountBought, _amountBought);
    }

    function getAssets() external view returns (address[] memory) {
        return assets;
    }

    fallback() external payable {}

    receive() external payable {}
}
