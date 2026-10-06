import test from 'node:test';
import assert from 'node:assert/strict';
import ganache from 'ganache';
import { Contract, ContractFactory, JsonRpcProvider, Wallet, ZeroAddress, id } from 'ethers';
import { compileResults } from '../scripts/compile.mjs';
import { createChainRecorder } from '../chain-recorder.js';

test('server recorder writes a completed match and ignores replay', async () => {
    const privateKey = `0x${'11'.repeat(32)}`;
    const server = ganache.server({ logging: { quiet: true }, chain: { chainId: 31337 },
        wallet: { accounts: [{ secretKey: privateKey, balance: '0x3635C9ADC5DEA00000' }] } });
    await server.listen(0);
    try {
        const rpcUrl = `http://127.0.0.1:${server.address().port}`;
        const signer = new Wallet(privateKey, new JsonRpcProvider(rpcUrl));
        const { abi, bytecode } = compileResults();
        const contract = await new ContractFactory(abi, bytecode, signer).deploy();
        await contract.waitForDeployment();
        const record = createChainRecorder({ privateKey, contractAddress: await contract.getAddress(), rpcUrl });
        const game = { gameId: 'game-one', winnerId: 'guest-a', players: [
            { id: 'guest-a', walletAddress: null }, { id: 'guest-b', walletAddress: null }
        ] };
        const txHash = await record(game);
        assert.match(txHash, /^0x[0-9a-f]{64}$/i);
        assert.equal(await record(game), null);
        const reader = new Contract(await contract.getAddress(), abi, signer);
        assert.equal((await reader.rankedMatches(id(game.gameId))).winnerWallet, ZeroAddress);
    } finally {
        await server.close();
    }
});
