import * as hre from "hardhat";
import { deployContract, getWallet } from "./utils";

const mainnet = {
  factoryAddress: "0x147E23A284dde7FF6b42f835253B9b0CBce6c84e",
  verifier: "0x520E9fc008f58ba339EEB6AbAeF30d3325F3F5C4",
  dkimRegistry: "0xA10bAa5FA41E25Eb50711a57AA2f0a9c06A6A009",
  emailAuthImpl: "0xe8b70B310D0f0e35985e757c5a73290Dcc24Eb69",
  bytecodeHash:
    "0x010000810f12e857cc327d0fe44fd50632c222c2082ffa123c42102ff78a47cd",
  minimumDelay: 0,
};

const testnet = {
  factoryAddress: "0x1a9806ECa5a86e2A614647a2B1245762520fB729",
  verifier: "0xbcd38daF327818De796fE8de684b392A4B4584C8",
  dkimRegistry: "0x743ADbd9886Aebe79a9D2dEB4f5c8686DB7463D9",
  emailAuthImpl: "0x51233067952888A99E692d263550e6f33Ab00194",
  bytecodeHash:
    "0x01000081bdf506a8c0ed71857afdab50746414f3bfc88c376acfb2bcfb3baa18",
  minimumDelay: 0,
};

const VARS = testnet;

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
