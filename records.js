import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function createRecordStore(directory) {
    const file = join(directory, 'records.json');
    const matches = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];

    function save() {
        mkdirSync(directory, { recursive: true, mode: 0o700 });
        const temporary = `${file}.${process.pid}.tmp`;
        writeFileSync(temporary, JSON.stringify(matches), { mode: 0o600 });
        renameSync(temporary, file);
    }

    function add({ gameId, players, winnerId, interrupted, ranked = false, chainEligible = false }) {
        if (!gameId || !winnerId || interrupted || matches.some(match => match.gameId === gameId)) return;
        matches.push({ gameId, playedAt: new Date().toISOString(), winnerId, ranked, chainEligible,
            players: players.map(({ id, name, walletAddress }) => ({ id, name, walletAddress })), chainRecorded: false, chainTx: null });
        save();
    }

    function pendingChain() {
        return matches.filter(match => match.gameId && match.winnerId && match.ranked && match.chainEligible && !match.chainRecorded);
    }

    function markChainRecorded(gameId, chainTx) {
        const match = matches.find(entry => entry.gameId === gameId);
        if (!match) return;
        match.chainRecorded = true;
        match.chainTx = chainTx;
        save();
    }

    function history(walletAddress) {
        const address = walletAddress.toLowerCase();
        return matches.filter(match => match.players.some(player => player.walletAddress?.toLowerCase() === address))
            .slice(-100).reverse().map(match => {
                const player = match.players.find(entry => entry.walletAddress?.toLowerCase() === address);
                return { gameId: match.gameId, playedAt: match.playedAt,
                    outcome: player.id === match.winnerId ? 'win' : 'loss',
                    ranked: Boolean(match.ranked),
                    chainRecorded: Boolean(match.chainRecorded), chainTx: match.chainTx,
                    opponents: match.players.filter(entry => entry.id !== player.id).map(entry => entry.name) };
            });
    }

    function leaderboard() {
        const scores = new Map();
        for (const match of matches) {
            if (!match.ranked) continue;
            for (const player of match.players) {
                if (!player.walletAddress) continue;
                const address = player.walletAddress.toLowerCase();
                const score = scores.get(address) || { walletAddress: player.walletAddress, name: player.name, wins: 0, losses: 0 };
                score.name = player.name;
                if (player.id === match.winnerId) score.wins++;
                else score.losses++;
                scores.set(address, score);
            }
        }
        return [...scores.values()].sort((a, b) => b.wins - a.wins || a.losses - b.losses).slice(0, 20);
    }

    function rewardTotal(walletAddress) {
        const address = walletAddress.toLowerCase();
        return matches.reduce((total, match) => {
            const player = match.players.find(entry => entry.walletAddress?.toLowerCase() === address);
            return total + (player ? 20 + (player.id === match.winnerId ? 10 : 0) : 0);
        }, 0);
    }

    return { add, history, leaderboard, rewardTotal, pendingChain, markChainRecorded };
}
