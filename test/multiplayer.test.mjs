import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';

const port = 18080;
const url = `ws://127.0.0.1:${port}`;

async function waitFor(predicate, timeout = 5000) {
    const until = Date.now() + timeout;
    while (!predicate()) {
        if (Date.now() > until) throw new Error('Timed out waiting for game state');
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}

test('five players start one game without revealing opponents’ hands', async () => {
    const auditDir = mkdtempSync(join(tmpdir(), 'color-clash-audit-'));
    const auditPath = join(auditDir, 'matches.jsonl');
    const server = spawn(process.execPath, ['server.js'], {
        cwd: new URL('..', import.meta.url),
        env: { ...process.env, WS_PORT: String(port), MATCH_LOG_PATH: auditPath, GAME_DATA_DIR: auditDir }
    });
    const sockets = [];
    let serverErrors = '';
    server.stderr.on('data', chunk => { serverErrors += chunk.toString(); });
    try {
        await new Promise((resolve, reject) => {
            server.stdout.on('data', chunk => {
                if (chunk.toString().includes('Server started')) resolve();
            });
            server.once('error', reject);
            server.once('exit', code => reject(new Error(`Server exited: ${code}`)));
        });
        const messages = [];
        for (let i = 0; i < 5; i++) {
            const socket = new WebSocket(url);
            sockets.push(socket);
            messages[i] = [];
            socket.on('message', raw => messages[i].push(JSON.parse(raw.toString())));
            await once(socket, 'open');
            socket.send(JSON.stringify({ action: 'join', name: `Player${i}`, lobbyId: 'FIVE01',
                avatar: i === 0 ? { hair: 'ponytail', skinColor: 'tan', suitColor: 'violet', cape: 'dark', unexpected: '<script>' } : undefined }));
        }
        await waitFor(() => messages.every(inbox => inbox.some(message => message.action === 'players' && message.players.length === 5)));
        for (const socket of sockets) socket.send(JSON.stringify({ action: 'ready' }));
        await waitFor(() => messages.every(inbox => inbox.some(message => message.action === 'start')));

        const ids = new Set();
        for (const inbox of messages) {
            const started = inbox.find(message => message.action === 'start');
            ids.add(started.id);
            assert.equal(started.players.length, 5);
            assert.equal(started.hand.length, 7);
            assert.ok(started.players.every(player => !Object.hasOwn(player, 'hand')));
            assert.equal(started.players[0].avatar.hair, 'ponytail');
            assert.equal(started.players[0].avatar.skinColor, 'tan');
            assert.equal(started.players[0].avatar.suitColor, 'violet');
            assert.equal(started.players[0].avatar.cape, 'dark');
            assert.ok(!Object.hasOwn(started.players[0].avatar, 'unexpected'));
        }
        assert.equal(ids.size, 5);

        const sixth = new WebSocket(url);
        sockets.push(sixth);
        const sixthMessages = [];
        sixth.on('message', raw => sixthMessages.push(JSON.parse(raw.toString())));
        await once(sixth, 'open');
        sixth.send(JSON.stringify({ action: 'join', name: 'Player6', lobbyId: 'FIVE01' }));
        await waitFor(() => sixthMessages.some(message => message.action === 'error'));

        const clientById = new Map(messages.map((inbox, index) => [
            inbox.find(message => message.action === 'start').id, index
        ]));
        let caughtUno = false;
        let announcedUno = false;
        let challengedWild4 = false;
        let lastWild4 = null;
        for (let move = 0; move < 2000 && !messages[0].some(message => message.action === 'win'); move++) {
            const state = messages[0].filter(message => message.action === 'start' || message.action === 'update').at(-1);
            const playerIndex = clientById.get(state.players[state.turn].id);
            const handState = messages[playerIndex].filter(message => message.action === 'start' || message.action === 'update').at(-1);
            const hand = handState.hand;
            const topCard = state.discardPile.at(-1);
            if (state.pendingWild4) {
                const updateCount = messages[0].filter(message => message.action === 'update').length;
                const beforeTarget = state.players[playerIndex].cardCount;
                const beforeOffender = state.players[lastWild4.playerIndex].cardCount;
                sockets[playerIndex].send(JSON.stringify({ action: 'challenge_wild4' }));
                await waitFor(() => messages[0].filter(message => message.action === 'update').length > updateCount);
                const resolved = messages[0].filter(message => message.action === 'update').at(-1);
                assert.equal(resolved.pendingWild4, null);
                if (lastWild4.illegal) {
                    assert.equal(resolved.players[lastWild4.playerIndex].cardCount, beforeOffender + 4);
                    assert.equal(resolved.turn, playerIndex);
                } else {
                    assert.equal(resolved.players[playerIndex].cardCount, beforeTarget + 6);
                }
                challengedWild4 = true;
                lastWild4 = null;
                continue;
            }
            const card = handState.drawnCardIndex === null || handState.drawnCardIndex === undefined
                ? hand.find(candidate => (candidate.color === topCard.color || candidate.type === topCard.type ||
                    candidate.type === 'wild' || candidate.type === 'wild4'))
                : hand[handState.drawnCardIndex];
            if (caughtUno && !announcedUno && hand.length === 2 && card) {
                const count = messages[0].filter(message => message.action === 'update').length;
                sockets[playerIndex].send(JSON.stringify({ action: 'uno' }));
                await waitFor(() => messages[0].filter(message => message.action === 'update').length > count);
                const called = messages[0].filter(message => message.action === 'update').at(-1);
                assert.equal(called.unoAnnouncement?.playerId, state.players[state.turn].id);
                assert.equal(called.players[playerIndex].predeclaredUno, true);
                announcedUno = true;
            }
            if (card?.type === 'wild4') {
                lastWild4 = { playerIndex, illegal: hand.some(other => other.color === topCard.color) };
            }
            const updateCount = messages[0].filter(message => message.action === 'update').length;
            sockets[playerIndex].send(JSON.stringify(card
                ? { action: 'play', card: card.type.startsWith('wild') ? { ...card, color: 'red' } : card }
                : { action: 'draw' }));
            try {
                await waitFor(() => messages[0].filter(message => message.action === 'update').length > updateCount);
            } catch {
                throw new Error(`Move ${move} stalled: player ${playerIndex}, card ${JSON.stringify(card)}, top ${JSON.stringify(topCard)}, hand ${JSON.stringify(hand)}, server ${serverErrors}`);
            }
            const latest = messages[0].filter(message => message.action === 'update').at(-1);
            if (!caughtUno && latest.unoPending) {
                const target = latest.players.find(player => player.id === latest.unoPending);
                const catcher = (clientById.get(target.id) + 1) % 5;
                const count = messages[0].filter(message => message.action === 'update').length;
                sockets[catcher].send(JSON.stringify({ action: 'catch_uno' }));
                await waitFor(() => messages[0].filter(message => message.action === 'update').length > count);
                const caught = messages[0].filter(message => message.action === 'update').at(-1);
                assert.equal(caught.players.find(player => player.id === target.id).cardCount, 3);
                caughtUno = true;
            }
        }
        const win = messages[0].find(message => message.action === 'win');
        assert.ok(win, 'the five-player game should finish');
        assert.equal(win.players.length, 5);
        assert.ok(win.gameId);
        assert.ok(caughtUno, 'missed UNO can be reported for a two-card penalty');
        assert.ok(announcedUno, 'calling UNO before playing announces it to the table');
        assert.ok(challengedWild4, 'a legal +4 challenge draws six cards');
        assert.equal(win.roundScores[win.players.find(player => player.name === win.winner).id], 0);
        assert.ok(win.players.every(player => win.roundScores[player.id] <= 0));
        const audit = JSON.parse(readFileSync(auditPath, 'utf8').trim().split('\n')[0]);
        assert.equal(audit.gameId, win.gameId);
        assert.equal(audit.deckOrder.length, 108);
        assert.ok(audit.events.some(event => event.action === 'play'));
        assert.equal(audit.events.at(-1).winnerId, win.winnerId);
        for (const socket of sockets.slice(0, 5)) socket.send(JSON.stringify({ action: 'ready' }));
        await waitFor(() => messages.every(inbox => inbox.filter(message => message.action === 'start').length === 2));
        const nextRound = messages[0].filter(message => message.action === 'start').at(-1);
        assert.equal(nextRound.players[nextRound.turn].name, win.winner);
        assert.equal(nextRound.hand.length, 7);
    } finally {
        for (const socket of sockets) socket.close();
        server.kill();
        rmSync(auditDir, { recursive: true, force: true });
    }
});
