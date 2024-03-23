const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const constants = require("../utils/constants");

const {
  getSigners,
  deployFundFixture,
  deployFundFactoryFixture,
  deployTokensFixture,
} = require("./Fixtures.js");
const { any } = require("hardhat/internal/core/params/argumentTypes.js");

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
        constants.USDC_ADDRESS
      );

      await expect(tx)
        .to.emit(fundFactory, "FundCreated")
        .withArgs(
          deployer.address,
          pricer,
          swapper,
          constants.DEFAULT_NAME,
          constants.DEFAULT_SYMBOL,
          constants.USDC_ADDRESS
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

  describe("Shares", function () {
    it("Should have the right balance when buying shares", async function () {
      const { weth } = await loadFixture(deployTokensFixture);
      const { fund, pricer } = await loadFixture(deployFundFixture);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WETH_HOLDER],
      });

      const weth_holder = await ethers.getSigner(constants.WETH_HOLDER);

      await expect(
        fund.connect(weth_holder).buyShares(pricer.target, {
          value: constants.DEFAULT_INVESTMENT,
        })
      )
        .to.emit(fund, "SharesBought")
        .withArgs(weth_holder.address, BigInt(constants.DEFAULT_SHARES));
    });

    it("Should have the right amount of shares when buying in a fund with an ETH balance", async function () {
      const { weth } = await loadFixture(deployTokensFixture);
      const { fund, pricer } = await loadFixture(deployFundFixture);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WHALE],
      });

      const whale = await ethers.getSigner(constants.WHALE);

      await fund
        .connect(whale)
        .buyShares(pricer.target, { value: constants.DEFAULT_INVESTMENT });

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.CETACEAN],
      });

      const cetacean = await ethers.getSigner(constants.CETACEAN);

      await expect(
        fund.connect(cetacean).buyShares(pricer.target, {
          value: (constants.DEFAULT_INVESTMENT / 2).toString(),
        })
      )
        .to.emit(fund, "SharesBought")
        .withArgs(cetacean.address, BigInt(constants.DEFAULT_SHARES / 2));
    });
  });

  describe("Shares", function () {
    it("the fund manager should be able to invest", async function () {
      const { pepe, weth } = await loadFixture(deployTokensFixture);
      const { fund } = await loadFixture(deployFundFixture);
      const tokens = [pepe.target, weth.target];
      const amounts = [
        constants.DEFAULT_INVESTMENT,
        constants.DEFAULT_INVESTMENT,
      ];
      const swapParams = [
        constants.DEFAULT_SWAP_PARAMS,
        constants.DEFAULT_SWAP_PARAMS,
      ];
      await expect(fund.invest(tokens, amounts, swapParams))
        .to.emit(fund, "Investment")
        .withArgs(tokens, amounts);
    });

    it("anyone cannot invest the fund assets", async function () {
      const { pepe, weth } = await loadFixture(deployTokensFixture);
      const { anyone } = await getSigners();
      const { fund } = await loadFixture(deployFundFixture);
      const tokens = [pepe.target, weth.target];
      const amounts = [
        constants.DEFAULT_INVESTMENT,
        constants.DEFAULT_INVESTMENT,
      ];
      const swapParams = [
        constants.DEFAULT_SWAP_PARAMS,
        constants.DEFAULT_SWAP_PARAMS,
      ];
      await expect(fund.connect(anyone).invest(tokens, amounts, swapParams))
        .to.be.revertedWithCustomError(fund, "Unauthorized")
        .withArgs(anyone.address);
    });
  });
});
