// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("TestCoin", "TC") {}

    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }
}
