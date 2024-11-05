/**
 * Copyright Clave - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
import "@matterlabs/hardhat-zksync";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@typechain/hardhat";
import dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";
import type { NetworkUserConfig } from "hardhat/types";

import "./tasks/deploy";

const mainnet = {
  DecimalUtils: "0x687C913942fBeDAed383420c25f06c675D63Fd59",
  CommandUtils: "0xA6117a66C40ec9eD65B251874D70cC9E7cF6052b",
  StringUtils: "0x6Cd2d8aE77Fa5455200B338ffA06BFB0970e7A57",
};

const testnet = {
  DecimalUtils: "0x95C21cE16f9d20fE406ce67D8eFcd521b162C6Fa",
  CommandUtils: "0x691727F67b2AbE8Bba1b37b198A5EE491a7084be",
  StringUtils: "0x75DcAc758184454B9d8c96B95272899FECA2BA66",
};

const VARS = testnet;

dotenv.config();

const zkSyncMainnet: NetworkUserConfig = {
  url: "https://mainnet.era.zksync.io",
  ethNetwork: "mainnet",
  zksync: true,
  verifyURL: "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
  chainId: 324,
};

const zkSyncSepolia: NetworkUserConfig = {
  url: "https://sepolia.era.zksync.dev",
  ethNetwork: "sepolia",
  zksync: true,
  verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
  chainId: 300,
};

const inMemoryNode: NetworkUserConfig = {
  url: "http://127.0.0.1:8011",
  ethNetwork: "", // in-memory node doesn't support eth node; removing this line will cause an error
  zksync: true,
  chainId: 260,
};

const dockerizedNode: NetworkUserConfig = {
  url: "http://localhost:3050",
  ethNetwork: "http://localhost:8545",
  zksync: true,
  chainId: 270,
};

const config: HardhatUserConfig = {
  zksolc: {
    version: "latest",
    settings: {
      enableEraVMExtensions: true,
      optimizer: process.env.TEST
        ? {
            mode: "z",
          }
        : undefined,
      libraries: {
        "@zk-email/ether-email-auth-contracts/src/libraries/StringUtils.sol": {
          StringUtils: VARS.StringUtils,
        },
        "@zk-email/ether-email-auth-contracts/src/libraries/DecimalUtils.sol": {
          DecimalUtils: VARS.DecimalUtils,
        },
        "@zk-email/ether-email-auth-contracts/src/libraries/CommandUtils.sol": {
          CommandUtils: VARS.CommandUtils,
        },
      },
    },
  },
  defaultNetwork: "zkSyncSepolia",
  networks: {
    hardhat: {
      zksync: true,
    },
    zkSyncSepolia,
    zkSyncMainnet,
    inMemoryNode,
    dockerizedNode,
  },
  solidity: {
    version: "0.8.26",
  },
};

export default config;
