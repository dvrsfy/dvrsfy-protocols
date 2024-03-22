const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const constants = require("../utils/constants");

const {
  deploySwapperFixture,
  deployTokensFixture,
  createQueryString,
  getQuote,
  encodePriceSqrt,
} = require("./Fixtures.js");

describe("Swapper Unit", function () {
  describe("Deployment", function () {
    it("Should deploy Swapper", async function () {
      const { swapper } = await loadFixture(deploySwapperFixture);
      expect(swapper.address).to.not.equal(constants.ADDRESS_ZERO);
    });
  });

  describe("Swaps", function () {
    it("Should swap", async function () {
      const { swapper } = await loadFixture(deploySwapperFixture);
      const { weth, dai, usdc } = await loadFixture(deployTokensFixture);
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WHALE],
      });
      const whale = await ethers.getSigner(constants.WHALE);

      const qsUSDC = createQueryString({
        sellToken: "DAI",
        buyToken: "USDC",
        sellAmount: constants.TEST_SWAP,
      });

      const quoteUSDC = await getQuote(qsUSDC);

      const swapParams = {
        sellToken: quoteUSDC.sellTokenAddress,
        sellAmount: constants.TEST_SWAP,
        buyToken: quoteUSDC.buyTokenAddress,
        spender: quoteUSDC.allowanceTarget,
        swapTarget: quoteUSDC.to,
        swapCallData: quoteUSDC.data,
      };

      await dai.connect(whale).approve(swapper.target, constants.TEST_SWAP);

      await expect(swapper.connect(whale).swap(swapParams)).to.emit(
        swapper,
        "Swap"
      );
    });
  });
});
