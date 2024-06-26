// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IFundFactory.sol";
import "./Fund.sol";

contract DvrsfyFundFactory is IDvrsfyFundFactory, Ownable {
    address[] public funds;
    address public pricer;
    address public swapper;

    constructor(address _pricer, address _swapper) Ownable(msg.sender) {
        if (_pricer == address(0)) revert PricerNotSet();
        if (_swapper == address(0)) revert SwapperNotSet();
        pricer = _pricer;
        swapper = _swapper;
    }

    function createFund(
        string calldata _name,
        string calldata _symbol,
        address _baseToken,
        address _weth,
        uint256 _protocolFee,
        uint256 _managementFee
    ) external returns (address fund) {
        fund = address(
            new DvrsfyFund{salt: keccak256(abi.encodePacked(block.timestamp))}(
                msg.sender,
                pricer,
                swapper,
                _name,
                _symbol,
                _baseToken,
                _weth,
                _protocolFee,
                _managementFee
            )
        );
        funds.push(fund);
        emit FundCreated(
            msg.sender,
            pricer,
            swapper,
            _name,
            _symbol,
            _baseToken,
            _weth,
            _protocolFee,
            _managementFee
        );
    }

    function updatePricer(address _pricer) external {
        pricer = _pricer;
        emit PricerUpdated(_pricer);
    }

    function updateSwapper(address _swapper) external {
        swapper = _swapper;
        emit SwapperUpdated(_swapper);
    }
}
