import test from 'node:test';
import assert from 'node:assert/strict';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory, id, ZeroAddress } from 'ethers';
import { compileResults } from '../scripts/compile.mjs';

test('recorder stores guest matches and wallet wins without replay', async () => {
    const provider = new BrowserProvider(ganache.provider({ logging: { quiet: true } }));
    const recorder = await provider.getSigner(0);
    const outsider = await provider.getSigner(1);
    const alice = await recorder.getAddress();
    const bob = await outsider.getAddress();
    const { abi, bytecode } = compileResults();
    const contract = await new ContractFactory(abi, bytecode, recorder).deploy();
    await contract.waitForDeployment();

    const first = id('ranked-first');
    await (await contract.recordMatch(first, id('alice-id'), alice, [alice, bob, ZeroAddress, ZeroAddress])).wait();
    assert.equal(await contract.wins(alice), 1n);
    assert.equal(await contract.losses(bob), 1n);
    assert.equal(await contract.rankedPlayerCount(), 2n);
    assert.equal((await contract.rankedMatches(first)).recorded, true);
    await assert.rejects(contract.recordMatch(first, id('alice-id'), alice, [alice, bob]));
    await assert.rejects(contract.connect(outsider).recordMatch(id('unauthorized'), id('bob-id'), bob, [alice, bob]));

    await (await contract.recordMatch(id('guest-win'), id('guest-id'), ZeroAddress, [alice, bob, ZeroAddress])).wait();
    assert.equal(await contract.losses(alice), 1n);
    assert.equal(await contract.losses(bob), 2n);
    await assert.rejects(contract.recordMatch(id('duplicate'), id('alice-id'), alice, [alice, alice]));
});
