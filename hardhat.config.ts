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
        "@zk-email/email-recovery/src/libraries/StringUtils.sol": {
          StringUtils: "0xF9D368D27d2770576B1EDf18e58109F58a76f31c",
        },
        "@zk-email/ether-email-auth-contracts/src/libraries/DecimalUtils.sol": {
          DecimalUtils: "0xb6E766EAb892dFFD377F85679dDAef944Ad1ABfa",
        },
        "@zk-email/ether-email-auth-contracts/src/libraries/CommandUtils.sol": {
          CommandUtils: "0x5b307e22e1B5713BD9857c25647cC6b6620705eD",
        },
        "contracts/libraries/StringUtils.sol": {
          StringUtils: "0x4158e275f603C0C37a571F4aB695D7305AE5511d",
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
