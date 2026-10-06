import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRecordStore } from '../records.js';
import { createCosmeticStore } from '../cosmetics-store.js';

test('wallet cosmetics use completed match rewards and survive restart', () => {
    const directory = mkdtempSync(join(tmpdir(), 'color-clash-cosmetics-'));
    try {
        const records = createRecordStore(directory);
        const address = '0x0000000000000000000000000000000000000001';
        const players = [{ id: 'a', name: 'A', walletAddress: address }, { id: 'b', name: 'B' }];
        for (let i = 0; i < 3; i++) records.add({ gameId: `game-${i}`, players, winnerId: 'a', interrupted: false });
        records.add({ gameId: 'interrupted', players, winnerId: 'a', interrupted: true });
        const shop = createCosmeticStore(directory, records);
        assert.equal(shop.profile(address).coins, 90);
        assert.deepEqual(shop.change(address, 'buy', 'mountain').error, undefined);
        assert.equal(shop.profile(address).coins, 10);
        assert.deepEqual(shop.change(address, 'equip', 'mountain').profile.equippedBack, 'mountain');
        assert.equal(shop.change(address, 'buy', 'treasure').error, 'Not enough coins.');
        assert.equal(createCosmeticStore(directory, records).profile(address).equippedBack, 'mountain');
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
