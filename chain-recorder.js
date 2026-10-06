import { Contract, JsonRpcProvider, Wallet, ZeroAddress, id } from 'ethers';

const abi = [
    'function recorder() view returns (address)',
    'function rankedMatches(bytes32) view returns (bytes32 winnerId, address winnerWallet, uint8 playerCount, bool recorded)',
    'function recordMatch(bytes32 gameId, bytes32 winnerId, address winnerWallet, address[] wallets) external'
];

export function createChainRecorder({ privateKey, contractAddress, rpcUrl }) {
    if (!privateKey || !contractAddress) return null;
    const provider = new JsonRpcProvider(rpcUrl || 'https://api.avax-test.network/ext/bc/C/rpc');
    const signer = new Wallet(privateKey, provider);
    const contract = new Contract(contractAddress, abi, signer);

    return async function recordMatch(game) {
        const network = await provider.getNetwork();
        if (network.chainId !== 43113n && network.chainId !== 31337n) throw new Error('Result recorder only supports Fuji or a local test chain.');
        if ((await contract.recorder()).toLowerCase() !== signer.address.toLowerCase()) throw new Error('Configured wallet is not the contract recorder.');
        const gameId = id(game.gameId);
        if ((await contract.rankedMatches(gameId)).recorded) return null;
        const winnerWallet = game.players.find(player => player.id === game.winnerId)?.walletAddress || ZeroAddress;
        const wallets = game.players.map(player => player.walletAddress || ZeroAddress);
        const transaction = await contract.recordMatch(gameId, id(game.winnerId), winnerWallet, wallets);
        await transaction.wait();
        return transaction.hash;
    };
}
