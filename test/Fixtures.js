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
  [deployer, anyone] = await ethers.getSigners();
  return { deployer, anyone };
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
  const { deployer } = await getSigners();
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
    constants.USDC_ADDRESS,
    constants.WETH_ADDRESS,
    constants.DEFAULT_PROTOCOL_FEE,
    constants.DEFAULT_MANAGEMENT_FEE
  );

  return { fund, pricer, swapper, weth, usdc, pepe, deployer };
}

async function deployInvestedFundFixture() {
  const { deployer } = await getSigners();
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
    constants.USDC_ADDRESS,
    constants.WETH_ADDRESS,
    constants.DEFAULT_PROTOCOL_FEE,
    constants.DEFAULT_MANAGEMENT_FEE
  );

  const tokens = [dai.target];
  const minAmountsBought = [constants.DEFAULT_MIN_AMOUNT_BOUGHT];
  const amounts = [constants.DEFAULT_INVESTMENT];
  const investment = await getSwapParams(
    constants.WETH_ADDRESS,
    constants.DAI_ADDRESS,
    constants.DEFAULT_INVESTMENT / 100
  );

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [constants.WHALE],
  });

  const whale = await ethers.getSigner(constants.WHALE);

  await fund.connect(whale).buyShares(pricer.target, {
    value: constants.DEFAULT_INVESTMENT.toString(),
  });

  const swapParams = [investment];
  await fund
    .connect(deployer)
    .invest(tokens, amounts, minAmountsBought, swapParams);

  return { fund, pricer, swapper, weth, usdc, pepe, deployer };
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

async function getSwapParams(sellToken, buyToken, sellAmount) {
  const qs = createQueryString({
    sellToken: sellToken,
    buyToken: buyToken,
    sellAmount: sellAmount,
  });

  const quote = await getQuote(qs);
  const swapParams = {
    sellToken: quote.sellTokenAddress,
    sellAmount: quote.sellAmount,
    buyToken: quote.buyTokenAddress,
    spender: quote.allowanceTarget,
    swapTarget: quote.to,
    swapCallData: quote.data,
  };

  return swapParams;
}

module.exports = {
  getSigners,
  deployTokensFixture,
  deploySwapperFixture,
  deployPricerFixture,
  deployFundFactoryFixture,
  deployFundFixture,
  deployInvestedFundFixture,
  getSwapParams,
};
