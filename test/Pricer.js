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
});
