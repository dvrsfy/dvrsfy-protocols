const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const bn = require("bignumber.js");
const constants = require("../utils/constants.js");
const fetch = require("node-fetch");
const UNISWAP_V3_FACTORY = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");
let weth;
let dai;
let usdc;
let pepe;
let pricer;
let swapper;
let deployer;
let uniswapFactoryV3;
let user1;
let user2;
let user3;

async function getSigners() {
  [deployer, user1, user2, user3] = await ethers.getSigners();
  return { deployer, user1, user2, user3 };
}

async function deployTokensFixture() {
  weth = await ethers.getContractAt("TestERC20", constants.WETH_ADDRESS);
  dai = await ethers.getContractAt("TestERC20", constants.DAI_ADDRESS);
  usdc = await ethers.getContractAt("TestERC20", constants.USDC_ADDRESS);
  pepe = await ethers.getContractAt("TestERC20", constants.PEPE_ADDRESS);

  return { weth, dai, usdc, pepe };
}

async function deployUniswapFactoryV3Fixture() {
  uniswapFactoryV3 = await ethers.getContractAt(
    UNISWAP_V3_FACTORY.abi,
    constants.UNISWAP_V3_FACTORY
  );
  return { uniswapFactoryV3 };
}

async function deployPricerFixture() {
  const { uniswapFactoryV3 } = await deployUniswapFactoryV3Fixture();
  const Pricer = await ethers.getContractFactory("DvrsfyPricer");
  pricer = await Pricer.deploy(uniswapFactoryV3, constants.WETH_ADDRESS);
  return { pricer };
}

async function deploySwapperFixture() {
  const Swapper = await ethers.getContractFactory("DvrsfySwapper");
  swapper = await Swapper.deploy(
    constants.WETH_ADDRESS,
    constants.ZEROX_SWAP_ROUTER
  );

  return { swapper };
}

async function deployFundFactoryFixture() {
  await getSigners();
  await deployPricerFixture();
  await deploySwapperFixture();

  const FundFactory = await ethers.getContractFactory("DvrsfyFundFactory");
  const fundFactory = await FundFactory.deploy(pricer.target, swapper.target);
  return { fundFactory, pricer, swapper, deployer, user1 };
}

async function deployFundFixture() {
  await getSigners();
  await deployTokensFixture();
  await deployPricerFixture();
  await deploySwapperFixture();

  const Fund = await ethers.getContractFactory("DvrsfyFund");
  const fund = await Fund.deploy(
    deployer.address,
    pricer.target,
    swapper.target,
    constants.DEFAULT_NAME,
    constants.DEFAULT_SYMBOL,
    [weth.target, pepe.target],
    [50, 50],
    constants.PRICING_FEES,
    constants.USDC_ADDRESS,
    false
  );

  return { fund, pricer, swapper, weth, usdc, pepe };
}

function createQueryString(params) {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

async function getQuote(qs) {
  const headers = { "0x-api-key": process.env.ZEROx_API_KEY };
  const quoteUrl = `${constants.API_QUOTE_URL}?${qs}`;
  const response = await fetch(quoteUrl, { headers });
  const quote = await response.json();
  return quote;
}

function encodePriceSqrt(reserve1, reserve0) {
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toFixed()
  );
}

module.exports = {
  getSigners,
  deployTokensFixture,
  deploySwapperFixture,
  deployPricerFixture,
  deployFundFactoryFixture,
  deployFundFixture,
  createQueryString,
  getQuote,
  encodePriceSqrt,
};
