require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("hardhat-contract-sizer");

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url:
          "https://eth-mainnet.g.alchemy.com/v2/" +
          process.env.ALCHEMY_PRIVATE_KEY,
        chainId: 31337,
      },
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true" ? true : false,
  },
};
