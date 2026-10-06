import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRecordStore } from '../records.js';

test('wallet match history survives a store restart and excludes interrupted games', () => {
    const directory = mkdtempSync(join(tmpdir(), 'color-clash-records-'));
    try {
        const players = [
            { id: 'a', name: 'Alex', walletAddress: '0x1111111111111111111111111111111111111111' },
            { id: 'b', name: 'Bo', walletAddress: '0x2222222222222222222222222222222222222222' },
            { id: 'c', name: 'Guest', walletAddress: null }
        ];
        const store = createRecordStore(directory);
        store.add({ gameId: 'one', players, winnerId: 'a', interrupted: false, ranked: true, chainEligible: true });
        store.add({ gameId: 'one', players, winnerId: 'a', interrupted: false, ranked: true, chainEligible: true });
        store.add({ gameId: 'two', players, winnerId: 'c', interrupted: true });
        store.add({ gameId: 'casual', players, winnerId: 'b', interrupted: false });
        const reloaded = createRecordStore(directory);
        assert.equal(reloaded.history(players[0].walletAddress).length, 2);
        assert.equal(reloaded.history(players[0].walletAddress)[1].outcome, 'win');
        assert.equal(reloaded.history(players[1].walletAddress)[1].outcome, 'loss');
        assert.equal(reloaded.leaderboard()[0].walletAddress, players[0].walletAddress);
        assert.equal(reloaded.leaderboard().length, 2);
        assert.deepEqual(reloaded.pendingChain().map(match => match.gameId), ['one']);
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
