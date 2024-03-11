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

describe("FundFactory", function () {
  describe("Deployment", function () {
    it("Should deploy FundFactory", async function () {
      const { fundFactory, owner, otherAccount } = await loadFixture(
        deployFundFactoryFixture
      );
    });

    it("Should deploy FundFactory", async function () {
      const { fund, token0, token1, owner, otherAccount } = await loadFixture(
        deployFundFixture
      );
    });
  });

  describe("createFund", function () {
    it("Should create a new Fund", async function () {
      const { fundFactory, owner, otherAccount } = await loadFixture(
        deployFundFactoryFixture
      );

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
          DEFAULT_NAME,
          DEFAULT_SYMBOL,
          default_assets,
          DEFAULT_ALLOCATIONS,
          DEFAULT_VARIABLE_ALLOCATIONS
        );
    });
  });

  describe("open and close fund", function () {
    it("Should open a fund", async function () {
      const { fund, token0, token1, owner, otherAccount } = await loadFixture(
        deployFundFixture
      );

      await expect(fund.openFund()).to.emit(fund, "FundOpened");
    });

    it("Should close a fund", async function () {
      const { fund, token0, token1, owner, otherAccount } = await loadFixture(
        deployFundFixture
      );

      await fund.closeFund();

      await expect(fund.closeFund()).to.emit(fund, "FundClosed");
    });
  });

  describe("Investments", function () {
    it("Should invest in a fund", async function () {
      const { fund, token0, token1, owner, otherAccount } = await loadFixture(
        deployFundFixture
      );

      await expect(fund.invest(DEFAULT_INVESTMENT_ALLOCATION))
        .to.emit(fund, "Investment")
        .withArgs(owner.address, DEFAULT_INVESTMENT_ALLOCATION);
    });
  });
});
