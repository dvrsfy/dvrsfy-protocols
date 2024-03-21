const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const constants = require("../utils/constants");

const {
  tokensFixture,
  deployFundFactoryFixture,
  deployFundFixture,
  swapTokensFixture,
} = require("./Fixtures.js");

describe("Fund Unit", function () {
  describe("Deployment", function () {
    it("Should create a new Fund", async function () {
      const { fundFactory, pricer, swapper, deployer } = await loadFixture(
        deployFundFactoryFixture
      );

      const { token0, token1 } = await loadFixture(tokensFixture);

      const default_assets = [token0.target, token1.target];
      const tx = await fundFactory.createFund(
        constants.DEFAULT_NAME,
        constants.DEFAULT_SYMBOL,
        default_assets,
        constants.DEFAULT_ALLOCATIONS,
        constants.PRICING_FEES,
        constants.USDC_ADDRESS,
        constants.DEFAULT_VARIABLE_ALLOCATIONS
      );

      await expect(tx)
        .to.emit(fundFactory, "FundCreated")
        .withArgs(
          deployer.address,
          pricer,
          swapper,
          constants.DEFAULT_NAME,
          constants.DEFAULT_SYMBOL,
          default_assets,
          constants.DEFAULT_ALLOCATIONS,
          constants.PRICING_FEES,
          constants.USDC_ADDRESS,
          constants.DEFAULT_VARIABLE_ALLOCATIONS
        );
    });
  });

  describe("open and close fund", function () {
    it("Should open a fund", async function () {
      const { fund } = await loadFixture(deployFundFixture);

      await expect(fund.openFund()).to.emit(fund, "FundOpened");
    });

    it("Should close a fund", async function () {
      const { fund } = await loadFixture(deployFundFixture);

      await fund.closeFund();

      await expect(fund.closeFund()).to.emit(fund, "FundClosed");
    });
  });

  describe("Investments", function () {
    it("Should invest one token in a fund", async function () {
      const { fund, pricer, token0, token1, deployer } = await loadFixture(
        deployFundFixture
      );
      const { usdc } = await loadFixture(swapTokensFixture);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.USDC_HOLDER],
      });
      const usdc_holder = await ethers.getSigner(constants.USDC_HOLDER);

      await usdc
        .connect(usdc_holder)
        .approve(fund.target, constants.DEFAULT_SHARES);

      await expect(
        fund
          .connect(usdc_holder)
          .invest(
            pricer.target,
            constants.DEFAULT_SHARES,
            constants.USDC_ADDRESS
          )
      )
        .to.emit(fund, "Investment")
        .withArgs(usdc_holder, constants.DEFAULT_SHARES);
    });

    it("Should invest two tokens in a fund", async function () {
      const { fundFactory, pricer, swapper, deployer, user1 } =
        await loadFixture(deployFundFactoryFixture);

      const { weth, dai, usdc } = await loadFixture(swapTokensFixture);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.USDC_HOLDER],
      });
      const usdc_holder = await ethers.getSigner(constants.USDC_HOLDER);

      const fund = await fundFactory.createFund(
        constants.DEFAULT_NAME,
        constants.DEFAULT_SYMBOL,
        [usdc, weth],
        constants.DEFAULT_ALLOCATIONS,
        constants.PRICING_FEES,
        constants.USDC_ADDRESS,
        constants.DEFAULT_VARIABLE_ALLOCATIONS
      );

      // console.log(usdc);
      // console.log(usdc_holder);
      console.log(fund);

      // await usdc
      //   .connect(usdc_holder)
      //   .approve(fund.target, constants.DEFAULT_SHARES);

      //   await expect(
      //     fund
      //       .connect(usdc_holder)
      //       .invest(
      //         pricer.target,
      //         constants.DEFAULT_SHARES,
      //         constants.USDC_ADDRESS
      //       )
      //   )
      //     .to.emit(fund, "Investment")
      //     .withArgs(usdc_holder, constants.DEFAULT_SHARES);
    });
  });
});
