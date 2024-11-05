// This script calls setDKIMPublicKeyHash or revokeDKIMPublicKeyHash in UserOverridableDKIMRegistry on zksync sepolia
// Usage: npx ts-node scripts/dkim_registry.ts --command set --private-key <sender-private-key> --authorizer-private-key <authorizer-private-key>

import { Command } from 'commander';
import { Contract, ethers } from 'ethers';

const ZKSYNC_SEPOLIA_RPC_URL = 'https://sepolia.era.zksync.dev';
const ZKSYNC_SEPOLIA_CHAIN_ID = 300;

// Define global variables
let registryAddress: string;
let domainName: string;
let publicKeyHash: string;
let authorizer: string;

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
    return new Contract(registryAddress, abi, wallet);
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

    // Check if no arguments were provided
    if (process.argv.length <= 2) {
        program.help();
    }

    program
        .name('dkim-registry')
        .description('CLI tool for managing DKIM registry entries')
        .version('1.0.0')
        .requiredOption('-c, --command <type>', 'Command to execute: set or revoke')
        .requiredOption('-p, --private-key <key>', 'Sender private key')
        .requiredOption('-r, --registry-address <address>', 'UserOverridableDKIMRegistry contract address')
        .requiredOption('-d, --domain-name <name>', 'Domain name')
        .requiredOption('-k, --public-key-hash <hash>', 'Public key hash')
        .requiredOption('-a, --authorizer <address>', 'Authorizer address')
        .requiredOption('-ap, --authorizer-private-key <key>', 'Authorizer private key')
        .on('--help', () => {
            console.log('');
            console.log('Example call:');
            console.log('  $ npx ts-node scripts/dkim_registry.ts --command set --private-key <sender-private-key> --authorizer <authorizer-address> --authorizer-private-key <authorizer-private-key> --registry-address <address> --domain-name <name> --public-key-hash <hash>');
            console.log('  $ npx ts-node scripts/dkim_registry.ts --command set --private-key 0x3d3cbc973389cb26f657686445bcc75662b415b656078503592ac8c1abb8810e --authorizer 0x55bE1B079b53962746B2e86d12f158a41DF294A6 --authorizer-private-key 0x509ca2e9e6acf0ba086477910950125e698d4ea70fa6f63e000c5a22bda9361c --registry-address 0x037d80f98aE461DC307F16524EC0Fc53b2E9E0b1 --domain-name gmail.com --public-key-hash 0x0ea9c777dc7110e5a9e89b13f0cfc540e3845ba120b2b6dc24024d61488d4788');
        })
        .parse(process.argv);

    const options = program.opts();

    // Assign values to global variables
    registryAddress = options.registryAddress;
    domainName = options.domainName;
    publicKeyHash = options.publicKeyHash;
    authorizer = options.authorizer;

    const command = options.command;
    const privateKey = options.privateKey;
    const authorizerPrivateKey = options.authorizerPrivateKey;

    const prefix = command === "set" ? "SET:" : "REVOKE:";
    const message = computeSignedMsg(prefix, domainName, publicKeyHash);
    console.log(message);

    // Use the authorizer's private key to sign the message
    const signature = await signMessage(message, authorizerPrivateKey);

    if (command === "set") {
        await setDKIMPublicKeyHash(domainName, publicKeyHash, authorizer, signature, privateKey);
    } else {
        await revokeDKIMPublicKeyHash(domainName, publicKeyHash, authorizer, signature, privateKey);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
