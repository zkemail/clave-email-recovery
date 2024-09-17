import * as hre from "hardhat";
import { deployContract, getWallet, getDeployer } from "./utils";
import { utils } from "zksync-ethers";

const factoryAddress = "0xae3c9D26fa525d0Bb119B0b82BBa99C243636f92";
const verifier = "0xbabFc29e79b4935e1B99515c02354CdA2c2fDA6A";
const dkimRegistry = "0x2D3908e61B436A80bfDDD2772E7179da5A87a597";
const emailAuthImpl = "0x87c0F604256f4C92D7e80699238623370e266A16";

export default async function (): Promise<void> {
  const deployer = getDeployer(hre);
  const proxyArtifactName =
    "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy";
  const artifact = await deployer.loadArtifact(proxyArtifactName);

  const bytecodeHash = utils.hashBytecode(artifact.bytecode);
  const bytes32String =
    "0x" +
    Array.from(bytecodeHash)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

  console.log("bytecodehash should be: ", bytes32String);

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
