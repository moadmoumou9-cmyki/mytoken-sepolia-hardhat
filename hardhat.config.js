require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY     = process.env.PRIVATE_KEY     || "";
const ETHERSCAN_KEY   = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",

  networks: {
    hardhat: {},

    sepolia: {
      url: SEPOLIA_RPC_URL,
      // accounts is an array — Hardhat uses index 0 as the deployer
      accounts: PRIVATE_KEY ? [PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`] : [],
    },
  },

  // Lets you verify contracts on Etherscan with:
  // npx hardhat verify --network sepolia <address> <constructor args>
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
};
