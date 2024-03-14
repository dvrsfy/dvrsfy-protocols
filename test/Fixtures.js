const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

const DEFAULT_NAME = "NAME";
const DEFAULT_SYMBOL = "SYMBOL";
let token0;
let token1;
let pricer;
let swapper;

async function tokensFixture() {
  const tokenFactory = await ethers.getContractFactory("TestERC20");
  token0 = await tokenFactory.deploy();
  token1 = await tokenFactory.deploy();

  return { token0, token1 };
}

async function getSigners() {
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  return { deployer, user1, user2, user3 };
}

async function deployPricerFixture() {
  const Pricer = await ethers.getContractFactory("DvrsfyPricer");
  pricer = await Pricer.deploy();

  return { pricer };
}

async function deploySwapperFixture() {
  const Swapper = await ethers.getContractFactory("DvrsfySwapper");
  swapper = await Swapper.deploy();

  return { swapper };
}

async function deployFundFactoryFixture() {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await ethers.getSigners();

  await deployPricerFixture();
  await deploySwapperFixture();

  const FundFactory = await ethers.getContractFactory("DvrsfyFundFactory");
  const fundFactory = await FundFactory.deploy(pricer.target, swapper.target);
  console.log(await fundFactory.pricer());
  return { fundFactory, pricer, swapper, owner, otherAccount };
}

async function deployFundFixture() {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await ethers.getSigners();

  await tokensFixture();

  await deployPricerFixture();
  await deploySwapperFixture();

  const Fund = await ethers.getContractFactory("DvrsfyFund");
  const fund = await Fund.deploy(
    owner.address,
    pricer.target,
    swapper.target,
    DEFAULT_NAME,
    DEFAULT_SYMBOL,
    [token0.target, token1.target],
    [50, 50],
    false
  );

  return { fund, pricer, swapper, token0, token1, owner, otherAccount };
}

module.exports = {
  getSigners,
  tokensFixture,
  deployFundFactoryFixture,
  deployFundFixture,
};
