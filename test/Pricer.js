const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const constants = require("../utils/constants.js");

const { deployPricerFixture } = require("./Fixtures.js");

describe("Pricer Unit", function () {
  describe("Deployment", function () {
    it("Should deploy Pricer", async function () {
      const { pricer } = await loadFixture(deployPricerFixture);
      expect(pricer.address).to.not.equal(constants.ADDRESS_ZERO);
    });
  });

  // describe("Swaps", function () {
  //   it("Should swap", async function () {
  //     const { swapper } = await loadFixture(deploySwapperFixture);
  //     const { weth, dai, usdc } = await loadFixture(swapTokensFixture);
  //     await hre.network.provider.request({
  //       method: "hardhat_impersonateAccount",
  //       params: [constants.DAI_HOLDER],
  //     });
  //     const dai_holder = await ethers.getSigner(constants.DAI_HOLDER);

  //     const qsUSDC = createQueryString({
  //       sellToken: "DAI",
  //       buyToken: "USDC",
  //       sellAmount: constants.TEST_SWAP,
  //     });

  //     const quoteUSDC = await getQuote(qsUSDC);

  //     const swapParams = {
  //       sellToken: quoteUSDC.sellTokenAddress,
  //       sellAmount: constants.TEST_SWAP,
  //       buyToken: quoteUSDC.buyTokenAddress,
  //       spender: quoteUSDC.allowanceTarget,
  //       swapTarget: quoteUSDC.to,
  //       swapCallData: quoteUSDC.data,
  //     };

  //     await dai
  //       .connect(dai_holder)
  //       .approve(swapper.target, constants.TEST_SWAP);

  //     await expect(swapper.connect(dai_holder).swap(swapParams)).to.emit(
  //       swapper,
  //       "Swap"
  //     );
  //   });
  // });
});
