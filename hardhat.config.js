require("@nomicfoundation/hardhat-toolbox");
require("hardhat-contract-sizer");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true" ? true : false,
  },
};
