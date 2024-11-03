// This script calls setDKIMPublicKeyHash or revokeDKIMPublicKeyHash in UserOverridableDKIMRegistry on zksync sepolia
// Usage: npx ts-node scripts/dkim_registry.ts --command set --private-key <sender-private-key> --authorizer-private-key <authorizer-private-key>

import { Command } from 'commander';
import { Contract, ethers } from 'ethers';

const ZKSYNC_SEPOLIA_RPC_URL = 'https://sepolia.era.zksync.dev';
const ZKSYNC_SEPOLIA_CHAIN_ID = 300;

// TODO: Please modify the following values according to your specific use case
const USEROVERRIDEABLE_DKIM_REGISTRY_ADDRESS = "0x037d80f98aE461DC307F16524EC0Fc53b2E9E0b1"; // For zksync sepolia
const DOMAIN_NAME = "google.com";
const PUBLIC_KEY_HASH = "0x0ea9c777dc7110e5a9e89b13f0cfc540e3845ba120b2b6dc24024d61488d4784";

function computeSignedMsg(prefix: string, domainName: string, publicKeyHash: string): string {
    return `${prefix}domain=${domainName};public_key_hash=${publicKeyHash};`;
}

async function signMessage(message: string, privateKey: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    return await wallet.signMessage(message);
}

function initializeContract(privateKey: string) {
    const provider = new ethers.JsonRpcProvider(ZKSYNC_SEPOLIA_RPC_URL, {
        chainId: ZKSYNC_SEPOLIA_CHAIN_ID,
        name: 'zksync-sepolia'
    });

    const wallet = new ethers.Wallet(privateKey, provider);

    const abi = [
        "function setDKIMPublicKeyHash(string domainName, bytes32 publicKeyHash, address authorizer, bytes signature)",
        "function revokeDKIMPublicKeyHash(string domainName, bytes32 publicKeyHash, address authorizer, bytes signature)"
    ];
    return new Contract(USEROVERRIDEABLE_DKIM_REGISTRY_ADDRESS, abi, wallet);
}

async function setDKIMPublicKeyHash(
    domainName: string,
    publicKeyHash: string,
    authorizer: string,
    signature: string,
    privateKey: string
) {
    const registry = initializeContract(privateKey);

    try {
        const tx = await registry.setDKIMPublicKeyHash(domainName, publicKeyHash, authorizer, signature);
        console.log("Transaction Hash:", tx.hash);
        const receipt = await tx.wait();
        if (receipt) {
            console.log("Transaction was mined in block:", receipt.blockNumber);
        } else {
            console.log(`tx receipt not found`);
        }
    } catch (error) {
        console.error("Error sending transaction:", error);
    }
}

async function revokeDKIMPublicKeyHash(
    domainName: string,
    publicKeyHash: string,
    authorizer: string,
    signature: string,
    privateKey: string
) {
    const registry = initializeContract(privateKey);

    try {
        const tx = await registry.revokeDKIMPublicKeyHash(domainName, publicKeyHash, authorizer, signature);
        console.log("Transaction Hash:", tx.hash);
        const receipt = await tx.wait();
        if (receipt) {
            console.log("Transaction was mined in block:", receipt.blockNumber);
        } else {
            console.log(`tx receipt not found`);
        }
    } catch (error) {
        console.error("Error sending transaction:", error);
    }
}

async function main() {
    const program = new Command();

    program
        .option('-c, --command <type>', 'Command to execute: set or revoke')
        .option('-p, --private-key <key>', 'Sender private key')
        .option('-a, --authorizer-private-key <key>', 'Authorizer private key')
        .parse(process.argv);

    const options = program.opts();

    const command = options.command;
    const privateKey = options.privateKey;
    const privateKeyForAuthorizer = options.authorizerPrivateKey;

    if (!command || (command !== "set" && command !== "revoke")) {
        console.error("Error: Please specify 'set' or 'revoke' as the command.");
        process.exit(1);
    }

    if (!privateKey) {
        console.error("Error: Please provide a private key.");
        process.exit(1);
    }

    if (!privateKeyForAuthorizer) {
        console.error("Error: Please provide a private key for the authorizer.");
        process.exit(1);
    }

    const authorizerWallet = new ethers.Wallet(privateKeyForAuthorizer);
    const authorizer = authorizerWallet.address;

    const prefix = command === "set" ? "SET:" : "REVOKE:";
    const message = computeSignedMsg(prefix, DOMAIN_NAME, PUBLIC_KEY_HASH);
    console.log(message);

    const signature = await signMessage(message, privateKeyForAuthorizer);

    if (command === "set") {
        await setDKIMPublicKeyHash(DOMAIN_NAME, PUBLIC_KEY_HASH, authorizer, signature, privateKey);
    } else {
        await revokeDKIMPublicKeyHash(DOMAIN_NAME, PUBLIC_KEY_HASH, authorizer, signature, privateKey);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
