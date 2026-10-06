import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cosmeticCatalog } from './cosmetics-catalog.js';

export function createCosmeticStore(directory, recordStore) {
    const file = join(directory, 'cosmetics.json');
    const accounts = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};

    function save() {
        mkdirSync(directory, { recursive: true, mode: 0o700 });
        const temporary = `${file}.${process.pid}.tmp`;
        writeFileSync(temporary, JSON.stringify(accounts), { mode: 0o600 });
        renameSync(temporary, file);
    }

    function account(address) {
        return accounts[address.toLowerCase()] || { owned: [], equippedBack: 'classic', equippedOutfit: null };
    }

    function profile(address) {
        const saved = account(address);
        const spent = saved.owned.reduce((sum, id) => sum + (cosmeticCatalog.find(item => item.id === id)?.price || 0), 0);
        return { coins: Math.max(0, recordStore.rewardTotal(address) - spent), owned: saved.owned,
            equippedBack: saved.equippedBack, equippedOutfit: saved.equippedOutfit };
    }

    function change(address, action, id) {
        const item = cosmeticCatalog.find(entry => entry.id === id);
        if (!item) return { error: 'Unknown item.' };
        const current = profile(address);
        const saved = account(address);
        if (action === 'buy') {
            if (item.price === 0 || current.owned.includes(id)) return { error: 'Already owned.' };
            if (current.coins < item.price) return { error: 'Not enough coins.' };
            saved.owned = [...current.owned, id];
        } else if (action === 'equip') {
            if (item.price && !current.owned.includes(id)) return { error: 'Item not owned.' };
            if (item.type === 'back') saved.equippedBack = id;
            else saved.equippedOutfit = id;
        } else return { error: 'Unknown action.' };
        accounts[address.toLowerCase()] = saved;
        save();
        return { profile: profile(address) };
    }

    return { profile, change };
}
