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
  getSwapParams,
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

      const swapParams = await getSwapParams(
        constants.DAI_ADDRESS,
        constants.USDC_ADDRESS,
        constants.TEST_SWAP
      );

      await dai.connect(whale).approve(swapper.target, constants.TEST_SWAP);

      await expect(swapper.connect(whale).swap(swapParams)).to.emit(
        swapper,
        "Swap"
      );
    });

    it("Should revert if the swapTarget is not the 0x exchange Proxy", async function () {
      const { swapper } = await loadFixture(deploySwapperFixture);
      const { weth, dai, usdc } = await loadFixture(deployTokensFixture);
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WHALE],
      });
      const whale = await ethers.getSigner(constants.WHALE);

      let swapParams = await getSwapParams(
        constants.DAI_ADDRESS,
        constants.USDC_ADDRESS,
        constants.TEST_SWAP
      );

      swapParams.swapTarget = constants.ADDRESS_ZERO;

      await dai.connect(whale).approve(swapper.target, constants.TEST_SWAP);

      await expect(swapper.connect(whale).swap(swapParams))
        .to.be.revertedWithCustomError(swapper, "TargetInvalid")
        .withArgs(constants.ADDRESS_ZERO);
    });

    it("Should revert if the sellToken and buyToken are identical", async function () {
      const { swapper } = await loadFixture(deploySwapperFixture);
      const { weth, dai, usdc } = await loadFixture(deployTokensFixture);
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WHALE],
      });
      const whale = await ethers.getSigner(constants.WHALE);

      let swapParams = await getSwapParams(
        constants.DAI_ADDRESS,
        constants.USDC_ADDRESS,
        constants.TEST_SWAP
      );

      swapParams.buyToken = constants.DAI_ADDRESS;

      await dai.connect(whale).approve(swapper.target, constants.TEST_SWAP);

      await expect(
        swapper.connect(whale).swap(swapParams)
      ).to.be.revertedWithCustomError(swapper, "SwapParamsInvalid");
    });

    it("Should swap in ETH", async function () {
      const { swapper } = await loadFixture(deploySwapperFixture);
      const { weth, dai, usdc } = await loadFixture(deployTokensFixture);
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [constants.WHALE],
      });
      const whale = await ethers.getSigner(constants.WHALE);

      const swapParams = await getSwapParams(
        constants.WETH_ADDRESS,
        constants.DAI_ADDRESS,
        constants.TEST_SWAP
      );

      await expect(
        swapper.connect(whale).swap(swapParams, { value: constants.TEST_SWAP })
      ).to.emit(swapper, "Swap");
    });
  });
});
