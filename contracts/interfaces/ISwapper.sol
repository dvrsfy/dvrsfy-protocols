// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IDvrsfySwapper {
    error AllowanceInsufficient(address, address);
    error ProtocolFeeChangeTransferFailed();
    error ProtocolFeePaymentFailed();
    error TargetInvalid(address);
    error SwapFailed(SwapParams);
    error SwapParamsInvalid(SwapParams);

    event Swap(IERC20 sellToken, IERC20 buyToken, uint256 boughtAmount);
    event SwapSuccessful(SwapParams);

    struct SwapParams {
        // The `sellTokenAddress` field from the API response.
        IERC20 sellToken;
        // The amount of sellToken we want to sell
        uint256 sellAmount;
        // The `buyTokenAddress` field from the API response.
        IERC20 buyToken;
        // The `allowanceTarget` field from the API response.
        address spender;
        // The `to` field from the API response.
        address payable swapTarget;
        // The `data` field from the API response.
        bytes swapCallData;
    }

    receive() external payable;

    function swap(
        SwapParams calldata params
    ) external payable returns (uint256);
}
