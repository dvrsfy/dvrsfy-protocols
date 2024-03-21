const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const constants = require("../utils/constants");

const {
  getSigners,
  tokensFixture,
  deployFundFactoryFixture,
  deployFundFixture,
} = require("./Fixtures.js");

describe("FundFactory Unit", function () {
  describe("Deployment", function () {
    it("Should deploy FundFactory", async function () {
      const { fundFactory } = await loadFixture(deployFundFactoryFixture);
      expect(fundFactory.address).to.not.equal(constants.ADDRESS_ZERO);
    });
  });

  describe("Create Fund", function () {
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
          constants.USDC_ADDRESS,
          constants.DEFAULT_VARIABLE_ALLOCATIONS
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
