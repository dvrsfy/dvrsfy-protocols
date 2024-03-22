const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const constants = require("../utils/constants");

const {
  deployFundFixture,
  deployFundFactoryFixture,
  deployTokensFixture,
} = require("./Fixtures.js");

describe("Fund Unit", function () {
  describe("Deployment", function () {
    it("Should create a new Fund", async function () {
      const { fundFactory, pricer, swapper, deployer } = await loadFixture(
        deployFundFactoryFixture
      );

      const { weth, pepe } = await loadFixture(deployTokensFixture);

      const default_assets = [weth.target, pepe.target];
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

      await fund.openFund();

      await expect(fund.closeFund()).to.emit(fund, "FundClosed");
    });
  });

  describe("Investments", function () {
    it("Should invest in a fund and get shares", async function () {
      const { weth } = await loadFixture(deployTokensFixture);
      const { fund, pricer } = await loadFixture(deployFundFixture);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WETH_HOLDER],
      });

      const weth_holder = await ethers.getSigner(constants.WETH_HOLDER);

      await weth
        .connect(weth_holder)
        .approve(fund.target, constants.DEFAULT_INVESTMENT);

      await expect(
        fund
          .connect(weth_holder)
          .invest(pricer.target, constants.DEFAULT_INVESTMENT, weth)
      )
        .to.emit(fund, "Investment")
        .withArgs(weth_holder.address, BigInt(constants.DEFAULT_SHARES));
    });

    it("Should invest in an existing fund and get the right amount of shares", async function () {
      const { weth } = await loadFixture(deployTokensFixture);
      const { fund, pricer } = await loadFixture(deployFundFixture);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WHALE],
      });

      const whale = await ethers.getSigner(constants.WHALE);

      await weth
        .connect(whale)
        .approve(fund.target, constants.DEFAULT_INVESTMENT);

      await fund
        .connect(whale)
        .invest(pricer.target, constants.DEFAULT_INVESTMENT, weth);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.CETACEAN],
      });

      const cetacean = await ethers.getSigner(constants.CETACEAN);

      await weth
        .connect(cetacean)
        .approve(fund.target, constants.DEFAULT_INVESTMENT / 2);

      await expect(
        fund
          .connect(cetacean)
          .invest(pricer.target, constants.DEFAULT_INVESTMENT / 2, weth)
      )
        .to.emit(fund, "Investment")
        .withArgs(cetacean.address, BigInt(constants.DEFAULT_SHARES / 2));
    });

    it("Should invest with tokens approved by the fund", async function () {
      const { usdc } = await loadFixture(deployTokensFixture);
      const { fund, pricer } = await loadFixture(deployFundFixture);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WHALE],
      });

      const whale = await ethers.getSigner(constants.WHALE);

      await usdc
        .connect(whale)
        .approve(fund.target, constants.DEFAULT_INVESTMENT);

      await expect(
        fund
          .connect(whale)
          .invest(pricer.target, constants.DEFAULT_INVESTMENT, usdc)
      ).to.be.revertedWithCustomError(fund, "InvalidInvestment");
    });
  });
});
