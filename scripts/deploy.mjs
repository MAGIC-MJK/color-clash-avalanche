import { JsonRpcProvider, Wallet, ContractFactory } from 'ethers';
import { compileResults } from './compile.mjs';

const rpcUrl = process.env.RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!privateKey) throw new Error('Set DEPLOYER_PRIVATE_KEY for a dedicated deployment wallet.');

const provider = new JsonRpcProvider(rpcUrl);
const network = await provider.getNetwork();
if (network.chainId !== 43113n && network.chainId !== 31337n) {
    throw new Error(`Unsupported chain ID: ${network.chainId}`);
}
const signer = new Wallet(privateKey, provider);
const { abi, bytecode } = compileResults();
const contract = await new ContractFactory(abi, bytecode, signer).deploy();
await contract.waitForDeployment();
console.log(`GameResults deployed to chain ${network.chainId}: ${await contract.getAddress()}`);
