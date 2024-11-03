// This script calls toggleKillSwitch in the module contract implementing EmailRecoveryManager on zksync sepolia
// Usage: npx ts-node scripts/kill_switch.ts --private-key <sender-private-key>

import { Command } from 'commander';
import { Contract, ethers } from 'ethers';

const ZKSYNC_SEPOLIA_RPC_URL = 'https://sepolia.era.zksync.dev';
const ZKSYNC_SEPOLIA_CHAIN_ID = 300;

// TODO: Please modify the following values according to your specific use case
const MODULE_ADDRESS = "0x037d80f98aE461DC307F16524EC0Fc53b2E9E0b1"; // For zksync sepolia

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
        "function toggleKillSwitch()",
    ];
    return new Contract(MODULE_ADDRESS, abi, wallet);
}

async function toggleKillSwitch(
    privateKey: string
) {
    const module = initializeContract(privateKey);

    try {
        const tx = await module.toggleKillSwitch();
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
        .option('-p, --private-key <key>', 'Authorizer private key')
        .parse(process.argv);

    const options = program.opts();

    const privateKey = options.privateKey;

    if (!privateKey) {
        console.error("Error: Please provide a private key.");
        process.exit(1);
    }

    await toggleKillSwitch(privateKey);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
