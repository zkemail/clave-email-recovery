import * as hre from "hardhat";
import { deployContract, getWallet } from "./utils";

const factoryAddress = "0xeAf2aCE9a926Ab3a155dCbeDe74A1541d471E286";
const verifier = "0xfCb6e1BAf589dc25f1224998eA0a256e8A542A29";
const dkimRegistry = "0x140ba2dDf1D49B4BC4Bce0D5816b424584703B53";
const emailAuthImpl = "0xe4E21f8dA20c66FB05feef1668e6a8529A9Ac3C9";

export default async function (): Promise<void> {
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

  const proxyArtifactName =
    "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy";

  await deployContract(hre, proxyArtifactName, [emailAuthImpl, "0x"], {
    silent: true,
  });

  const minimumDelay = 0;
  const bytecodeHash =
    "0x01000081e1a320a6d3dc2345f32b97538854bcf0c95ef3ad8e2a17227f9104f6";

  const EmailRecoveryModuleArtifactName = "EmailRecoveryModule";
  const emailRecoveryModule = await deployContract(
    hre,
    EmailRecoveryModuleArtifactName,
    [
      verifier,
      dkimRegistry,
      emailAuthImpl,
      commandHandlerAddress,
      minimumDelay,
      factoryAddress,
      bytecodeHash,
    ],
    {
      wallet,
      silent: false,
    }
  );

  const emailRecoveryModuleAddress = await emailRecoveryModule.getAddress();
  console.log("Email recovery module deployed at:", emailRecoveryModuleAddress);
}
