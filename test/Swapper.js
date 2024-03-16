const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const constants = require("../utils/constants");

const {
  deploySwapperFixture,
  swapTokensFixture,
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
      const { weth, dai, usdc } = await loadFixture(swapTokensFixture);
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.DAI_HOLDER],
      });
      const dai_holder = await ethers.getSigner(constants.DAI_HOLDER);

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

      await dai
        .connect(dai_holder)
        .approve(swapper.target, constants.TEST_SWAP);

      await expect(swapper.connect(dai_holder).swap(swapParams)).to.emit(
        swapper,
        "Swap"
      );
    });
  });
});
