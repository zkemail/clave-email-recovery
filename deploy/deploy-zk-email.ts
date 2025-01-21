import * as hre from "hardhat";
import { deployContract, getWallet } from "./utils";

const mainnet = {
  dkimRegistry: "0x7C2e50e58cb6D94BbDa7dCec1aF7634003892aD9",
  verifier: "0xC261ba8f3a2219Cd15a463C605c3E272cf105E00",
  emailAuthImpl: "0xFaCAd61572f4c7df60Eb951B875625cc29612f8B",
  factoryAddress: "0x4a06245B0CD0cAE3968f0BD048196d610f53B6b2",
  bytecodeHash:
    "0x010000817390a810b04c473d5adfe1538ac67c8dedf61f14c58e98b0c844bea5",
  minimumDelay: 0,
  killSwitchAuthorizer: "0x0000000000000000000000000000000000000000", // Please change this to the address of the kill switch authorizer
};

const testnet = {
  dkimRegistry: "0x07284efbc9A44eDE8Cf61daE96298FA16bf5591e",
  verifier: "0xCf619836B8fb82C9cAdF52d81644dd59Ed520DaE",
  emailAuthImpl: "0x398316B211BeEe5238BB34f8a4e565cCbA790ADC",
  factoryAddress: "0x934D44cD16a25C7Ef93583674cDb5F303bC8d393",
  bytecodeHash:
    "0x01000081183d2be3ef5a61113657f87b159436fbccec981e966ffd26816c2c34",
  minimumDelay: 0,
  killSwitchAuthorizer: "0x0000000000000000000000000000000000000000", // Please change this to the address of the kill switch authorizer
};

const VARS = mainnet;

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

  await deployContract(hre, proxyArtifactName, [VARS.emailAuthImpl, "0x"], {
    silent: true,
  });

  const EmailRecoveryModuleArtifactName = "EmailRecoveryModule";
  const emailRecoveryModule = await deployContract(
    hre,
    EmailRecoveryModuleArtifactName,
    [
      VARS.verifier,
      VARS.dkimRegistry,
      VARS.emailAuthImpl,
      commandHandlerAddress,
      VARS.minimumDelay,
      VARS.killSwitchAuthorizer,
      VARS.factoryAddress,
      VARS.bytecodeHash,
    ],
    {
      wallet,
      silent: false,
    }
  );

  const emailRecoveryModuleAddress = await emailRecoveryModule.getAddress();
  console.log("Email recovery module deployed at:", emailRecoveryModuleAddress);
}
