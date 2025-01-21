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
  DecimalUtils: "0x718C17388E0A1b63788E80F789B03cdd8Df76060",
  CommandUtils: "0x72971413eC4D6F4298C9E906f85a9f78a73773a5",
  StringUtils: "0x888A8339fF7465DfE29BcC1f930B983C01a35C0a",
  defaultNetwork: "zkSyncMainnet",
};

const testnet = {
  DecimalUtils: "0x0b5900C91Cb1683182c6d279C22706e6a6C65Bfb",
  CommandUtils: "0x9821b97F3b585738648cfB50F3EfF9c5DB490Cc2",
  StringUtils: "0x86E65d11ef3C99ABb34a8C903552906E906661FE",
  defaultNetwork: "zkSyncSepolia",
};

const VARS = mainnet;

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
  defaultNetwork: VARS.defaultNetwork,
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
