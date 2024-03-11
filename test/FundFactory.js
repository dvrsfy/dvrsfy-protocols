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
      console.log(process.env.REPORT_GAS);
    });

    it("Should close a fund", async function () {
      const { fund, token0, token1, owner, otherAccount } = await loadFixture(
        deployFundFixture
      );

      await fund.closeFund();

      await expect(fund.closeFund()).to.emit(fund, "FundClosed");
    });
  });
});
