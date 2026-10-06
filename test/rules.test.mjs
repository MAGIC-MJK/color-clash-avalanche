import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import WebSocket from 'ws';

const port = 18082;
const url = `ws://127.0.0.1:${port}`;

async function waitFor(predicate, timeout = 3000) {
    const end = Date.now() + timeout;
    while (!predicate()) {
        if (Date.now() > end) throw new Error('Timed out waiting for rule update');
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}

test('one-card turns, numeric opening card, and draw choice follow the stated rules', async () => {
    const server = spawn(process.execPath, ['server.js'], {
        cwd: new URL('..', import.meta.url), env: { ...process.env, WS_PORT: String(port) }
    });
    const sockets = [];
    try {
        await new Promise((resolve, reject) => {
            server.stdout.on('data', chunk => { if (chunk.toString().includes('Server started')) resolve(); });
            server.once('error', reject);
            server.once('exit', code => reject(new Error(`Server exited: ${code}`)));
        });
        const inboxes = [[], []];
        for (let i = 0; i < 2; i++) {
            const socket = new WebSocket(url);
            sockets.push(socket);
            socket.on('message', raw => inboxes[i].push(JSON.parse(raw.toString())));
            await once(socket, 'open');
            socket.send(JSON.stringify({ action: 'join', name: `Player${i}`, lobbyId: 'RULES' }));
        }
        await waitFor(() => inboxes.every(inbox => inbox.some(m => m.action === 'joined')));
        for (const socket of sockets) socket.send(JSON.stringify({ action: 'ready' }));
        await waitFor(() => inboxes.every(inbox => inbox.some(m => m.action === 'start')));
        const first = inboxes[0].find(m => m.action === 'start');
        assert.match(first.discardPile.at(-1).type, /^\d$/);
        assert.equal(first.players.length, 2);
        assert.equal(first.direction, 1);
        assert.ok(first.turnEndsAt > Date.now());
        const active = first.turn;
        const before = inboxes[active].find(m => m.action === 'start');
        sockets[active].send(JSON.stringify({ action: 'play_multiple', cards: before.hand.slice(0, 2) }));
        await new Promise(resolve => setTimeout(resolve, 80));
        assert.equal(inboxes[active].filter(m => m.action === 'update').length, 0);
        sockets[active].send(JSON.stringify({ action: 'draw' }));
        await waitFor(() => inboxes[active].some(m => m.action === 'update'));
        const after = inboxes[active].find(m => m.action === 'update');
        assert.deepEqual(after.lastAction, { kind: 'draw', playerId: before.id });
        assert.ok(after.turnEndsAt > Date.now());
        assert.equal(after.hand.length, before.hand.length + 1);
        if (after.drawnCardIndex !== null) {
            assert.equal(after.turn, active);
            assert.equal(after.drawnCardIndex, after.hand.length - 1);
            sockets[active].send(JSON.stringify({ action: 'pass' }));
            await waitFor(() => inboxes[active].filter(m => m.action === 'update').length === 2);
            assert.notEqual(inboxes[active].filter(m => m.action === 'update').at(-1).turn, active);
        } else {
            assert.notEqual(after.turn, active);
        }
        const tenInboxes = [];
        for (let i = 0; i < 10; i++) {
            const socket = new WebSocket(url);
            sockets.push(socket);
            tenInboxes[i] = [];
            socket.on('message', raw => tenInboxes[i].push(JSON.parse(raw.toString())));
            await once(socket, 'open');
            socket.send(JSON.stringify({ action: 'join', name: `Ten${i}`, lobbyId: 'TEN' }));
        }
        await waitFor(() => tenInboxes.every(inbox => inbox.some(m => m.action === 'players' && m.players.length === 10)));
        for (const socket of sockets.slice(2)) socket.send(JSON.stringify({ action: 'ready' }));
        await waitFor(() => tenInboxes.every(inbox => inbox.some(m => m.action === 'start')));
        assert.equal(tenInboxes[0].find(m => m.action === 'start').hand.length, 7);
    } finally {
        for (const socket of sockets) socket.close();
        server.kill();
    }
});
