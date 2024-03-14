const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const {
  getSigners,
  tokensFixture,
  deployFundFactoryFixture,
  deployFundFixture,
} = require("./Fixtures.js");

const DEFAULT_NAME = "NAME";
const DEFAULT_SYMBOL = "SYMBOL";
const DEFAULT_ALLOCATIONS = [50, 50];
const DEFAULT_VARIABLE_ALLOCATIONS = false;
const DEFAULT_INVESTMENT = 1000;
const DEFAULT_INVESTMENT_ALLOCATION = [DEFAULT_INVESTMENT, DEFAULT_INVESTMENT];
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

describe("FundFactory Unit", function () {
  describe("Deployment", function () {
    it("Should deploy FundFactory", async function () {
      const { fundFactory, owner, otherAccount } = await loadFixture(
        deployFundFactoryFixture
      );
    });
  });

  describe("Create Fund", function () {
    it("Should create a new Fund", async function () {
      const { fundFactory, pricer, swapper, owner, otherAccount } =
        await loadFixture(deployFundFactoryFixture);

      const { token0, token1 } = await loadFixture(tokensFixture);

      const default_assets = [token0.target, token1.target];
      const tx = await fundFactory.createFund(
        DEFAULT_NAME,
        DEFAULT_SYMBOL,
        default_assets,
        DEFAULT_ALLOCATIONS,
        DEFAULT_VARIABLE_ALLOCATIONS
      );

      await expect(tx)
        .to.emit(fundFactory, "FundCreated")
        .withArgs(
          owner.address,
          pricer,
          swapper,
          DEFAULT_NAME,
          DEFAULT_SYMBOL,
          default_assets,
          DEFAULT_ALLOCATIONS,
          DEFAULT_VARIABLE_ALLOCATIONS
        );
    });
  });

  describe("Administrative functions", function () {
    it("Should update the pricer", async function () {
      const { fundFactory, owner, otherAccount } = await loadFixture(
        deployFundFactoryFixture
      );

      const { fund, pricer, token0, token1 } = await loadFixture(
        deployFundFixture
      );

      const tx = await fundFactory.updatePricer(pricer.target);
      await expect(tx)
        .to.emit(fundFactory, "PricerUpdated")
        .withArgs(pricer.target);
    });
    it("Should update the swapper", async function () {
      const { fundFactory, owner, otherAccount } = await loadFixture(
        deployFundFactoryFixture
      );

      const { fund, swapper, token0, token1 } = await loadFixture(
        deployFundFixture
      );

      const tx = await fundFactory.updateSwapper(swapper.target);
      await expect(tx)
        .to.emit(fundFactory, "SwapperUpdated")
        .withArgs(swapper.target);
    });
  });
});
