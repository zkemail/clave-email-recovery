// This script calls toggleKillSwitch in the module contract implementing EmailRecoveryManager on zksync sepolia
// Usage: npx ts-node scripts/kill_switch.ts --private-key <sender-private-key>

import { Command } from 'commander';
import { Contract, ethers } from 'ethers';

const ZKSYNC_SEPOLIA_RPC_URL = 'https://sepolia.era.zksync.dev';
const ZKSYNC_SEPOLIA_CHAIN_ID = 300;

async function toggleKillSwitch(
    privateKey: string,
    moduleAddress: string
) {
    const module = initializeContract(privateKey, moduleAddress);

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

function initializeContract(privateKey: string, moduleAddress: string) {
    const provider = new ethers.JsonRpcProvider(ZKSYNC_SEPOLIA_RPC_URL, {
        chainId: ZKSYNC_SEPOLIA_CHAIN_ID,
        name: 'zksync-sepolia'
    });

    const wallet = new ethers.Wallet(privateKey, provider);

    const abi = [
        "function toggleKillSwitch()",
    ];
    return new Contract(moduleAddress, abi, wallet);
}

async function main() {
    const program = new Command();

    program
        .requiredOption('-p, --private-key <key>', 'Authorizer private key')
        .requiredOption('-m, --module-address <address>', 'Module contract address')
        .description('Toggle the kill switch for a specified module contract')
        .helpOption('-h, --help', 'Display help for command')
        .addHelpText('after', `
        
Example usage:
  npx ts-node scripts/kill_switch.ts -p 0x3d3cbc973389cb26f657686445bcc75662b415b656078503592ac8c1abb8810e -m 0x037d80f98aE461DC307F16524EC0Fc53b2E9E0b1
        `) // Add example usage
        .parse(process.argv);

    const options = program.opts();

    const privateKey = options.privateKey;
    const moduleAddress = options.moduleAddress;

    await toggleKillSwitch(privateKey, moduleAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
