const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const constants = require("../utils/constants.js");

const {
  deployPricerFixture,
  deployUniswapFactoryV3Fixture,
} = require("./Fixtures.js");

describe("Pricer Unit", function () {
  describe("Deployment", function () {
    it("Should deploy Pricer", async function () {
      const { pricer } = await loadFixture(deployPricerFixture);
      expect(pricer.address).to.not.equal(constants.ADDRESS_ZERO);
    });

    it("Should not deploy without a UniswapFactory Pricer", async function () {
      const Pricer = await ethers.getContractFactory("DvrsfyPricer");
      await expect(
        Pricer.deploy(constants.ADDRESS_ZERO, constants.WETH_ADDRESS)
      ).to.be.revertedWithCustomError(Pricer, "InvalidFactory");
    });
  });

  describe("Price", function () {
    it("Should give the price of an asset", async function () {
      const { pricer } = await loadFixture(deployPricerFixture);
      const price = await pricer.getPrices(
        constants.USDC_ADDRESS,
        [constants.WETH_ADDRESS],
        [500]
      );
      await expect(price).to.not.equal(constants.ZERO);
    });
  });

  describe("Administrative functions", function () {
    it("Should update the uniswapv3Factory", async function () {
      const { uniswapFactoryV3 } = await loadFixture(
        deployUniswapFactoryV3Fixture
      );
      const { pricer } = await loadFixture(deployPricerFixture);
      await expect(pricer.updateFactory(uniswapFactoryV3))
        .to.emit(pricer, "FactoryUpdated")
        .withArgs(uniswapFactoryV3);
    });

    it("Shouldn't update the uniswapv3Factory with address 0 ", async function () {
      const { uniswapFactoryV3 } = await loadFixture(
        deployUniswapFactoryV3Fixture
      );
      const { pricer } = await loadFixture(deployPricerFixture);
      await expect(
        pricer.updateFactory(constants.ADDRESS_ZERO)
      ).to.be.revertedWithCustomError(pricer, "InvalidFactory");
    });
  });
});
