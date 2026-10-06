import { WebSocketServer } from 'ws';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { appendFileSync, mkdirSync, readFile } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { cleanAvatar, randomAvatar } from './avatar.js';
import { verifyMessage } from 'ethers';
import { createRecordStore } from './records.js';
import { createCosmeticStore } from './cosmetics-store.js';
import { cosmeticCatalog } from './cosmetics-catalog.js';
import { createChainRecorder } from './chain-recorder.js';

const reconnectGraceMs = Number(process.env.RECONNECT_GRACE_MS || 45000);
const turnTimeoutMs = Number(process.env.TURN_TIMEOUT_MS || 60000);
const wsPort = Number(process.env.PORT || process.env.WS_PORT || 8080);
const staticRoot = resolve('dist');
const contentTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const httpServer = createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { response.writeHead(400).end(); return; }
    const file = resolve(staticRoot, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(`${staticRoot}${sep}`)) { response.writeHead(403).end(); return; }
    readFile(file, (error, data) => {
        if (error) { response.writeHead(404).end(); return; }
        const extension = file.slice(file.lastIndexOf('.'));
        response.writeHead(200, { 'Content-Type': contentTypes[extension] || 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff' });
        response.end(request.method === 'HEAD' ? undefined : data);
    });
});
const wss = new WebSocketServer({ server: httpServer, maxPayload: 16 * 1024 });

const clients = new Map();
const lobbies = new Map(); // Map of lobbyId -> lobby object
const matchmakingQueue = [];
const recordStore = createRecordStore(process.env.GAME_DATA_DIR || join(homedir(), '.color-clash'));
const cosmeticStore = createCosmeticStore(process.env.GAME_DATA_DIR || join(homedir(), '.color-clash'), recordStore);
const chainRecorder = createChainRecorder({
    privateKey: process.env.CHAIN_RECORDER_PRIVATE_KEY,
    contractAddress: process.env.RESULTS_CONTRACT_ADDRESS,
    rpcUrl: process.env.RPC_URL
});
let chainQueue = Promise.resolve();

function queueChainRecord(game) {
    if (!chainRecorder) return;
    chainQueue = chainQueue.then(async () => {
        const txHash = await chainRecorder(game);
        recordStore.markChainRecorded(game.gameId, txHash);
        broadcastToLobby(game.lobbyId, { action: 'chain_recorded', gameId: game.gameId, txHash });
        for (const client of clients.keys()) {
            const metadata = clients.get(client);
            if (metadata.walletAddress) sendProfile(client, metadata.walletAddress);
        }
    }).catch(error => {
        console.error(`Could not record game ${game.gameId} on-chain:`, error);
        broadcastToLobby(game.lobbyId, { action: 'chain_record_failed', gameId: game.gameId });
    });
}

function sendProfile(ws, walletAddress) {
    if (ws.readyState !== 1) return;
    ws.send(JSON.stringify({ action: 'profile', history: recordStore.history(walletAddress), leaderboard: recordStore.leaderboard(), cosmetics: cosmeticStore.profile(walletAddress) }));
}

function updateQueue() {
    matchmakingQueue.forEach((client, index) => {
        if (client.readyState === 1) client.send(JSON.stringify({ action: 'queue', waiting: Math.min(matchmakingQueue.length, 4), position: index + 1 }));
    });
}

function removeFromQueue(ws) {
    const index = matchmakingQueue.indexOf(ws);
    if (index !== -1) matchmakingQueue.splice(index, 1);
    updateQueue();
}

function addPlayer(lobby, ws, metadata, request, ready = false) {
    metadata.name = request.name;
    metadata.lobbyId = lobby.id;
    metadata.walletAddress = request.walletAddress || null;
    const cosmetics = request.walletAddress ? cosmeticStore.profile(request.walletAddress) : null;
    const outfit = cosmeticCatalog.find(item => item.id === cosmetics?.equippedOutfit && item.type === 'outfit');
    const player = {
        id: metadata.id, name: request.name, walletAddress: request.walletAddress || null,
        avatar: cleanAvatar({ ...request.avatar, ...outfit?.avatar }), cardBack: cosmetics?.equippedBack || 'classic', ready, isCreator: lobby.players.length === 0,
        connected: true, socket: ws, resumeToken: randomUUID(), drawnCardIndex: null
    };
    lobby.players.push(player);
    ws.send(JSON.stringify({ action: 'joined', lobbyId: lobby.id, resumeToken: player.resumeToken }));
}

function validWalletClaim(metadata, request) {
    if (!request.walletAddress) return !request.walletSignature;
    if (!/^0x[0-9a-fA-F]{40}$/.test(request.walletAddress) || typeof request.walletSignature !== 'string') return false;
    try {
        return verifyMessage(metadata.walletChallenge, request.walletSignature).toLowerCase() === request.walletAddress.toLowerCase();
    } catch {
        return false;
    }
}

function startMatchedGame() {
    for (const ws of [...matchmakingQueue]) {
        if (ws.readyState !== 1) removeFromQueue(ws);
    }
    if (matchmakingQueue.length < 4) return;
    const group = matchmakingQueue.splice(0, 4);
    const lobby = findOrCreateLobby(generateLobbyId());
    lobby.game.ranked = true;
    for (const ws of group) {
        const metadata = clients.get(ws);
        addPlayer(lobby, ws, metadata, metadata.queuedRequest, true);
        delete metadata.queuedRequest;
    }
    updateQueue();
    broadcastPlayers(lobby.id);
    startGame(lobby.id);
}

function createLobby(lobbyId) {
    return {
        id: lobbyId,
        players: [],
        game: {
            deck: [],
            discardPile: [],
            turn: 0,
            direction: 1,
            started: false,
            solo: false,
            ranked: false,
            interrupted: false,
            botTimer: null,
            turnTimer: null,
            unoPending: null,
            pendingWild4: null,
            audit: null,
            scores: {}
        }
    };
}

function findOrCreateLobby(lobbyId) {
    if (!lobbies.has(lobbyId)) {
        lobbies.set(lobbyId, createLobby(lobbyId));
    }
    return lobbies.get(lobbyId);
}

function generateLobbyId() {
    let id;
    do { id = randomBytes(3).toString('hex').toUpperCase(); } while (lobbies.has(id));
    return id;
}

function broadcastToLobby(lobbyId, message, excludeClientId = null) {
    [...clients.keys()].forEach((client) => {
        const metadata = clients.get(client);
        if (metadata.lobbyId === lobbyId && metadata.id !== excludeClientId && client.readyState === 1) {
            client.send(JSON.stringify(message));
        }
    });
}

function broadcastPlayers(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    
    const message = {
        action: 'players',
        players: publicPlayers(lobby.players, lobby.game.scores),
        turn: lobby.game.turn,
        lobbyId: lobbyId
    };
    broadcastToLobby(lobbyId, message);
}

function publicPlayers(players, scores = {}) {
    return players.map(({ id, name, ready, isCreator, hand, uno, predeclaredUno, walletAddress, isBot, avatar, cardBack, connected }) => ({
        id, name, ready, isCreator, cardCount: hand?.length, uno, predeclaredUno, walletAddress, isBot, avatar, cardBack: cardBack || 'classic', connected,
        score: scores[id] || 0
    }));
}

function checkStartGame(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (lobby.players.length > 1 && lobby.players.every(p => p.ready && p.connected !== false)) {
        startGame(lobbyId);
    }
}

function createDeck(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    
    const colors = ['red', 'yellow', 'green', 'blue'];
    const types = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
    const wildTypes = ['wild', 'wild4'];

    for (const color of colors) {
        for (const type of types) {
            lobby.game.deck.push({ color, type });
            if (type !== '0') {
                lobby.game.deck.push({ color, type });
            }
        }
    }

    for (let i = 0; i < 4; i++) {
        for (const type of wildTypes) {
            lobby.game.deck.push({ type });
        }
    }
}

function shuffleDeck(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    
    for (let i = lobby.game.deck.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [lobby.game.deck[i], lobby.game.deck[j]] = [lobby.game.deck[j], lobby.game.deck[i]];
    }
}

function dealCards(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    
    for (const player of lobby.players) {
        player.hand = lobby.game.deck.splice(0, 7);
        player.uno = false;
        player.predeclaredUno = false;
        player.drawnCardIndex = null;
    }
}

function startGame(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    
    lobby.game.started = true;
    lobby.game.unoPending = null;
    lobby.game.unoAnnouncement = null;
    lobby.game.pendingWild4 = null;
    lobby.game.interrupted = false;
    lobby.game.turn = lobby.game.dealer ?? 0;
    lobby.game.direction = 1;
    lobby.game.lastAction = null;
    lobby.game.deck = [];
    lobby.game.discardPile = [];
    lobby.game.id = uuidv4();
    createDeck(lobbyId);
    shuffleDeck(lobbyId);
    lobby.game.audit = {
        gameId: lobby.game.id, lobbyId, startedAt: new Date().toISOString(),
        players: lobby.players.map(({ id, name, walletAddress }) => ({ id, name, walletAddress })),
        deckOrder: lobby.game.deck.map(card => ({ ...card })), events: []
    };
    dealCards(lobbyId);

    // Start from a number card; action cards have no opening effect.
    const firstCardIndex = lobby.game.deck.findIndex(card => /^\d$/.test(card.type));
    lobby.game.discardPile.push(lobby.game.deck.splice(firstCardIndex, 1)[0]);
    scheduleTurnTimeout(lobbyId);

    [...clients.keys()].forEach((client) => {
        const metadata = clients.get(client);
        if (metadata.lobbyId === lobbyId) {
            const player = lobby.players.find(p => p.id === metadata.id);
            if (!player) return;
            const message = {
                action: 'start',
                players: publicPlayers(lobby.players, lobby.game.scores),
                discardPile: lobby.game.discardPile,
                turn: lobby.game.turn,
                direction: lobby.game.direction,
                turnEndsAt: lobby.game.turnEndsAt,
                lastAction: lobby.game.lastAction,
                hand: player.hand,
                id: metadata.id,
                drawnCardIndex: null,
                unoPending: null,
                unoAnnouncement: null,
                pendingWild4: null
            };
            client.send(JSON.stringify(message));
        }
    });
    scheduleBotTurn(lobbyId);
}

function broadcastWin(lobbyId, winnerId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    const winnerName = lobby.players.find(player => player.id === winnerId)?.name;
    if (!winnerName) return;
    const roundScores = Object.fromEntries(lobby.players.map(player => [player.id,
        player.id === winnerId ? 0 : -(player.hand || []).reduce((sum, card) => sum + cardValue(card), 0)]));
    if (!lobby.game.interrupted) {
        for (const player of lobby.players) {
            lobby.game.scores[player.id] = (lobby.game.scores[player.id] || 0) + roundScores[player.id];
        }
    }
    const message = {
        action: 'win',
        winner: winnerName,
        winnerId,
        interrupted: lobby.game.interrupted,
        gameId: lobby.game.id,
        players: publicPlayers(lobby.players, lobby.game.scores),
        roundScores,
        scores: lobby.game.scores,
        ranked: lobby.game.ranked,
        autoChain: Boolean(chainRecorder && lobby.game.ranked)
    };
    if (!lobby.game.interrupted) {
        try {
            recordStore.add({ ...message, chainEligible: Boolean(chainRecorder && lobby.game.ranked) });
            if (lobby.game.ranked) queueChainRecord({ ...message, lobbyId });
        } catch (error) {
            console.error('Could not save wallet match record:', error);
        }
    }
    if (lobby.game.audit) {
        lobby.game.audit.events.push({ at: new Date().toISOString(), action: 'end', winnerId, interrupted: lobby.game.interrupted, roundScores });
        if (process.env.MATCH_LOG_PATH) {
            try {
                mkdirSync(dirname(process.env.MATCH_LOG_PATH), { recursive: true });
                appendFileSync(process.env.MATCH_LOG_PATH, `${JSON.stringify(lobby.game.audit)}\n`, { mode: 0o600 });
            } catch (error) {
                console.error('Could not save match audit:', error);
            }
        }
        lobby.game.audit = null;
    }
    broadcastToLobby(lobbyId, message);
    for (const client of clients.keys()) {
        const metadata = clients.get(client);
        if (metadata.walletAddress) sendProfile(client, metadata.walletAddress);
    }
    const winnerIndex = lobby.players.findIndex(player => player.id === winnerId);
    lobby.game.dealer = Math.max(0, winnerIndex);
    for (const player of lobby.players) {
        player.ready = Boolean(player.isBot);
        player.drawnCardIndex = null;
    }
    lobby.game.deck = [];
    lobby.game.discardPile = [];
    lobby.game.turn = lobby.game.dealer;
    lobby.game.direction = 1;
    lobby.game.started = false;
    lobby.game.id = null;
    lobby.game.pendingWild4 = null;
    clearTimeout(lobby.game.botTimer);
    lobby.game.botTimer = null;
    clearTimeout(lobby.game.turnTimer);
    lobby.game.turnTimer = null;
    broadcastPlayers(lobbyId);
}

function removePlayer(lobbyId, playerId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    const index = lobby.players.findIndex(player => player.id === playerId);
    if (index < 0) return;
    clearTimeout(lobby.players[index].disconnectTimer);
    const oldTurn = lobby.game.turn;
    lobby.game.audit?.events.push({ at: new Date().toISOString(), action: 'remove_player', playerId });
    lobby.players.splice(index, 1);
    if (!lobby.players.length) { lobbies.delete(lobbyId); return; }
    if (lobby.game.started) {
        lobby.game.interrupted = true;
        lobby.game.pendingWild4 = null;
        if (lobby.players.length === 1) {
            broadcastWin(lobbyId, lobby.players[0].id);
            return;
        }
        if (index < oldTurn) lobby.game.turn = oldTurn - 1;
        else if (index === oldTurn) {
            lobby.game.turn = lobby.game.direction === 1
                ? index % lobby.players.length
                : (index - 1 + lobby.players.length) % lobby.players.length;
        }
        broadcastGameUpdate(lobbyId);
    } else {
        if (index < (lobby.game.dealer ?? 0)) lobby.game.dealer--;
        else if (index === lobby.game.dealer) lobby.game.dealer = 0;
        if (!lobby.players.some(player => player.isCreator)) lobby.players[0].isCreator = true;
        broadcastPlayers(lobbyId);
    }
}

function scheduleBotTurn(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby?.game.started || lobby.game.botTimer || !lobby.players[lobby.game.turn]?.isBot) return;
    lobby.game.botTimer = setTimeout(() => {
        lobby.game.botTimer = null;
        if (!lobby.game.started) return;
        const bot = lobby.players[lobby.game.turn];
        if (!bot?.isBot) return;
        if (lobby.game.pendingWild4) {
            resolveWild4(lobbyId, bot.id, false);
            return;
        }
        const topColor = lobby.game.discardPile.at(-1).color;
        const canPlay = (candidate, index) => isValidMove(lobbyId, candidate) &&
            (candidate.type !== 'wild4' || !bot.hand.some((other, i) => i !== index && other.color === topColor));
        const card = bot.drawnCardIndex === null
            ? bot.hand.find(canPlay)
            : (canPlay(bot.hand[bot.drawnCardIndex], bot.drawnCardIndex) ? bot.hand[bot.drawnCardIndex] : null);
        if (card) {
            const played = card.type === 'wild' || card.type === 'wild4'
                ? { ...card, color: bot.hand.find(other => other.color)?.color || 'red' }
                : card;
            handlePlay(lobbyId, bot.id, played);
        } else {
            if (bot.drawnCardIndex === null) handleDraw(lobbyId, bot.id);
            else handlePass(lobbyId, bot.id);
        }
    }, 500);
}

function scheduleTurnTimeout(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby?.game.started) return;
    clearTimeout(lobby.game.turnTimer);
    lobby.game.turnEndsAt = Date.now() + turnTimeoutMs;
    lobby.game.turnTimer = setTimeout(() => {
        const current = lobby.players[lobby.game.turn];
        if (!lobby.game.started || !current || current.connected === false || current.isBot) return;
        lobby.game.audit?.events.push({ at: new Date().toISOString(), action: 'turn_timeout', playerId: current.id });
        if (lobby.game.pendingWild4) resolveWild4(lobbyId, current.id, false);
        else if (current.drawnCardIndex !== null) handlePass(lobbyId, current.id);
        else handleDraw(lobbyId, current.id);
    }, turnTimeoutMs);
}

function cardValue(card) {
    if (/^\d$/.test(card.type)) return Number(card.type);
    return card.type === 'wild' || card.type === 'wild4' ? 50 : 20;
}

function drawCards(lobby, player, amount) {
    const drawn = [];
    for (let i = 0; i < amount; i++) {
        if (!lobby.game.deck.length && lobby.game.discardPile.length > 1) {
            const top = lobby.game.discardPile.pop();
            lobby.game.deck = lobby.game.discardPile.splice(0).map(card =>
                card.type === 'wild' || card.type === 'wild4' ? { type: card.type } : card);
            for (let j = lobby.game.deck.length - 1; j > 0; j--) {
                const k = randomInt(j + 1);
                [lobby.game.deck[j], lobby.game.deck[k]] = [lobby.game.deck[k], lobby.game.deck[j]];
            }
            lobby.game.discardPile.push(top);
        }
        const card = lobby.game.deck.pop();
        if (!card) break;
        player.hand.push(card);
        drawn.push(card);
    }
    if (drawn.length) lobby.game.audit?.events.push({ at: new Date().toISOString(), action: 'draw_cards', playerId: player.id, cards: drawn });
    return drawn;
}

function nextTurn(lobby, steps = 1) {
    lobby.game.turn = (lobby.game.turn + steps * lobby.game.direction +
        lobby.players.length * (steps + 1)) % lobby.players.length;
}

function isValidMove(lobbyId, card) {
    const top = lobbies.get(lobbyId)?.game.discardPile.at(-1);
    if (!top || !card || typeof card !== 'object') return false;
    return card.type === 'wild' || card.type === 'wild4' ||
        card.color === top.color || card.type === top.type;
}

function handlePlay(lobbyId, playerId, card) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby?.game.started || !card || typeof card !== 'object') return;
    const playerIndex = lobby.players.findIndex(p => p.id === playerId);
    if (playerIndex !== lobby.game.turn) return;
    const player = lobby.players[playerIndex];
    if (player.connected === false || lobby.game.pendingWild4 || !isValidMove(lobbyId, card)) return;
    const wild = card.type === 'wild' || card.type === 'wild4';
    if (wild && !['red', 'yellow', 'green', 'blue'].includes(card.color)) return;
    const cardIndex = player.drawnCardIndex ?? player.hand.findIndex(held =>
        held.type === card.type && (wild || held.color === card.color));
    const held = player.hand[cardIndex];
    if (!held || held.type !== card.type || (!wild && held.color !== card.color)) return;
    const topColor = lobby.game.discardPile.at(-1).color;
    const illegalWild4 = card.type === 'wild4' && player.hand.some((other, i) => i !== cardIndex && other.color === topColor);
    lobby.game.unoPending = null;
    player.hand.splice(cardIndex, 1);
    lobby.game.audit?.events.push({ at: new Date().toISOString(), action: 'play', playerId, card: wild ? { type: card.type, color: card.color } : held, illegalWild4 });
    player.drawnCardIndex = null;
    lobby.game.discardPile.push(wild ? { type: card.type, color: card.color } : held);
    lobby.game.lastAction = { kind: 'play', playerId, card: lobby.game.discardPile.at(-1) };
    if (player.hand.length === 1) {
        player.uno = Boolean(player.isBot || player.predeclaredUno);
        lobby.game.unoPending = player.uno ? null : player.id;
        if (player.isBot) lobby.game.unoAnnouncement = { id: uuidv4(), playerId };
    } else {
        player.uno = false;
    }
    player.predeclaredUno = false;
    if (card.type === 'reverse') {
        lobby.game.direction *= -1;
        nextTurn(lobby);
    } else if (card.type === 'skip') {
        nextTurn(lobby, 2);
    } else if (card.type === 'wild4') {
        const nextIndex = (lobby.game.turn + lobby.game.direction + lobby.players.length) % lobby.players.length;
        lobby.game.pendingWild4 = { playerId, targetId: lobby.players[nextIndex].id, illegal: illegalWild4 };
        lobby.game.turn = nextIndex;
    } else if (card.type === 'draw2') {
        const nextIndex = (lobby.game.turn + lobby.game.direction + lobby.players.length) % lobby.players.length;
        drawCards(lobby, lobby.players[nextIndex], 2);
        lobby.players[nextIndex].uno = false;
        lobby.players[nextIndex].drawnCardIndex = null;
        nextTurn(lobby, 2);
    } else {
        nextTurn(lobby);
    }
    broadcastGameUpdate(lobbyId);
    if (player.hand.length === 0 && !lobby.game.pendingWild4) broadcastWin(lobbyId, player.id);
}

function resolveWild4(lobbyId, playerId, challenge) {
    const lobby = lobbies.get(lobbyId);
    const pending = lobby?.game.pendingWild4;
    if (!pending || pending.targetId !== playerId || lobby.players[lobby.game.turn]?.id !== playerId) return;
    const offender = lobby.players.find(player => player.id === pending.playerId);
    const target = lobby.players.find(player => player.id === pending.targetId);
    if (!offender || !target) return;
    lobby.game.audit?.events.push({ at: new Date().toISOString(), action: challenge ? 'challenge_wild4' : 'accept_wild4', playerId, illegal: pending.illegal });
    if (challenge && pending.illegal) {
        drawCards(lobby, offender, 4);
        offender.uno = false;
        offender.drawnCardIndex = null;
        // The challenger keeps the turn after a successful challenge.
    } else {
        drawCards(lobby, target, challenge ? 6 : 4);
        target.uno = false;
        target.drawnCardIndex = null;
        nextTurn(lobby);
    }
    lobby.game.pendingWild4 = null;
    lobby.game.lastAction = { kind: challenge ? 'challenge' : 'accept', playerId };
    broadcastGameUpdate(lobbyId);
    if (offender.hand.length === 0) broadcastWin(lobbyId, offender.id);
}

function handleDraw(lobbyId, playerId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby?.game.started || lobby.game.pendingWild4) return;
    const playerIndex = lobby.players.findIndex(p => p.id === playerId);
    if (playerIndex !== lobby.game.turn) return;
    const player = lobby.players[playerIndex];
    if (player.drawnCardIndex !== null || player.connected === false) return;
    lobby.game.unoPending = null;
    const [card] = drawCards(lobby, player, 1);
    lobby.game.lastAction = { kind: 'draw', playerId };
    player.uno = false;
    player.predeclaredUno = false;
    if (card && isValidMove(lobbyId, card) &&
        !(card.type === 'wild4' && player.hand.slice(0, -1).some(other => other.color === lobby.game.discardPile.at(-1).color))) {
        player.drawnCardIndex = player.hand.length - 1;
    } else {
        nextTurn(lobby);
    }
    broadcastGameUpdate(lobbyId);
}

function handlePass(lobbyId, playerId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby?.game.started || lobby.game.pendingWild4) return;
    const playerIndex = lobby.players.findIndex(p => p.id === playerId);
    if (playerIndex !== lobby.game.turn || lobby.players[playerIndex].drawnCardIndex === null) return;
    lobby.game.audit?.events.push({ at: new Date().toISOString(), action: 'pass', playerId });
    lobby.game.lastAction = { kind: 'pass', playerId };
    lobby.players[playerIndex].drawnCardIndex = null;
    nextTurn(lobby);
    broadcastGameUpdate(lobbyId);
}

function handleUno(lobbyId, playerId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby?.game.started) return;
    const player = lobby.players.find(p => p.id === playerId);
    if (!player) return;
    lobby.game.audit?.events.push({ at: new Date().toISOString(), action: 'uno', playerId });
    if (player.hand.length === 2 && lobby.players[lobby.game.turn] === player) {
        if (!player.predeclaredUno) {
            player.predeclaredUno = true;
            lobby.game.unoAnnouncement = { id: uuidv4(), playerId };
        }
    } else if (player.hand.length === 1) {
        if (!player.uno) lobby.game.unoAnnouncement = { id: uuidv4(), playerId };
        player.uno = true;
        if (lobby.game.unoPending === player.id) lobby.game.unoPending = null;
    } else {
        drawCards(lobby, player, 2);
        player.uno = false;
        player.predeclaredUno = false;
    }
    broadcastGameUpdate(lobbyId);
}

function handleCatchUno(lobbyId, playerId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby?.game.started || !lobby.game.unoPending || lobby.game.unoPending === playerId) return;
    const target = lobby.players.find(p => p.id === lobby.game.unoPending);
    if (!target || target.uno || target.hand.length !== 1) return;
    lobby.game.audit?.events.push({ at: new Date().toISOString(), action: 'catch_uno', playerId, targetId: target.id });
    drawCards(lobby, target, 2);
    target.uno = false;
    lobby.game.unoPending = null;
    broadcastGameUpdate(lobbyId);
}

function broadcastGameUpdate(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    scheduleTurnTimeout(lobbyId);
    
    [...clients.keys()].forEach((client) => {
        const metadata = clients.get(client);
        if (metadata.lobbyId === lobbyId) {
            const player = lobby.players.find(p => p.id === metadata.id);
            if (!player) return;
            const message = {
                action: 'update',
                players: publicPlayers(lobby.players, lobby.game.scores),
                discardPile: lobby.game.discardPile,
                turn: lobby.game.turn,
                direction: lobby.game.direction,
                turnEndsAt: lobby.game.turnEndsAt,
                lastAction: lobby.game.lastAction,
                hand: player.hand,
                drawnCardIndex: player.drawnCardIndex,
                unoPending: lobby.game.unoPending,
                unoAnnouncement: lobby.game.unoAnnouncement,
                pendingWild4: lobby.game.pendingWild4 ? { targetId: lobby.game.pendingWild4.targetId } : null
            };
            client.send(JSON.stringify(message));
        }
    });
    scheduleBotTurn(lobbyId);
}

function uuidv4() {
    return randomUUID();
}

wss.on('connection', (ws) => {
    const id = uuidv4();
    const metadata = { id, walletChallenge: `Color Clash wallet login\n${uuidv4()}`,
        messageWindowStart: Date.now(), messageCount: 0 };
    clients.set(ws, metadata);
    ws.send(JSON.stringify({ action: 'wallet_challenge', challenge: metadata.walletChallenge }));
    ws.send(JSON.stringify({ action: 'leaderboard', leaderboard: recordStore.leaderboard() }));

    console.log('Client connected');

    ws.on('message', (messageAsString) => {
        const clientMetadata = clients.get(ws);
        if (!clientMetadata) return;
        const now = Date.now();
        if (now - clientMetadata.messageWindowStart > 10000) {
            clientMetadata.messageWindowStart = now;
            clientMetadata.messageCount = 0;
        }
        if (++clientMetadata.messageCount > 100) {
            ws.close(1008, 'Too many messages');
            return;
        }
        let message;
        try { message = JSON.parse(messageAsString); }
        catch { ws.send(JSON.stringify({ action: 'error', message: 'Invalid game message.' })); return; }
        if (!message || typeof message !== 'object') return;
        const metadata = clients.get(ws);
        if (!metadata) return;

        if (message.action === 'resume') {
            const lobby = lobbies.get(message.lobbyId);
            const player = lobby?.players.find(p => p.resumeToken === message.resumeToken && !p.isBot);
            if (!player || lobby.game.solo) {
                ws.send(JSON.stringify({ action: 'resume_failed' }));
                return;
            }
            clearTimeout(player.disconnectTimer);
            if (player.socket && player.socket !== ws) {
                clients.delete(player.socket);
                player.socket.close(1000);
            }
            player.socket = ws;
            player.connected = true;
            metadata.id = player.id;
            metadata.name = player.name;
            metadata.lobbyId = lobby.id;
            metadata.walletAddress = player.walletAddress;
            ws.send(JSON.stringify({ action: 'joined', lobbyId: lobby.id, resumeToken: player.resumeToken }));
            if (lobby.game.started) {
                ws.send(JSON.stringify({ action: 'start', id: player.id,
                    players: publicPlayers(lobby.players, lobby.game.scores),
                    discardPile: lobby.game.discardPile, turn: lobby.game.turn, hand: player.hand,
                    direction: lobby.game.direction, turnEndsAt: lobby.game.turnEndsAt,
                    lastAction: lobby.game.lastAction,
                    drawnCardIndex: player.drawnCardIndex, unoPending: lobby.game.unoPending,
                    unoAnnouncement: lobby.game.unoAnnouncement,
                    pendingWild4: lobby.game.pendingWild4 ? { targetId: lobby.game.pendingWild4.targetId } : null }));
            }
            broadcastPlayers(lobby.id);
            if (metadata.walletAddress) sendProfile(ws, metadata.walletAddress);
            return;
        }

        if (message.action === 'profile') {
            if (!validWalletClaim(metadata, message)) return;
            metadata.walletAddress = message.walletAddress;
            sendProfile(ws, metadata.walletAddress);
            return;
        }

        if (message.action === 'cosmetic') {
            if (!metadata.walletAddress) return;
            const result = cosmeticStore.change(metadata.walletAddress, message.kind, message.itemId);
            if (result.error) ws.send(JSON.stringify({ action: 'cosmetic_error', message: result.error }));
            else sendProfile(ws, metadata.walletAddress);
            return;
        }

        if (message.action === 'matchmake') {
            if (metadata.lobbyId || matchmakingQueue.includes(ws)) return;
            if (typeof message.name !== 'string' || message.name.length < 2 || message.name.length > 20 ||
                !validWalletClaim(metadata, message)) {
                ws.send(JSON.stringify({ action: 'error', message: 'Enter a valid name and wallet address.' }));
                return;
            }
            metadata.queuedRequest = message;
            matchmakingQueue.push(ws);
            updateQueue();
            startMatchedGame();
            return;
        }

        if (message.action === 'cancel_matchmaking') {
            removeFromQueue(ws);
            delete metadata.queuedRequest;
            ws.send(JSON.stringify({ action: 'queue_cancelled' }));
            return;
        }

        if (message.action === 'join') {
            if (metadata.lobbyId || matchmakingQueue.includes(ws)) return;
            if (message.lobbyId && (typeof message.lobbyId !== 'string' || !/^[A-Z0-9]{3,12}$/.test(message.lobbyId))) {
                ws.send(JSON.stringify({ action: 'error', message: 'Enter a valid room code.' }));
                return;
            }
            if (typeof message.name !== 'string' || message.name.length < 2 || message.name.length > 20 ||
                !validWalletClaim(metadata, message)) {
                ws.send(JSON.stringify({ action: 'error', message: 'Enter a valid name and wallet address.' }));
                return;
            }
            const lobbyId = message.solo ? generateLobbyId() : message.lobbyId || generateLobbyId();
            const lobby = findOrCreateLobby(lobbyId);
            if (lobby.game.started || lobby.players.length >= 10) {
                ws.send(JSON.stringify({ action: 'error', message: 'This room is already playing or full (10 players maximum).' }));
                return;
            }
            if (message.walletAddress && lobby.players.some(p => p.walletAddress?.toLowerCase() === message.walletAddress.toLowerCase())) {
                ws.send(JSON.stringify({ action: 'error', message: 'This wallet is already in the room.' }));
                return;
            }
            
            // Check if name already exists in this lobby
            const existingPlayer = lobby.players.find(p => p.name.toLowerCase() === message.name.toLowerCase());
            if (existingPlayer) {
                // Send error message back to client
                ws.send(JSON.stringify({
                    action: 'error',
                    message: 'A player with that name already exists in this lobby. Please choose a different name.'
                }));
                return;
            }
            
            addPlayer(lobby, ws, metadata, message);
            broadcastPlayers(metadata.lobbyId);
            if (message.solo) {
                lobby.game.solo = true;
                lobby.players[0].ready = true;
                for (let i = 1; i <= 3; i++) {
                    lobby.players.push({ id: `bot-${i}`, name: `Bot ${i}`, ready: true,
                        isCreator: false, isBot: true, connected: true, walletAddress: null, avatar: randomAvatar() });
                }
                startGame(metadata.lobbyId);
            }
        }

        if (message.action === 'ready') {
            if (!metadata.lobbyId) return;
            const lobby = findOrCreateLobby(metadata.lobbyId);
            const player = lobby.players.find(p => p.id === metadata.id);
            if (!player || lobby.game.started) return;
            player.ready = !player.ready;
            broadcastPlayers(metadata.lobbyId);
            checkStartGame(metadata.lobbyId);
        }

        if (message.action === 'play') {
            handlePlay(metadata.lobbyId, metadata.id, message.card);
        }

        if (message.action === 'draw') {
            handleDraw(metadata.lobbyId, metadata.id);
        }

        if (message.action === 'pass') {
            handlePass(metadata.lobbyId, metadata.id);
        }

        if (message.action === 'uno') {
            handleUno(metadata.lobbyId, metadata.id);
        }



        if (message.action === 'catch_uno') {
            handleCatchUno(metadata.lobbyId, metadata.id);
        }
        if (message.action === 'accept_wild4' || message.action === 'challenge_wild4') {
            resolveWild4(metadata.lobbyId, metadata.id, message.action === 'challenge_wild4');
        }
        
        if (message.action === 'leave') {
            const oldLobbyId = metadata.lobbyId;
            metadata.lobbyId = null;
            handleLeave(oldLobbyId, metadata.id);
        }
    });

    ws.on('close', () => {
        const metadata = clients.get(ws);
        removeFromQueue(ws);
        if (!metadata?.lobbyId) {
            clients.delete(ws);
            return;
        }
        const lobby = lobbies.get(metadata.lobbyId);
        if (!lobby) {
            clients.delete(ws);
            return;
        }
        if (lobby.game.solo) {
            clearTimeout(lobby.game.botTimer);
            clearTimeout(lobby.game.turnTimer);
            lobbies.delete(metadata.lobbyId);
            clients.delete(ws);
            return;
        }
        const player = lobby.players.find(p => p.id === metadata.id);
        if (player?.socket === ws) {
            player.connected = false;
            player.socket = null;
            player.disconnectTimer = setTimeout(() => removePlayer(metadata.lobbyId, metadata.id), reconnectGraceMs);
            broadcastPlayers(metadata.lobbyId);
        }
        clients.delete(ws);
        console.log('Client disconnected');
    });
});

function handleLeave(lobbyId, playerId) {
    removePlayer(lobbyId, playerId);
}

httpServer.listen(wsPort, () => console.log(`Server started on port ${wsPort}`));
if (chainRecorder) for (const game of recordStore.pendingChain()) queueChainRecord(game);
