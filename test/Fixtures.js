const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

const DEFAULT_NAME = "NAME";
const DEFAULT_SYMBOL = "SYMBOL";
const DEFAULT_FUNDING = "100000000000000";

let token0;
let token1;

async function tokensFixture() {
  const tokenFactory = await ethers.getContractFactory("TestERC20");
  token0 = await tokenFactory.deploy();
  token1 = await tokenFactory.deploy();

  return { token0, token1 };
}

async function deployFundFactoryFixture() {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await ethers.getSigners();

  const FundFactory = await ethers.getContractFactory("FundFactory");
  const fundFactory = await FundFactory.deploy();

  return { fundFactory, owner, otherAccount };
}

async function getSigners() {
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  return { deployer, user1, user2, user3 };
}

async function deployFundFixture() {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await ethers.getSigners();

  await tokensFixture();

  const Fund = await ethers.getContractFactory("Fund");
  const fund = await Fund.deploy(
    owner.address,
    DEFAULT_NAME,
    DEFAULT_SYMBOL,
    [token0.target, token1.target],
    [50, 50],
    false
  );

  return { fund, token0, token1, owner, otherAccount };
}

module.exports = {
  getSigners,
  tokensFixture,
  deployFundFactoryFixture,
  deployFundFixture,
};
