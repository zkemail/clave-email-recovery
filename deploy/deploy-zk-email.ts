import * as hre from "hardhat";
import {
  deployContract,
  getContractBytecodeHash,
  getDeployer,
  getWallet,
} from "./utils";

const factoryAddress = "0xae3c9D26fa525d0Bb119B0b82BBa99C243636f92";
const verifier = "0x2B31d708954cD1DCe72Dc7EF0afbCc47d66B745E";
const dkimRegistry = "0x27DeFd8c8195A6d01085154077B46563bFE3Ea9C";
const emailAuthImpl = "0x5A8D5e98091A1Eb38F15f1927c421C105b11cc54";

export default async function (): Promise<void> {
  const deployer = getDeployer(hre);
  const proxyArtifactName =
    "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy";
  const artifact = await deployer.loadArtifact(proxyArtifactName);

  const bytecodeHash = getContractBytecodeHash(artifact.bytecode);

  console.log("bytecodehash should be: ", bytecodeHash);

  const wallet = getWallet(hre);
  const contractArtifactName = "EmailRecoveryCommandHandler";
  const commandHandler = await deployContract(
    hre,
    contractArtifactName,
    undefined,
    {
      wallet,
      silent: false,
    }
  );

  const commandHandlerAddress = await commandHandler.getAddress();
  console.log("Command handler deployed at:", commandHandlerAddress);

  await deployContract(
    hre,
    "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
    [emailAuthImpl, "0x"]
  );

  const module = await deployContract(
    hre,
    "EmailRecoveryModule",
    [
      verifier,
      dkimRegistry,
      emailAuthImpl,
      commandHandlerAddress,
      factoryAddress,
    ],
    {
      wallet,
      silent: false,
    }
  );

  const moduleAddress = await module.getAddress();
  console.log("Module deployed at:", moduleAddress);
}
