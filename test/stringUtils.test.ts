import * as hre from "hardhat";
import { expect } from "chai";
import { AbiCoder } from "ethers";
import { ethers } from "ethers";
import { deployContract, getWallet, LOCAL_RICH_WALLETS } from "../deploy/utils";

describe("StringUtilsTester", function () {
  let testStringUtils: ethers.Contract;

  before(async function () {
    const wallet = getWallet(hre, LOCAL_RICH_WALLETS[0].privateKey);

    const contractArtifactName = "StringUtilsTester";
    testStringUtils = await deployContract(
      hre,
      contractArtifactName,
      undefined,
      {
        wallet,
        silent: true,
        noVerify: true,
      }
    );
  });

  const setTestHexString = async (
    randomLength: number,
    functionName: "testHexToBytes32" | "testHexToBytes"
  ): Promise<[string, string]> => {
    const randomBytes = ethers.randomBytes(randomLength);
    const randomHexString = ethers.hexlify(randomBytes).toLowerCase();

    console.log("Test hex string: ", randomHexString);

    let hexString = ethers.hexlify(randomBytes);

    hexString = hexString.toLowerCase();

    const encodedData = AbiCoder.defaultAbiCoder().encode(
      ["string"],
      [hexString]
    );

    const result = await testStringUtils[functionName](encodedData);

    return [randomHexString, result];
  };

  it("should correctly convert 32 bytes hex string to bytes", async function () {
    const [randomHexString, result] = await setTestHexString(
      32,
      "testHexToBytes32"
    );

    expect(result).to.eql(randomHexString);
  });

  it("should correctly convert 32 bytes hex string to bytes", async function () {
    const [randomHexString, result] = await setTestHexString(
      32,
      "testHexToBytes"
    );

    expect(result).to.eql(randomHexString);
  });

  it("should correctly convert 64 bytes hex string to bytes", async function () {
    const [randomHexString, result] = await setTestHexString(
      64,
      "testHexToBytes"
    );

    expect(result).to.eql(randomHexString);
  });

  it("should correctly convert 64 bytes hex string to bytes (10 times)", async function () {
    for (let i = 0; i < 10; i++) {
      const [randomHexString, result] = await setTestHexString(
        64,
        "testHexToBytes"
      );

      expect(result).to.eql(randomHexString);
    }
  });

  it("should correctly convert random length hex string to bytes (10 times)", async function () {
    const min = 10;
    const max = 70;

    for (let i = 0; i < 10; i++) {
      const [randomHexString, result] = await setTestHexString(
        Math.floor(Math.random() * (max - min + 1)) + min,
        "testHexToBytes"
      );

      expect(result).to.eql(randomHexString);
    }
  });
});
