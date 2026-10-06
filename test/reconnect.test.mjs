import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import WebSocket from 'ws';

const port = 18081;
const url = `ws://127.0.0.1:${port}`;

async function waitFor(predicate, timeout = 3000) {
    const end = Date.now() + timeout;
    while (!predicate()) {
        if (Date.now() > end) throw new Error('Timed out waiting for game state');
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}

test('player resumes the same hand, then a timed-out game is marked interrupted', async () => {
    const server = spawn(process.execPath, ['server.js'], {
        cwd: new URL('..', import.meta.url),
        env: { ...process.env, WS_PORT: String(port), RECONNECT_GRACE_MS: '500' }
    });
    const sockets = [];
    try {
        await new Promise((resolve, reject) => {
            server.stdout.on('data', chunk => { if (chunk.toString().includes('Server started')) resolve(); });
            server.once('error', reject);
            server.once('exit', code => reject(new Error(`Server exited: ${code}`)));
        });
        const inboxes = [[], [], []];
        for (let i = 0; i < 2; i++) {
            const socket = new WebSocket(url);
            sockets.push(socket);
            socket.on('message', raw => inboxes[i].push(JSON.parse(raw.toString())));
            await once(socket, 'open');
            socket.send(JSON.stringify({ action: 'join', name: `Player${i}`, lobbyId: 'RESUME' }));
        }
        await waitFor(() => inboxes.slice(0, 2).every(inbox => inbox.some(m => m.action === 'joined')));
        sockets[0].send(JSON.stringify({ action: 'ready' }));
        sockets[1].send(JSON.stringify({ action: 'ready' }));
        await waitFor(() => inboxes.slice(0, 2).every(inbox => inbox.some(m => m.action === 'start')));
        const original = inboxes[0].find(m => m.action === 'start');
        const token = inboxes[0].find(m => m.action === 'joined').resumeToken;
        sockets[0].close();
        await waitFor(() => inboxes[1].some(m => m.action === 'players' && m.players[0].connected === false));
        const replacement = new WebSocket(url);
        sockets.push(replacement);
        replacement.on('message', raw => inboxes[2].push(JSON.parse(raw.toString())));
        await once(replacement, 'open');
        replacement.send(JSON.stringify({ action: 'resume', lobbyId: 'RESUME', resumeToken: token }));
        await waitFor(() => inboxes[2].some(m => m.action === 'start'));
        const resumed = inboxes[2].find(m => m.action === 'start');
        assert.equal(resumed.id, original.id);
        assert.deepEqual(resumed.hand, original.hand);
        assert.equal(resumed.turn, original.turn);
        replacement.close();
        await waitFor(() => inboxes[1].some(m => m.action === 'win'), 3000);
        assert.equal(inboxes[1].find(m => m.action === 'win').interrupted, true);
    } finally {
        for (const socket of sockets) socket.close();
        server.kill();
    }
});
