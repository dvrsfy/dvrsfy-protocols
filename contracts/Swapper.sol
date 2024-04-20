// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IWETH.sol"; // WETH9 is not v0.8 - check if compatibility issues are possible
import "./interfaces/ISwapper.sol";
import "hardhat/console.sol";

contract DvrsfySwapper is IDvrsfySwapper {
    using SafeERC20 for IERC20;
    // The WETH contract.
    IWETH9 public immutable WETH;
    // 0x ExchangeProxy address.
    // See https://docs.0x.org/developer-resources/contract-addresses
    address public exchangeProxy;

    /// @notice Contract constructor.
    /// @dev Initializes the contract with the specified WETH contract and 0x ExchangeProxy address.
    /// @param _weth Address of the WETH contract.
    /// @param _exchangeProxy Address of the 0x ExchangeProxy contract.
    constructor(IWETH9 _weth, address _exchangeProxy) {
        WETH = _weth;
        exchangeProxy = _exchangeProxy;
    }

    /// @notice Fallback function to allow the contract to receive protocol fee refunds.
    /// @dev This function allows the contract to receive ETH refunds for protocol fees.
    receive() external payable override {}

    /// @notice Swaps ERC20 tokens held by this contract using a 0x-API quote.
    /// @dev This function swaps ERC20 tokens held by this contract using a 0x-API quote.
    /// @param params Struct containing swap parameters.
    /// @return boughtAmount Amount of tokens bought.
    function swap(
        SwapParams calldata params
    )
        external
        payable
        override
        returns (uint256 boughtAmount)
    // Must attach ETH equal to the `value` field from the API response.
    {
        // Checks that the swapTarget is actually the address of 0x ExchangeProxy
        if (params.swapTarget != exchangeProxy)
            revert TargetInvalid(params.swapTarget);
        if (params.sellToken == params.buyToken)
            revert SwapParamsInvalid(params);
        uint256 protocolFee = msg.value;
        // bool ethPayment;

        // Wrap ETH in WETH when needed
        // When sending ETH to the contract, the sellToken should be WETH
        if (address(params.sellToken) == address(WETH)) {
            WETH.deposit{value: params.sellAmount}();
            protocolFee = msg.value - params.sellAmount;
            // ethPayment = true;
        } else {
            params.sellToken.safeTransferFrom(
                msg.sender,
                address(this),
                params.sellAmount
            );
        }
        // Give `spender` an infinite allowance to spend this contract's `sellToken`.
        // Note that for some tokens (e.g., USDT, KNC), you must first reset any existing
        // allowance to 0 before being able to update it.
        if (!params.sellToken.approve(params.spender, type(uint256).max))
            revert AllowanceInsufficient(
                address(params.sellToken),
                params.spender
            );

        // Call the encoded swap function call on the contract at `swapTarget`,
        (bool success, ) = params.swapTarget.call{value: protocolFee}(
            params.swapCallData
        );
        if (!success) revert SwapFailed(params);

        // Use our current buyToken balance to determine how much we've bought.
        boughtAmount = params.buyToken.balanceOf(address(this));
        // Unwrap leftover WETH if crypto provided was ETH
        // if (ethPayment || address(params.buyToken) == address(WETH)) {
        WETH.withdraw(WETH.balanceOf(address(this)));
        // }
        // Transfer the amount bought
        if (params.buyToken.balanceOf(address(this)) > 0) {
            params.buyToken.safeTransfer(msg.sender, boughtAmount);
        }
        // Refund unswapped token back
        if (params.sellToken.balanceOf(address(this)) > 0) {
            params.sellToken.safeTransfer(
                msg.sender,
                params.sellToken.balanceOf(address(this))
            );
        }
        // Refund any unspent protocol fees to the sender.
        msg.sender.call{value: address(this).balance}("");
        // Reset the approval
        params.sellToken.approve(params.spender, 0);
        emit Swap(params.sellToken, params.buyToken, boughtAmount);
        return boughtAmount;
    }
}
