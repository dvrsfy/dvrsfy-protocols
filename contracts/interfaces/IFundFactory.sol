// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDvrsfyFundFactory {
    event FundCreated(
        address,
        address,
        address,
        string,
        string,
        address,
        address,
        uint256,
        uint256
    );

    event PricerUpdated(address);
    event SwapperUpdated(address);

    error PricerNotSet();
    error SwapperNotSet();

    function createFund(
        string calldata _name,
        string calldata _symbol,
        address _baseToken,
        address _weth,
        uint256 _protocolFee,
        uint256 _managementFee
    ) external returns (address fund);

    function updatePricer(address _pricer) external;

    function updateSwapper(address _swapper) external;
}
