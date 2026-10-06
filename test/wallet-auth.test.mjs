import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { Wallet } from 'ethers';
import WebSocket from 'ws';

test('a wallet address must be proved with the connection challenge', async () => {
    const port = 18091;
    const server = spawn(process.execPath, ['server.js'], {
        cwd: new URL('..', import.meta.url), env: { ...process.env, WS_PORT: String(port) }
    });
    let socket;
    try {
        await new Promise((resolve, reject) => {
            server.stdout.on('data', chunk => { if (chunk.toString().includes('Server started')) resolve(); });
            server.once('error', reject);
            server.once('exit', code => reject(new Error(`Server exited: ${code}`)));
        });
        socket = new WebSocket(`ws://127.0.0.1:${port}`);
        const inbox = [];
        socket.on('message', raw => inbox.push(JSON.parse(raw.toString())));
        await once(socket, 'open');
        const wallet = Wallet.createRandom();
        while (!inbox.some(message => message.action === 'wallet_challenge')) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        socket.send(JSON.stringify({ action: 'join', name: 'WalletPlayer', walletAddress: wallet.address }));
        while (!inbox.some(message => message.action === 'error')) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        assert.equal(inbox.some(message => message.action === 'joined'), false);
        const challenge = inbox.find(message => message.action === 'wallet_challenge').challenge;
        const walletSignature = await wallet.signMessage(challenge);
        socket.send(JSON.stringify({ action: 'join', name: 'WalletPlayer', walletAddress: wallet.address, walletSignature }));
        const until = Date.now() + 3000;
        while (!inbox.some(message => message.action === 'joined')) {
            if (Date.now() > until) throw new Error('Signed wallet join failed');
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        assert.equal(inbox.find(message => message.action === 'players')?.players[0].walletAddress, wallet.address);
    } finally {
        socket?.close();
        server.kill();
    }
});
