// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDvrsfyFundFactory {
    event FundCreated(
        address,
        address,
        address,
        string,
        string,
        address[],
        uint256[],
        bool
    );

    event PricerUpdated(address);
    event SwapperUpdated(address);

    error PricerNotSet();
    error SwapperNotSet();

    function createFund(
        string calldata _name,
        string calldata _symbol,
        address[] memory _assets,
        uint256[] memory _allocations,
        bool _variableAllocation
    ) external returns (address fund);

    function updatePricer(address _pricer) external;

    function updateSwapper(address _swapper) external;
}
