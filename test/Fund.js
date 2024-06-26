const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const constants = require("../utils/constants");

const {
  getSigners,
  deployFundFixture,
  deployInvestedFundFixture,
  deployFundFactoryFixture,
  deployTokensFixture,
  getSwapParams,
} = require("./Fixtures.js");
const { any } = require("hardhat/internal/core/params/argumentTypes.js");

describe("Fund Unit", function () {
  describe("Deployment", function () {
    it("Should create a new Fund", async function () {
      const { fundFactory, pricer, swapper, deployer } = await loadFixture(
        deployFundFactoryFixture
      );

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
          value: constants.DEFAULT_SHARES_INVESTMENT,
        })
      )
        .to.emit(fund, "SharesBought")
        .withArgs(weth_holder.address, BigInt(constants.DEFAULT_SHARES));
    });

    it("Should have the right amount of shares when buying in a fund with an ETH balance and pay the protocolFee", async function () {
      const { weth } = await loadFixture(deployTokensFixture);
      const { fund, pricer, deployer } = await loadFixture(deployFundFixture);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WHALE],
      });

      const whale = await ethers.getSigner(constants.WHALE);

      const deployerBalanceBefore = await ethers.provider.getBalance(
        deployer.address
      );

      await fund.connect(whale).buyShares(pricer.target, {
        value: constants.DEFAULT_SHARES_INVESTMENT,
      });

      const deployerBalanceAfter = await ethers.provider.getBalance(
        deployer.address
      );

      const protocolFee =
        (constants.DEFAULT_SHARES_INVESTMENT * constants.DEFAULT_PROTOCOL_FEE) /
        10000;

      expect(deployerBalanceAfter.toString()).to.equal(
        (deployerBalanceBefore + BigInt(protocolFee)).toString()
      );

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.CETACEAN],
      });

      const cetacean = await ethers.getSigner(constants.CETACEAN);

      await expect(
        fund.connect(cetacean).buyShares(pricer.target, {
          value: (constants.DEFAULT_SHARES_INVESTMENT / 2).toString(),
        })
      )
        .to.emit(fund, "SharesBought")
        // Need to verify the math. It's 30% of the first investment minus the fees
        .withArgs(cetacean.address, "500350245171620134");

      // expect(await fund.balanceOf(deployer.address)).to.equal(
      //   (
      //     ((constants.DEFAULT_SHARES_INVESTMENT / 2) *
      //       constants.DEFAULT_PROTOCOL_FEE) /
      //       100 +
      //     protocolFee
      //   ).toString()
      // );
    });

    it("should allow to sell shares", async function () {
      const { weth, dai } = await loadFixture(deployTokensFixture);
      const { fund, pricer, deployer } = await loadFixture(
        deployInvestedFundFixture
      );

      // Tests that the asset array added properly the asset after investing
      const assetsBefore = await fund.getAssets();
      expect(assetsBefore).to.deep.equal([dai.target]);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WHALE],
      });

      const whale = await ethers.getSigner(constants.WHALE);

      const whaleDaiShares =
        ((await fund.balanceOf(whale.address)) *
          (await dai.balanceOf(fund.target))) /
        (await fund.totalSupply());

      const sellSharesParams = await getSwapParams(
        constants.DAI_ADDRESS,
        constants.WETH_ADDRESS,
        whaleDaiShares
      );
      const fundDaiBalanceBefore = await dai.balanceOf(fund.target);
      const swapParams = [sellSharesParams];

      const whaleEthBalanceBefore = await ethers.provider.getBalance(whale);
      const fundManagerEthBalanceBefore = await ethers.provider.getBalance(
        deployer
      );

      await expect(
        fund
          .connect(whale)
          .sellShares(
            constants.DEFAULT_SHARES_INVESTMENT.toString(),
            swapParams
          )
      )
        .to.emit(fund, "SharesSold")
        .withArgs(whale.address, constants.DEFAULT_SHARES_INVESTMENT);

      // Tests that the shares of the investor were correctly burnt after selling
      expect(await fund.balanceOf(whale.address)).to.equal(0);

      // Tests that the proportional balance of the asset was correctly sold
      const fundDaiBalanceAfter = await dai.balanceOf(fund.target);
      expect(fundDaiBalanceAfter).to.be.lessThan(fundDaiBalanceBefore);

      // Tests that the asset array updated correctly after selling the whole balance
      const assetsAfter = await fund.getAssets();
      expect(assetsAfter).to.deep.equal([]);

      // Tests that the eth is properly sent to the investor selling the shares
      const whaleEthBalanceAfter = await ethers.provider.getBalance(
        constants.WHALE
      );
      expect(whaleEthBalanceBefore).to.be.lessThan(whaleEthBalanceAfter);

      // Test that the fundManager got the fee
      const fundManagerEthBalanceAfter = await ethers.provider.getBalance(
        deployer
      );
      expect(fundManagerEthBalanceBefore).to.be.lessThan(
        fundManagerEthBalanceAfter
      );
    });

    it("should allow to sell shares only for ETH", async function () {
      const { weth } = await loadFixture(deployTokensFixture);
      const { fund, pricer } = await loadFixture(deployInvestedFundFixture);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WHALE],
      });

      const whale = await ethers.getSigner(constants.WHALE);

      const swapParams = [constants.DEFAULT_SWAP_PARAMS];

      await expect(
        fund
          .connect(whale)
          .sellShares(
            constants.DEFAULT_SHARES_INVESTMENT.toString(),
            swapParams
          )
      )
        .to.be.revertedWithCustomError(fund, "InvalidTargetToken")
        .withArgs(swapParams[0].buyToken);
    });

    it("should allow to sell only tokens that are part of the fund", async function () {
      const { weth, dai } = await loadFixture(deployTokensFixture);
      const { fund, pricer } = await loadFixture(deployInvestedFundFixture);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WHALE],
      });

      const whale = await ethers.getSigner(constants.WHALE);
      const whaleDaiShares =
        ((await fund.balanceOf(whale.address)) *
          (await dai.balanceOf(fund.target))) /
        (await fund.totalSupply());

      const sellSharesParams = await getSwapParams(
        constants.USDC_ADDRESS,
        constants.WETH_ADDRESS,
        whaleDaiShares
      );

      const swapParams = [sellSharesParams];

      await expect(
        fund
          .connect(whale)
          .sellShares(
            constants.DEFAULT_SHARES_INVESTMENT.toString(),
            swapParams
          )
      )
        .to.be.revertedWithCustomError(fund, "InvalidInvestedToken")
        // swapParams[0].sellToken (need to fix casing when putting variable)
        .withArgs("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    });
  });

  describe("Investments and Divestments", function () {
    it("the fund manager should be able to invest", async function () {
      const { dai, weth } = await loadFixture(deployTokensFixture);
      const { fund, pricer, deployer } = await loadFixture(deployFundFixture);

      const tokens = [dai.target];
      const minAmountsBought = [constants.DEFAULT_MIN_AMOUNT_BOUGHT];
      const amounts = [constants.DEFAULT_INVESTMENT];
      const investment = await getSwapParams(
        constants.WETH_ADDRESS,
        constants.DAI_ADDRESS,
        constants.DEFAULT_INVESTMENT
      );

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WHALE],
      });

      const whale = await ethers.getSigner(constants.WHALE);

      await fund.connect(whale).buyShares(pricer.target, {
        value: constants.DEFAULT_SHARES_INVESTMENT.toString(),
      });

      const swapParams = [investment];
      await expect(
        fund
          .connect(deployer)
          .invest(tokens, amounts, minAmountsBought, swapParams)
      )
        .to.emit(fund, "Investment")
        .withArgs(tokens, amounts);
      expect(await dai.balanceOf(fund.target)).to.not.equal(0);
      const fundEthBalance = (
        await ethers.provider.getBalance(fund.target)
      ).toString();

      expect(fundEthBalance).to.equal(
        (
          constants.DEFAULT_SHARES_INVESTMENT -
          constants.DEFAULT_INVESTMENT -
          (constants.DEFAULT_PROTOCOL_FEE *
            constants.DEFAULT_SHARES_INVESTMENT) /
            10000
        ).toString()
      );
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
      const minAmountsBought = [
        constants.DEFAULT_MIN_AMOUNT_BOUGHT,
        constants.DEFAULT_MIN_AMOUNT_BOUGHT,
      ];
      const swapParams = [
        constants.DEFAULT_SWAP_PARAMS,
        constants.DEFAULT_SWAP_PARAMS,
      ];
      await expect(
        fund
          .connect(anyone)
          .invest(tokens, amounts, minAmountsBought, swapParams)
      )
        .to.be.revertedWithCustomError(fund, "Unauthorized")
        .withArgs(anyone.address);
    });

    it("should not invest more than the fund balance", async function () {
      const { dai, weth } = await loadFixture(deployTokensFixture);
      const { fund, pricer, deployer } = await loadFixture(deployFundFixture);

      const tokens = [dai.target];
      const minAmountsBought = [constants.DEFAULT_MIN_AMOUNT_BOUGHT];
      const amounts = [constants.DEFAULT_INVESTMENT];
      const investment = await getSwapParams(
        constants.WETH_ADDRESS,
        constants.DAI_ADDRESS,
        constants.DEFAULT_SHARES_INVESTMENT + 1
      );

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WHALE],
      });

      const whale = await ethers.getSigner(constants.WHALE);

      await fund.connect(whale).buyShares(pricer.target, {
        value: constants.DEFAULT_SHARES_INVESTMENT.toString(),
      });

      const swapParams = [investment];
      await expect(
        fund
          .connect(deployer)
          .invest(tokens, amounts, minAmountsBought, swapParams)
      ).to.be.revertedWithCustomError(fund, "InsufficientBalance");
    });

    it("the fund manager should be able to divest fund assets", async function () {
      const { dai, weth } = await loadFixture(deployTokensFixture);
      const { fund, pricer, deployer } = await loadFixture(
        deployInvestedFundFixture
      );

      const tokens = [dai.target];
      const minAmountsBought = [constants.DEFAULT_MIN_AMOUNT_BOUGHT];
      const fundDaiBalance = await dai.balanceOf(fund.target);
      const amounts = [fundDaiBalance];
      const divestment = await getSwapParams(
        constants.DAI_ADDRESS,
        constants.WETH_ADDRESS,
        fundDaiBalance
      );

      const swapParams = [divestment];

      await expect(
        fund
          .connect(deployer)
          .divest(tokens, amounts, minAmountsBought, swapParams)
      )
        .to.emit(fund, "Divestment")
        .withArgs(tokens, amounts);

      expect(await dai.balanceOf(fund.target)).to.equal(0);
    });

    it("anyone cannot divest fund assets", async function () {
      const { dai, weth } = await loadFixture(deployTokensFixture);
      const { fund, pricer, deployer } = await loadFixture(
        deployInvestedFundFixture
      );

      const tokens = [dai.target];
      const minAmountsBought = [constants.DEFAULT_MIN_AMOUNT_BOUGHT];
      const fundDaiBalance = await dai.balanceOf(fund.target);
      const amounts = [fundDaiBalance];
      const divestment = await getSwapParams(
        constants.DAI_ADDRESS,
        constants.WETH_ADDRESS,
        fundDaiBalance
      );

      const swapParams = [divestment];

      await expect(
        fund
          .connect(anyone)
          .divest(tokens, amounts, minAmountsBought, swapParams)
      )
        .to.be.revertedWithCustomError(fund, "Unauthorized")
        .withArgs(anyone.address);
    });
  });
});
