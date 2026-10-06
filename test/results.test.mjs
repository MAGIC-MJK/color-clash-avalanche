import test from 'node:test';
import assert from 'node:assert/strict';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory, Contract, id } from 'ethers';
import { compileResults } from '../scripts/compile.mjs';

test('ten players must confirm the same winner before the result is final', async () => {
    const provider = new BrowserProvider(ganache.provider({
        logging: { quiet: true },
        wallet: { totalAccounts: 10 }
    }));
    const signers = await Promise.all(Array.from({ length: 10 }, (_, i) => provider.getSigner(i)));
    const players = await Promise.all(signers.map(signer => signer.getAddress()));
    const { abi, bytecode } = compileResults();
    const contract = await new ContractFactory(abi, bytecode, signers[0]).deploy();
    await contract.waitForDeployment();
    const gameId = id('ten-player-demo');

    await (await contract.attest(gameId, players, players[2])).wait();
    let result = await contract.results(gameId);
    assert.equal(result.confirmations, 1n);
    assert.equal(result.finalized, false);

    const wrong = new Contract(await contract.getAddress(), abi, signers[1]);
    await assert.rejects(wrong.attest.staticCall(gameId, players, players[1]), /Result differs/);
    for (let i = 1; i < 10; i++) {
        await (await contract.connect(signers[i]).attest(gameId, players, players[2])).wait();
    }
    result = await contract.results(gameId);
    assert.equal(result.confirmations, 10n);
    assert.equal(result.finalized, true);
    assert.equal(result.winner, players[2]);
});
