import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import WebSocket from 'ws';

test('an idle player draws automatically and the table advances', async () => {
    const port = 18090;
    const server = spawn(process.execPath, ['server.js'], {
        cwd: new URL('..', import.meta.url),
        env: { ...process.env, WS_PORT: String(port), TURN_TIMEOUT_MS: '80' }
    });
    const sockets = [];
    const inboxes = [[], []];
    try {
        await new Promise((resolve, reject) => {
            server.stdout.on('data', chunk => { if (chunk.toString().includes('Server started')) resolve(); });
            server.once('error', reject);
            server.once('exit', code => reject(new Error(`Server exited: ${code}`)));
        });
        for (let i = 0; i < 2; i++) {
            const socket = new WebSocket(`ws://127.0.0.1:${port}`);
            sockets.push(socket);
            socket.on('message', raw => inboxes[i].push(JSON.parse(raw.toString())));
            await once(socket, 'open');
            socket.send(JSON.stringify({ action: 'join', name: `Player${i}`, lobbyId: 'TIMEOUT' }));
        }
        for (const socket of sockets) socket.send(JSON.stringify({ action: 'ready' }));
        const until = Date.now() + 3000;
        while (!inboxes[0].some(message => message.action === 'update')) {
            if (Date.now() > until) throw new Error('Idle turn did not advance');
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        const started = inboxes[0].find(message => message.action === 'start');
        const updated = inboxes[0].find(message => message.action === 'update');
        assert.ok(started);
        assert.ok(updated.players[started.turn].cardCount > started.players[started.turn].cardCount);
    } finally {
        for (const socket of sockets) socket.close();
        server.kill();
    }
});
