const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("FundFactory", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFundFactory() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const FundFactory = await ethers.getContractFactory("FundFactory");
    const fundFactory = await FundFactory.deploy();

    return { fundFactory, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should compile", async function () {
      const { fundFactory } = await loadFixture(deployFundFactory);
    });
  });
});
