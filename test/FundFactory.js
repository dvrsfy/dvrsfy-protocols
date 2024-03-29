const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const constants = require("../utils/constants");

const {
  getSigners,
  deployTokensFixture,
  deployFundFactoryFixture,
  deployFundFixture,
} = require("./Fixtures.js");

describe("FundFactory Unit", function () {
  describe("Deployment", function () {
    it("Should deploy FundFactory", async function () {
      const { fundFactory } = await loadFixture(deployFundFactoryFixture);
      expect(fundFactory.address).to.not.equal(constants.ADDRESS_ZERO);
    });

    it("Shouldn't deploy with no pricer", async function () {
      const { pricer, swapper } = await loadFixture(deployFundFactoryFixture);
      const FundFactory = await ethers.getContractFactory("DvrsfyFundFactory");
      await expect(
        FundFactory.deploy(constants.ADDRESS_ZERO, swapper.target)
      ).to.be.revertedWithCustomError(FundFactory, "PricerNotSet");
    });

    it("Shouldn't deploy with no swapper", async function () {
      const { pricer, swapper } = await loadFixture(deployFundFactoryFixture);
      const FundFactory = await ethers.getContractFactory("DvrsfyFundFactory");
      await expect(
        FundFactory.deploy(pricer.target, constants.ADDRESS_ZERO)
      ).to.be.revertedWithCustomError(FundFactory, "SwapperNotSet");
    });
  });

  describe("Create Fund", function () {
    it("Should create a new Fund", async function () {
      const { fundFactory, pricer, swapper, deployer } = await loadFixture(
        deployFundFactoryFixture
      );

      const { weth, pepe } = await loadFixture(deployTokensFixture);

      const default_assets = [weth.target, pepe.target];
      const tx = await fundFactory.createFund(
        constants.DEFAULT_NAME,
        constants.DEFAULT_SYMBOL,
        constants.USDC_ADDRESS,
        constants.WETH_ADDRESS,
        constants.DEFAULT_PROTOCOL_FEE,
        constants.DEFAULT_MANAGEMENT_FEE
      );

      await expect(tx)
        .to.emit(fundFactory, "FundCreated")
        .withArgs(
          deployer.address,
          pricer,
          swapper,
          constants.DEFAULT_NAME,
          constants.DEFAULT_SYMBOL,
          constants.USDC_ADDRESS,
          constants.WETH_ADDRESS,
          constants.DEFAULT_PROTOCOL_FEE,
          constants.DEFAULT_MANAGEMENT_FEE
        );
    });
  });

  describe("Administrative functions", function () {
    it("Should update the pricer", async function () {
      const { fundFactory } = await loadFixture(deployFundFactoryFixture);

      const { pricer } = await loadFixture(deployFundFixture);

      const tx = await fundFactory.updatePricer(pricer.target);
      await expect(tx)
        .to.emit(fundFactory, "PricerUpdated")
        .withArgs(pricer.target);
    });
    it("Should update the swapper", async function () {
      const { fundFactory } = await loadFixture(deployFundFactoryFixture);

      const { swapper } = await loadFixture(deployFundFixture);

      const tx = await fundFactory.updateSwapper(swapper.target);
      await expect(tx)
        .to.emit(fundFactory, "SwapperUpdated")
        .withArgs(swapper.target);
    });
  });
});
