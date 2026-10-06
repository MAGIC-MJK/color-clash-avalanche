import { BrowserProvider, Contract, id } from 'ethers';

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const chainId = Number(import.meta.env.VITE_CHAIN_ID || 43113);
const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const abi = [
    'function attest(bytes32 gameId, address[] players, address winner) external',
    'function results(bytes32 gameId) view returns (bytes32 playersHash, address winner, uint8 confirmations, bool finalized)',
    'function confirmed(bytes32 gameId, address player) view returns (bool)'
];

export function chainConfigured() {
    return Boolean(contractAddress);
}

export async function connectWallet(challenge) {
    if (!window.ethereum) throw new Error('Install a wallet such as Core or MetaMask first.');
    if (!challenge) throw new Error('Game server is not connected yet.');
    const provider = new BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    return { address: await signer.getAddress(), signature: await signer.signMessage(challenge) };
}

async function switchNetwork() {
    const hexId = `0x${chainId.toString(16)}`;
    try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
    } catch (error) {
        if (error.code !== 4902) throw error;
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: hexId, chainName: chainId === 43113 ? 'Avalanche Fuji C-Chain' : 'Local game chain',
                rpcUrls: [rpcUrl], nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
                ...(chainId === 43113 ? { blockExplorerUrls: ['https://testnet.snowtrace.io'] } : {}) }]
        });
    }
}

export async function attestResult(game) {
    if (!contractAddress) throw new Error('Contract address is not configured.');
    await switchNetwork();
    const signer = await new BrowserProvider(window.ethereum).getSigner();
    const contract = new Contract(contractAddress, abi, signer);
    const gameId = id(game.gameId);
    const players = game.players.map(player => player.walletAddress);
    const winner = game.players.find(player => player.id === game.winnerId)?.walletAddress;
    const transaction = await contract.attest(gameId, players, winner);
    await transaction.wait();
    const result = await contract.results(gameId);
    return {
        confirmations: Number(result.confirmations),
        finalized: result.finalized,
        txUrl: chainId === 43113 ? `https://testnet.snowtrace.io/tx/${transaction.hash}` : null
    };
}
