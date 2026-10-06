import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import WebSocket from 'ws';

const port = 18089;
const url = `ws://127.0.0.1:${port}`;

async function waitFor(predicate) {
    const until = Date.now() + 3000;
    while (!predicate()) {
        if (Date.now() > until) throw new Error('Timed out waiting for matchmaking');
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}

test('four queued players start together; cancelled players are not matched', async () => {
    const server = spawn(process.execPath, ['server.js'], {
        cwd: new URL('..', import.meta.url), env: { ...process.env, WS_PORT: String(port) }
    });
    const sockets = [];
    const inboxes = [];
    try {
        await new Promise((resolve, reject) => {
            server.stdout.on('data', chunk => { if (chunk.toString().includes('Server started')) resolve(); });
            server.once('error', reject);
            server.once('exit', code => reject(new Error(`Server exited: ${code}`)));
        });
        for (let i = 0; i < 5; i++) {
            const socket = new WebSocket(url);
            sockets.push(socket);
            inboxes[i] = [];
            socket.on('message', raw => inboxes[i].push(JSON.parse(raw.toString())));
            await once(socket, 'open');
            socket.send(JSON.stringify({ action: 'matchmake', name: `Player${i}` }));
            if (i === 0) {
                await waitFor(() => inboxes[0].some(message => message.action === 'queue'));
                socket.send(JSON.stringify({ action: 'cancel_matchmaking' }));
                await waitFor(() => inboxes[0].some(message => message.action === 'queue_cancelled'));
            }
        }
        await waitFor(() => inboxes.slice(1).every(inbox => inbox.some(message => message.action === 'start')));
        assert.equal(inboxes[0].some(message => message.action === 'start'), false);
        const starts = inboxes.slice(1).map(inbox => inbox.find(message => message.action === 'start'));
        assert.equal(new Set(starts.map(message => message.id)).size, 4);
        assert.equal(starts[0].players.length, 4);
        assert.equal(new Set(inboxes.slice(1).map(inbox => inbox.find(message => message.action === 'joined').lobbyId)).size, 1);
        assert.ok(starts.every(message => message.hand.length === 7));
    } finally {
        for (const socket of sockets) socket.close();
        server.kill();
    }
});
