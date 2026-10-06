import { connectWallet, chainConfigured, attestResult } from './chain.js';
import { t, applyLanguage } from './i18n.js';
import { avatarFields, avatarDataUrl, avatarOptionLabel, heroPresets, loadAvatar, saveAvatar, loadHeroes, saveHeroes, randomAvatar as makeRandomAvatar } from './avatar.js';
import { addMatch, summarizeHistory } from './history.js';
import { createMusicVisualizer } from './visualizer.js';
import { cosmeticCatalog } from './cosmetics-catalog.js';

const nameInput = document.getElementById('name');
const lobbyIdInput = document.getElementById('lobby-id');
const joinButton = document.getElementById('join');
const soloButton = document.getElementById('solo');
const quickMatchButton = document.getElementById('quick-match');
const queuePanel = document.getElementById('queue-panel');
const queueStatus = document.getElementById('queue-status');
const cancelMatchButton = document.getElementById('cancel-match');
const playersList = document.getElementById('players');
const readyButton = document.getElementById('ready');
const lobbyDiv = document.getElementById('lobby');
const gameDiv = document.getElementById('game');
const opponentHandsDiv = document.getElementById('opponent-hands');
const playerHandDiv = document.getElementById('player-hand');
const discardPileDiv = document.getElementById('discard-pile');
const drawCardButton = document.getElementById('draw-card');
const passTurnButton = document.getElementById('pass-turn');
const callUnoButton = document.getElementById('call-uno');
const catchUnoButton = document.getElementById('catch-uno');
const wild4Panel = document.getElementById('wild4-panel');
const acceptWild4Button = document.getElementById('accept-wild4');
const challengeWild4Button = document.getElementById('challenge-wild4');
const scoreRows = document.getElementById('score-rows');
const gameMenuButton = document.getElementById('game-menu-button');
const gameMenuDialog = document.getElementById('game-menu-dialog');
const gameMenuActions = document.getElementById('game-menu-actions');
const gameMenuConfirm = document.getElementById('game-menu-confirm');
const gameMenuCloseButton = document.getElementById('game-menu-close');

const turnIndicator = document.getElementById('turn-indicator');
const turnText = document.getElementById('turn-text');
const turnDirectionLabel = document.getElementById('turn-direction');
const turnClock = document.getElementById('turn-clock');
const lastActionLabel = document.getElementById('last-action');
const wildColorPicker = document.getElementById('wild-color-picker');
const colorOptions = document.getElementById('color-options');
const lobbyInfo = document.getElementById('lobby-info');
const currentLobbyId = document.getElementById('current-lobby-id');
const connectWalletButton = document.getElementById('connect-wallet');
const walletStatus = document.getElementById('wallet-status');
const musicButton = document.getElementById('toggle-music');
const sfxButton = document.getElementById('toggle-sfx');
const backgroundMusic = document.getElementById('background-music');
const musicVisualizer = createMusicVisualizer(backgroundMusic, document.getElementById('music-visualizer'));
const resultPanel = document.getElementById('result-panel');
const resultTitle = document.getElementById('result-title');
const resultStatus = document.getElementById('result-status');
const confirmResultButton = document.getElementById('confirm-result');
const resultLink = document.getElementById('result-link');
const resultDismissButton = document.getElementById('result-dismiss');
const languageSelect = document.getElementById('language');
const avatarDialog = document.getElementById('avatar-editor');
const avatarFieldsDiv = document.getElementById('avatar-fields');
const avatarPreview = document.getElementById('avatar-preview');
const lobbyAvatar = document.getElementById('lobby-avatar');
const myAvatar = document.getElementById('my-avatar');
const heroNameInput = document.getElementById('hero-name');
const heroGallery = document.getElementById('hero-gallery');
const historySummary = document.getElementById('history-summary');
const historyList = document.getElementById('history-list');
const walletHistoryList = document.getElementById('wallet-history-list');
const leaderboardList = document.getElementById('leaderboard-list');
const shopDialog = document.getElementById('shop-dialog');
const shopItems = document.getElementById('shop-items');
const shopBalance = document.getElementById('shop-balance');
const shopMessage = document.getElementById('shop-message');
const myCardBack = document.getElementById('my-card-back');
const collectionCardBack = document.getElementById('collection-card-back');
const collectionBackName = document.getElementById('collection-back-name');
const collectionCoins = document.getElementById('collection-coins');

let myId;
let ws;
let currentTurn = -1;
let turnDirection = 1;
let turnEndsAt = null;
let lastAction = null;
let players = [];
let pendingWildCard = null;
let myHand = [];
let topCard = null;
let drawnCardIndex = null;
let unoPending = null;
let unoAnnouncement = null;
let pendingWild4 = null;
let myLobbyId = null;
let walletAddress = null;
let walletSignature = null;
let walletChallenge = null;
let completedGame = null;
let avatarConfig = loadAvatar();
let avatarDraft = { ...avatarConfig };
let heroes = loadHeroes();
let activeHeroId = localStorage.getItem('color-clash-active-hero');
let walletHistoryData = [];
let leaderboardData = [];
let cosmeticsState = null;
let shopFilter = 'all';
let sfxEnabled = localStorage.getItem('color-clash-sfx') !== 'off';
let sfxContext;
const sessionKey = 'color-clash-session';
const historyKey = 'color-clash-match-history';
resultDismissButton.addEventListener('click', () => {
    resultPanel.style.display = 'none';
    lobbyDiv.classList.remove('has-result');
});
function cardBackImage(id) {
    return cosmeticCatalog.find(item => item.type === 'back' && item.id === id)?.image || '/art/card-backs/classic.png';
}

function renderCollection() {
    const back = cosmeticsState?.equippedBack || 'classic';
    collectionCardBack.src = cardBackImage(back);
    collectionBackName.textContent = t(`shop_${back}`);
    collectionCoins.textContent = cosmeticsState ? t('shopBalance', cosmeticsState.coins) : t('collectionGuest');
}

function renderShop() {
    shopBalance.textContent = cosmeticsState ? t('shopBalance', cosmeticsState.coins) : t('shopGuest');
    for (const button of document.querySelectorAll('[data-shop-filter]')) button.setAttribute('aria-pressed', String(button.dataset.shopFilter === shopFilter));
    shopItems.replaceChildren();
    for (const [index, item] of cosmeticCatalog.filter(entry => shopFilter === 'all' || entry.type === shopFilter).entries()) {
        const card = document.createElement('article');
        card.className = 'shop-item';
        card.style.setProperty('--item-index', index);
        const image = document.createElement('img');
        image.src = item.image;
        image.alt = '';
        const title = document.createElement('h3');
        title.textContent = t(`shop_${item.id}`);
        const category = document.createElement('p');
        category.textContent = `${t(item.type === 'back' ? 'shopBack' : 'shopOutfit')} · ${item.price ? t('shopPrice', item.price) : t('shopFree')}${item.type === 'outfit' ? ` · ${t('shopOutfitNote')}` : ''}`;
        const button = document.createElement('button');
        const owned = item.price === 0 || cosmeticsState?.owned.includes(item.id);
        const equipped = item.type === 'back' ? (cosmeticsState?.equippedBack || 'classic') === item.id : cosmeticsState?.equippedOutfit === item.id;
        button.textContent = equipped ? t('shopEquipped') : owned ? t('shopEquip') : t('shopBuy');
        button.disabled = !cosmeticsState || equipped;
        button.addEventListener('click', () => sendMessage({ action: 'cosmetic', kind: owned ? 'equip' : 'buy', itemId: item.id }));
        card.append(image, title, category, button);
        shopItems.append(card);
    }
}
for (const button of document.querySelectorAll('[data-shop-filter]')) button.addEventListener('click', () => { shopFilter = button.dataset.shopFilter; renderShop(); });
for (const id of ['open-shop', 'home-shop', 'collection-open']) document.getElementById(id).addEventListener('click', () => { renderShop(); shopDialog.showModal(); });
document.getElementById('shop-close').addEventListener('click', () => shopDialog.close());
function closeGameMenu() {
    if (gameMenuDialog.open) gameMenuDialog.close();
}
gameMenuButton.addEventListener('click', () => gameMenuDialog.showModal());
gameMenuCloseButton.addEventListener('click', closeGameMenu);
document.getElementById('game-menu-resume').addEventListener('click', closeGameMenu);
document.getElementById('game-menu-exit').addEventListener('click', () => {
    gameMenuActions.hidden = true;
    gameMenuConfirm.hidden = false;
    document.getElementById('game-menu-cancel').focus();
});
document.getElementById('game-menu-cancel').addEventListener('click', () => {
    gameMenuConfirm.hidden = true;
    gameMenuActions.hidden = false;
    document.getElementById('game-menu-resume').focus();
});
document.getElementById('game-menu-confirm-exit').addEventListener('click', () => {
    sendMessage({ action: 'leave' });
    sessionStorage.removeItem(sessionKey);
    closeGameMenu();
    resetGameState();
});
gameMenuDialog.addEventListener('close', () => {
    gameMenuConfirm.hidden = true;
    gameMenuActions.hidden = false;
    if (gameDiv.style.display === 'block') gameMenuButton.focus();
});
backgroundMusic.volume = 0.24;
function updateMusicButton() {
    const playing = !backgroundMusic.paused;
    musicButton.textContent = t(playing ? 'musicOff' : 'musicOn');
    musicButton.setAttribute('aria-pressed', String(playing));
}
musicButton.addEventListener('click', async () => {
    if (backgroundMusic.paused) {
        try {
            await musicVisualizer.start();
            await backgroundMusic.play();
        } catch {
            musicVisualizer.stop();
            return;
        }
    } else {
        backgroundMusic.pause();
        musicVisualizer.stop();
    }
    updateMusicButton();
});
backgroundMusic.addEventListener('pause', () => { musicVisualizer.stop(); updateMusicButton(); });
function updateSfxButton() {
    sfxButton.textContent = t(sfxEnabled ? 'sfxOn' : 'sfxOff');
    sfxButton.setAttribute('aria-pressed', String(sfxEnabled));
}
sfxButton.addEventListener('click', () => {
    sfxEnabled = !sfxEnabled;
    localStorage.setItem('color-clash-sfx', sfxEnabled ? 'on' : 'off');
    updateSfxButton();
});
updateSfxButton();

function playUnoSound() {
    if (!sfxEnabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
        sfxContext ??= new AudioContextClass();
        if (sfxContext.state === 'suspended') void sfxContext.resume();
        const start = sfxContext.currentTime;
        for (const [index, frequency] of [523.25, 659.25, 783.99].entries()) {
            const oscillator = sfxContext.createOscillator();
            const volume = sfxContext.createGain();
            const at = start + index * 0.09;
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(frequency, at);
            volume.gain.setValueAtTime(0.0001, at);
            volume.gain.exponentialRampToValueAtTime(0.055, at + 0.015);
            volume.gain.exponentialRampToValueAtTime(0.0001, at + 0.24);
            oscillator.connect(volume).connect(sfxContext.destination);
            oscillator.start(at);
            oscillator.stop(at + 0.25);
        }
    } catch { /* Audio may be unavailable until the browser receives a gesture. */ }
}

function loadMatchHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem(historyKey) || '[]');
        return Array.isArray(saved) ? saved.slice(0, 100) : [];
    } catch {
        return [];
    }
}

function renderMatchHistory() {
    const history = loadMatchHistory();
    const { wins, losses, interrupted } = summarizeHistory(history);
    historySummary.textContent = t('historySummary', wins, losses, interrupted);
    historyList.replaceChildren();
    if (!history.length) {
        const empty = document.createElement('p');
        empty.textContent = t('historyEmpty');
        historyList.appendChild(empty);
        return;
    }
    for (const match of history.slice(0, 10)) {
        const row = document.createElement('div');
        row.className = `history-row ${match.outcome}`;
        const status = document.createElement('strong');
        status.textContent = t(`history${match.outcome[0].toUpperCase()}${match.outcome.slice(1)}`);
        const details = document.createElement('span');
        details.textContent = `${match.name} · ${t('historyVs', match.opponents.join(', '))}`;
        const date = document.createElement('time');
        date.dateTime = new Date(match.playedAt).toISOString();
        date.textContent = new Date(match.playedAt).toLocaleString(document.documentElement.lang);
        row.append(status, details, date);
        historyList.appendChild(row);
    }
}

function renderWalletHistory(history = []) {
    walletHistoryData = history;
    walletHistoryList.replaceChildren();
    if (!history.length) {
        walletHistoryList.textContent = t('walletHistoryEmpty');
        return;
    }
    for (const match of history.slice(0, 10)) {
        const row = document.createElement('p');
        row.textContent = `${t(match.outcome === 'win' ? 'historyWin' : 'historyLoss')} · ${t(match.ranked ? 'rankedMatch' : 'casualMatch')} · ${new Date(match.playedAt).toLocaleString(document.documentElement.lang)} · ${t('historyVs', match.opponents.join(', '))}${match.chainRecorded ? ` · ${t('recordedOnChain')}` : ''}`;
        walletHistoryList.appendChild(row);
    }
}

function renderLeaderboard(entries = []) {
    leaderboardData = entries;
    leaderboardList.replaceChildren();
    if (!entries.length) {
        leaderboardList.textContent = t('leaderboardEmpty');
        return;
    }
    for (const [index, entry] of entries.entries()) {
        const row = document.createElement('p');
        row.textContent = `${index + 1}. ${entry.name} · ${entry.walletAddress.slice(0, 6)}…${entry.walletAddress.slice(-4)} · ${t('leaderboardScore', entry.wins, entry.losses)}`;
        leaderboardList.appendChild(row);
    }
}

function renderHeroGallery() {
    heroGallery.replaceChildren();
    for (const hero of heroes) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'hero-library-item';
        button.classList.toggle('active', hero.id === activeHeroId);
        const image = document.createElement('img');
        image.src = avatarDataUrl(hero.avatar);
        image.alt = '';
        const name = document.createElement('span');
        name.textContent = hero.name;
        button.append(image, name);
        button.addEventListener('click', () => {
            activeHeroId = hero.id;
            avatarDraft = { ...hero.avatar };
            heroNameInput.value = hero.name;
            renderAvatarFields();
            renderHeroGallery();
        });
        heroGallery.appendChild(button);
    }
}

function refreshAvatarImages() {
    const outfit = cosmeticCatalog.find(item => item.id === cosmeticsState?.equippedOutfit && item.type === 'outfit');
    const image = avatarDataUrl({ ...avatarConfig, ...outfit?.avatar });
    lobbyAvatar.src = image;
    myAvatar.src = image;
    myCardBack.src = cardBackImage(cosmeticsState?.equippedBack);
}

function renderAvatarFields() {
    avatarFieldsDiv.replaceChildren();
    for (const [field, options] of Object.entries(avatarFields)) {
        const label = document.createElement('label');
        label.textContent = t(field);
        const select = document.createElement('select');
        select.name = field;
        for (const option of options) {
            const choice = document.createElement('option');
            choice.value = option;
            choice.textContent = avatarOptionLabel(option, field);
            select.appendChild(choice);
        }
        select.value = avatarDraft[field];
        select.addEventListener('change', () => {
            avatarDraft[field] = select.value;
            avatarPreview.src = avatarDataUrl(avatarDraft);
        });
        label.appendChild(select);
        avatarFieldsDiv.appendChild(label);
    }
    avatarPreview.src = avatarDataUrl(avatarDraft);
}

document.getElementById('edit-avatar').addEventListener('click', () => {
    avatarDraft = { ...avatarConfig };
    const active = heroes.find(hero => hero.id === activeHeroId);
    heroNameInput.value = active?.name || '';
    renderAvatarFields();
    renderHeroGallery();
    avatarDialog.showModal();
});
document.getElementById('avatar-close').addEventListener('click', () => avatarDialog.close());
avatarDialog.addEventListener('close', () => {
    activeHeroId = localStorage.getItem('color-clash-active-hero');
});
document.getElementById('hero-new').addEventListener('click', () => {
    activeHeroId = null;
    heroNameInput.value = '';
    avatarDraft = makeRandomAvatar();
    renderAvatarFields();
    renderHeroGallery();
});
document.getElementById('avatar-random').addEventListener('click', () => {
    activeHeroId = null;
    heroNameInput.value = '';
    avatarDraft = makeRandomAvatar();
    renderAvatarFields();
    renderHeroGallery();
});
document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    activeHeroId = null;
    heroNameInput.value = t(`preset${button.dataset.preset[0].toUpperCase()}${button.dataset.preset.slice(1)}`);
    avatarDraft = { ...avatarDraft, ...heroPresets[button.dataset.preset] };
    renderAvatarFields();
    renderHeroGallery();
}));
document.getElementById('avatar-save').addEventListener('click', () => {
    avatarConfig = { ...avatarDraft };
    const name = heroNameInput.value.trim() || t('heroDefaultName', heroes.length + 1);
    if (!activeHeroId) activeHeroId = `hero-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const saved = { id: activeHeroId, name, avatar: avatarConfig };
    const existingIndex = heroes.findIndex(hero => hero.id === activeHeroId);
    if (existingIndex === -1) heroes.push(saved);
    else heroes[existingIndex] = saved;
    saveHeroes(heroes);
    localStorage.setItem('color-clash-active-hero', activeHeroId);
    saveAvatar(avatarConfig);
    refreshAvatarImages();
    avatarDialog.close();
});
document.getElementById('avatar-export').addEventListener('click', async () => {
    const image = new Image();
    image.src = avatarDataUrl(avatarDraft);
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 448;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `color-clash-hero-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
});

const joinFormContainer = document.getElementById('join-form-container');

function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(import.meta.env.VITE_WS_URL ||
        (import.meta.env.PROD ? `${protocol}//${location.host}` : `${protocol}//${location.hostname}:8080`));

    ws.onopen = () => {
        console.log('Connected to server');
        const saved = sessionStorage.getItem(sessionKey);
        if (saved) {
            try {
                sendMessage({ action: 'resume', ...JSON.parse(saved) });
            } catch {
                sessionStorage.removeItem(sessionKey);
            }
        }
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.action === 'wallet_challenge') {
            walletChallenge = message.challenge;
            if (!sessionStorage.getItem(sessionKey) && walletAddress) {
                walletAddress = null;
                walletSignature = null;
                cosmeticsState = null;
                refreshAvatarImages();
                walletStatus.textContent = t('noWallet');
            }
            return;
        }
        if (message.action === 'leaderboard') {
            renderLeaderboard(message.leaderboard);
            return;
        }
        if (message.action === 'profile') {
            renderWalletHistory(message.history);
            renderLeaderboard(message.leaderboard);
            cosmeticsState = message.cosmetics;
            refreshAvatarImages();
            renderCollection();
            renderShop();
            shopMessage.textContent = '';
            return;
        }
        if (message.action === 'cosmetic_error') {
            shopMessage.textContent = message.message;
            return;
        }
        if (message.action === 'chain_recorded') {
            if (completedGame?.gameId !== message.gameId) return;
            resultStatus.textContent = t('autoChainRecorded');
            if (message.txHash && Number(import.meta.env.VITE_CHAIN_ID || 43113) === 43113) {
                resultLink.href = `https://testnet.snowtrace.io/tx/${message.txHash}`;
                resultLink.style.display = 'inline-block';
            }
            return;
        }
        if (message.action === 'chain_record_failed') {
            if (completedGame?.gameId === message.gameId) resultStatus.textContent = t('autoChainFailed');
            return;
        }
        
        if (message.action === 'error') {
            alert(message.message);
            // Re-enable form inputs so user can try again
            nameInput.disabled = false;
            lobbyIdInput.disabled = false;
            joinButton.disabled = false;
            soloButton.disabled = false;
            quickMatchButton.disabled = false;
            queuePanel.hidden = true;
            return;
        }
        if (message.action === 'queue') {
            queuePanel.hidden = false;
            queueStatus.textContent = t('queueStatus', message.waiting);
            return;
        }
        if (message.action === 'queue_cancelled') {
            queuePanel.hidden = true;
            nameInput.disabled = false;
            lobbyIdInput.disabled = false;
            joinButton.disabled = false;
            soloButton.disabled = false;
            quickMatchButton.disabled = false;
            return;
        }
        if (message.action === 'resume_failed') {
            sessionStorage.removeItem(sessionKey);
            resetGameState();
            return;
        }
        if (message.action === 'joined') {
            queuePanel.hidden = true;
            sessionStorage.setItem(sessionKey, JSON.stringify({ lobbyId: message.lobbyId, resumeToken: message.resumeToken }));
        }
        
        if (message.action === 'players') {
            players = message.players;
            currentTurn = message.turn;
            myLobbyId = message.lobbyId;
            updatePlayers(message.players, message.turn);
            updateTurnIndicator();
            showLobbyInfo(message.lobbyId);
        }

        if (message.action === 'start') {
            closeGameMenu();
            resultPanel.style.display = 'none';
            lobbyDiv.classList.remove('has-result');
            completedGame = null;
            hideWildColorPicker();
            myId = message.id;
            lobbyDiv.style.display = 'none';
            gameDiv.style.display = 'block';
            players = message.players;
            currentTurn = message.turn;
            turnDirection = message.direction ?? 1;
            turnEndsAt = message.turnEndsAt ?? null;
            lastAction = message.lastAction ?? null;
            myHand = message.hand;
            drawnCardIndex = message.drawnCardIndex ?? null;
            unoPending = message.unoPending ?? null;
            unoAnnouncement = message.unoAnnouncement ?? null;
            pendingWild4 = message.pendingWild4 ?? null;
            updatePlayers(message.players, message.turn);
            updateDiscardPile(message.discardPile);
            updateHand(message.hand);
            updateTurnIndicator();
        }

        if (message.action === 'update') {
            hideWildColorPicker();
            const cardsDrawnByMe = myHand.length ? Math.max(0, message.hand.length - myHand.length) : 0;
            const newUno = message.unoAnnouncement?.id !== unoAnnouncement?.id
                ? message.unoAnnouncement?.playerId : null;
            players = message.players;
            currentTurn = message.turn;
            turnDirection = message.direction ?? 1;
            turnEndsAt = message.turnEndsAt ?? null;
            lastAction = message.lastAction ?? null;
            myHand = message.hand;
            drawnCardIndex = message.drawnCardIndex ?? null;
            unoPending = message.unoPending ?? null;
            unoAnnouncement = message.unoAnnouncement ?? null;
            pendingWild4 = message.pendingWild4 ?? null;
            updatePlayers(message.players, message.turn);
            updateDiscardPile(message.discardPile);
            updateHand(message.hand);
            updateTurnIndicator();
            if (newUno) celebrateUno(newUno);
            if (cardsDrawnByMe) {
                animateOwnReach();
                animateDrawFlight(playerHandDiv, cardsDrawnByMe, 250);
            }
        }

        if (message.action === 'win') {
            closeGameMenu();
            localStorage.setItem(historyKey, JSON.stringify(addMatch(loadMatchHistory(), message, myId)));
            renderMatchHistory();
            completedGame = message;
            gameDiv.style.display = 'none';
            lobbyDiv.style.display = 'block';
            myHand = [];
            drawnCardIndex = null;
            unoPending = null;
            unoAnnouncement = null;
            pendingWild4 = null;
            wild4Panel.hidden = true;
            players = message.players;
            showLobbyInfo(myLobbyId);
            updatePlayers(players, -1);
            resultTitle.textContent = t('wins', message.winner);
            resultPanel.style.display = 'block';
            lobbyDiv.classList.add('has-result');
            document.getElementById('scoreboard').hidden = Boolean(message.interrupted);
            scoreRows.replaceChildren(...message.players.map(player => {
                const row = document.createElement('p');
                row.textContent = `${player.name}: ${message.roundScores[player.id]} / ${message.scores[player.id] || 0}`;
                return row;
            }));
            const canRecord = !message.autoChain && !message.interrupted && chainConfigured() && walletAddress && message.players.every(player => player.walletAddress);
            confirmResultButton.disabled = !canRecord;
            confirmResultButton.hidden = Boolean(message.autoChain) || !canRecord;
            resultStatus.textContent = message.autoChain && !message.interrupted
                ? t('autoChainPending')
                : canRecord
                ? t('chainReady', message.players.length)
                : message.interrupted
                    ? t('interruptedGame')
                    : message.players.some(player => player.isBot)
                    ? t('soloDone')
                    : t('localDone');
            resultLink.style.display = 'none';
        }
    };

    ws.onclose = (event) => {
        console.log('Disconnected from server. Reconnecting...', event.code, event.reason);
        if (gameDiv.style.display === 'block') turnText.textContent = t('reconnecting');
        if (!myLobbyId && !sessionStorage.getItem(sessionKey)) {
            queuePanel.hidden = true;
            nameInput.disabled = false;
            lobbyIdInput.disabled = false;
            joinButton.disabled = false;
            soloButton.disabled = false;
            quickMatchButton.disabled = false;
        }
        // Only reconnect if it wasn't a manual close
        if (event.code !== 1000) {
            setTimeout(connect, 1000);
        }
    };

    ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        // Don't manually close on error, let the browser handle it
    };
}

function canSendMessage() {
    return ws && ws.readyState === WebSocket.OPEN;
}

function sendMessage(message) {
    if (canSendMessage()) {
        ws.send(JSON.stringify(message));
    } else {
        console.warn('WebSocket is not connected. Message not sent:', message);
    }
}

function updateTurnIndicator() {
    if (currentTurn === -1 || !players.length) {
        turnText.textContent = t('waiting');
        turnIndicator.classList.remove('my-turn');
        turnDirectionLabel.textContent = '';
        turnClock.textContent = '';
        lastActionLabel.textContent = '';
        return;
    }

    const currentPlayer = players[currentTurn];
    const isMyTurn = currentPlayer && currentPlayer.id === myId;
    
    if (isMyTurn) {
        turnText.textContent = t('yourTurn');
        turnIndicator.classList.add('my-turn');
    } else {
        turnText.textContent = t('playerTurn', currentPlayer?.name || '—');
        turnIndicator.classList.remove('my-turn');
    }
    turnDirectionLabel.textContent = t(turnDirection === 1 ? 'clockwise' : 'counterclockwise');
    const actor = players.find(player => player.id === lastAction?.playerId)?.name;
    if (actor && lastAction?.kind === 'play') {
        const card = lastAction.card;
        lastActionLabel.textContent = t('playedCard', actor, t(`color_${card.color}`), t(`card_${card.type}`));
    } else if (actor && lastAction) {
        lastActionLabel.textContent = t(`action_${lastAction.kind}`, actor);
    } else {
        lastActionLabel.textContent = '';
    }
    updateTurnClock();
}

function updateTurnClock() {
    if (!turnEndsAt || currentTurn < 0 || gameDiv.style.display !== 'block') return;
    const seconds = Math.max(0, Math.ceil((turnEndsAt - Date.now()) / 1000));
    turnClock.textContent = `⏱ ${seconds}s`;
    turnClock.classList.toggle('urgent', seconds <= 10);
}
setInterval(updateTurnClock, 250);

function showLobbyInfo(lobbyId) {
    if (lobbyId) {
        currentLobbyId.textContent = lobbyId;
        
        // Find the creator and update the lobby info
        const creator = players.find(p => p.isCreator);
        const creatorLabel = document.getElementById('room-creator');
        if (creator) {
            creatorLabel.textContent = t('createdBy', creator.name);
            creatorLabel.style.display = 'block';
        } else {
            creatorLabel.style.display = 'none';
        }
        
        lobbyInfo.style.display = 'block';
        readyButton.style.display = 'block';
        hideJoinForm();
        
    }
}

function resetGameState() {
    closeGameMenu();
    resultPanel.style.display = 'none';
    lobbyDiv.classList.remove('has-result');
    currentTurn = -1;
    turnEndsAt = null;
    lastAction = null;
    // Reset to lobby
    lobbyDiv.style.display = 'block';
    gameDiv.style.display = 'none';
    
    // Reset form
    nameInput.value = '';
    nameInput.disabled = false;
    joinButton.disabled = false;
    soloButton.disabled = false;
    quickMatchButton.disabled = false;
    queuePanel.hidden = true;
    lobbyIdInput.disabled = false;
    
    // Clear game state
    myId = null;
    currentTurn = -1;
    players = [];
    pendingWildCard = null;
    myHand = [];
    drawnCardIndex = null;
    unoPending = null;
    unoAnnouncement = null;
    pendingWild4 = null;
    wild4Panel.hidden = true;
    myLobbyId = null;
    
    // Hide wild color picker and lobby info
    wildColorPicker.style.display = 'none';
    hideLobbyInfo();
    
    // Clear players list
    playersList.innerHTML = '';
    
    // Reset turn indicator
    turnText.textContent = t('waiting');
    turnDirectionLabel.textContent = '';
    turnClock.textContent = '';
    lastActionLabel.textContent = '';
    turnIndicator.classList.remove('my-turn');
    
}

function updatePlayers(players, turn) {
    const previousCounts = new Map([...opponentHandsDiv.children].filter(element => element.dataset.cardCount !== undefined).map(element =>
        [element.dataset.playerId, Number(element.dataset.cardCount)]));
    opponentHandsDiv.innerHTML = '';
    playersList.innerHTML = '';
    let opponentIndex = 0;
    const opponentCount = players.length - (players.some(player => player.id === myId) ? 1 : 0);
    const myIndex = players.findIndex(player => player.id === myId);
    gameDiv.classList.toggle('crowded-table', opponentCount > 3);
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player');
        if (i === turn) {
            playerDiv.classList.add('active');
        }
        
        // Check for UNO condition (1 card or multiple same-number cards)
        if (player.uno) {
            playerDiv.classList.add('uno');
        }
        
        // Add creator styling to opponent display too
        if (player.isCreator) {
            playerDiv.classList.add('creator');
        }
        
        let displayText = player.name;
        if (player.isCreator) {
            displayText += ' 👑';
        }
        
        if (player.cardCount !== undefined) {
            playerDiv.textContent = `${displayText} · ${t('cards', player.cardCount)}`;
        } else {
            playerDiv.textContent = displayText;
        }
        if (player.connected === false) {
            playerDiv.classList.add('disconnected');
            playerDiv.textContent += ` · ${t('disconnected')}`;
        }

        const avatar = document.createElement('img');
        avatar.className = 'player-avatar';
        avatar.alt = '';
        avatar.src = avatarDataUrl(player.avatar);
        playerDiv.prepend(avatar);
        if (player.id === myId) myAvatar.src = avatar.src;
        if (player.id !== myId) {
            const back = document.createElement('img');
            back.className = 'player-back';
            back.src = cardBackImage(player.cardBack);
            back.alt = '';
            playerDiv.append(back);
        } else myCardBack.src = cardBackImage(player.cardBack);

        if (player.id !== myId) {
            playerDiv.dataset.playerId = player.id;
            if (player.cardCount !== undefined) playerDiv.dataset.cardCount = player.cardCount;
            const previousCount = previousCounts.get(String(player.id));
            const cardChange = previousCount === undefined || player.cardCount === undefined ? 0 : player.cardCount - previousCount;
            if (cardChange) {
                playerDiv.classList.add(cardChange < 0 ? 'played' : 'drew');
                setTimeout(() => playerDiv.classList.remove('played', 'drew'), 750);
            }
            if (opponentCount <= 3) {
                const relativeSeat = (i - myIndex + players.length) % players.length;
                const seat = opponentCount === 3 ? [0, 2, 1, 3][relativeSeat]
                    : opponentCount === 2 ? relativeSeat + 1 : 1;
                playerDiv.classList.add(`seat-${seat}`);
                const character = document.createElement('span');
                character.className = 'table-character';
                character.setAttribute('aria-hidden', 'true');
                const sprite = document.createElement('img');
                sprite.alt = '';
                sprite.src = avatar.src;
                sprite.dataset.base = sprite.src;
                sprite.dataset.reach = avatarDataUrl({ ...player.avatar, pose: 'dash' });
                character.appendChild(sprite);
                playerDiv.prepend(character);
            }
            if (opponentCount > 4) {
                const topCount = Math.min(window.innerWidth <= 700 ? 3 : 5, opponentCount);
                if (opponentIndex < topCount) {
                    playerDiv.style.top = '10%';
                    playerDiv.style.left = `${(opponentIndex + 1) * 100 / (topCount + 1)}%`;
                    playerDiv.style.right = 'auto';
                    playerDiv.style.transform = 'translateX(-50%) skew(-5deg)';
                } else {
                    const sideIndex = opponentIndex - topCount;
                    playerDiv.style.top = `${30 + Math.floor(sideIndex / 2) * 17}%`;
                    playerDiv.style.left = sideIndex % 2 === 0 ? '2%' : 'auto';
                    playerDiv.style.right = sideIndex % 2 === 1 ? '2%' : 'auto';
                    playerDiv.style.transform = 'skew(-5deg)';
                }
            }
            opponentHandsDiv.appendChild(playerDiv);
            if (cardChange > 0 && gameDiv.style.display === 'block') {
                animateDrawCharacter(playerDiv);
                animateDrawFlight(playerDiv, cardChange, 250);
            }
            opponentIndex++;
        }

        const li = document.createElement('li');
        let playerText = player.name;
        
        // Add creator indicator
        if (player.isCreator) {
            playerText += ' 👑';
        }
        
        // Add ready status
        if (player.ready) {
            playerText += ` (${t('readyStatus')})`;
        }
        if (player.connected === false) playerText += ` (${t('disconnected')})`;
        
        li.textContent = playerText;
        
        if (i === turn) {
            li.style.fontWeight = 'bold';
        }
        
        // Add special styling for creator
        if (player.isCreator) {
            li.classList.add('creator');
        }
        
        playersList.appendChild(li);
    }
    updateActions();
}

function animateDrawCharacter(playerDiv) {
    const character = playerDiv.querySelector('.table-character');
    if (!character || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const sprite = character.querySelector('img');
    for (const [delay, frame] of [[80, 'mid'], [230, 'full'], [430, 'mid'], [610, '']]) {
        setTimeout(() => {
            if (character.isConnected) {
                character.dataset.drawFrame = frame;
                sprite.src = frame ? sprite.dataset.reach : sprite.dataset.base;
            }
        }, delay);
    }
}

function animateDrawFlight(target, count, delay = 0) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const deck = gameDiv.querySelector('.card-back');
    if (!deck || !target) return;
    const gameRect = gameDiv.getBoundingClientRect();
    const deckRect = deck.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const startX = deckRect.left + deckRect.width / 2 - gameRect.left;
    const startY = deckRect.top + deckRect.height / 2 - gameRect.top;
    const dx = targetRect.left + targetRect.width / 2 - gameRect.left - startX;
    const dy = targetRect.top + targetRect.height / 2 - gameRect.top - startY;
    for (let i = 0; i < Math.min(count, 4); i++) {
        const flyingCard = document.createElement('span');
        flyingCard.className = 'flying-card';
        flyingCard.setAttribute('aria-hidden', 'true');
        flyingCard.style.left = `${startX}px`;
        flyingCard.style.top = `${startY}px`;
        flyingCard.style.setProperty('--flight-x', `${dx + i * 5}px`);
        flyingCard.style.setProperty('--flight-y', `${dy + i * 3}px`);
        flyingCard.style.setProperty('--flight-mid-x', `${dx * .5}px`);
        flyingCard.style.setProperty('--flight-mid-y', `${dy * .5 - 45}px`);
        flyingCard.style.animationDelay = `${delay + i * 90}ms`;
        flyingCard.addEventListener('animationend', () => flyingCard.remove(), { once: true });
        gameDiv.appendChild(flyingCard);
    }
}

function animateOwnReach() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const hand = document.createElement('span');
    hand.className = 'player-reach';
    hand.setAttribute('aria-hidden', 'true');
    hand.addEventListener('animationend', () => hand.remove(), { once: true });
    gameDiv.appendChild(hand);
}

function celebrateUno(playerId) {
    const playerName = players.find(player => player.id === playerId)?.name;
    if (playerName) lastActionLabel.textContent = t('unoCalled', playerName);
    const playerDiv = playerId === myId ? document.querySelector('.hand-label')
        : [...opponentHandsDiv.children].find(element => element.dataset.playerId === String(playerId));
    if (!playerDiv || gameDiv.style.display !== 'block') return;
    playerDiv.classList.add('uno-celebrate');
    const burst = document.createElement('span');
    burst.className = 'uno-burst';
    burst.textContent = 'UNO!';
    burst.setAttribute('aria-hidden', 'true');
    playerDiv.appendChild(burst);
    playUnoSound();
    setTimeout(() => {
        playerDiv.classList.remove('uno-celebrate');
        burst.remove();
    }, 1200);
}

function isPlayableCard(card, index) {
    if (players[currentTurn]?.id !== myId || !card || pendingWild4) return false;
    if (drawnCardIndex !== null && index !== drawnCardIndex) return false;
    const top = topCard;
    if (!top) return false;
    return card.type === 'wild' || card.type === 'wild4' ||
        card.color === top.color || card.type === top.type;
}

function updateActions() {
    const myTurn = players[currentTurn]?.id === myId && gameDiv.style.display === 'block';
    const resolvingWild4 = Boolean(pendingWild4);
    wild4Panel.hidden = !resolvingWild4 || pendingWild4.targetId !== myId;
    drawCardButton.disabled = !myTurn || resolvingWild4 || drawnCardIndex !== null;
    passTurnButton.hidden = !myTurn || resolvingWild4 || drawnCardIndex === null;
    callUnoButton.hidden = !((myTurn && myHand.length === 2 && !players.find(player => player.id === myId)?.predeclaredUno) ||
        (myHand.length === 1 && !players.find(player => player.id === myId)?.uno));
    catchUnoButton.hidden = !unoPending || unoPending === myId || gameDiv.style.display !== 'block';
}

function updateHand(hand) {
    playerHandDiv.replaceChildren();
    for (let i = 0; i < hand.length; i++) {
        const card = hand[i];
        const cardDiv = createCard(card);
        const playable = isPlayableCard(card, i);
        cardDiv.dataset.cardIndex = i;
        cardDiv.classList.toggle('unplayable', !playable);
        cardDiv.tabIndex = playable ? 0 : -1;
        if (playable) {
            cardDiv.addEventListener('click', () => handleCardClick(card));
            cardDiv.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleCardClick(card);
                }
            });
        }
        playerHandDiv.appendChild(cardDiv);
    }
    updateActions();
}

function handleCardClick(card) {
    if (card.type === 'wild' || card.type === 'wild4') showWildColorPicker(card);
    else sendMessage({ action: 'play', card });
}

function showWildColorPicker(card) {
    pendingWildCard = card;
    wildColorPicker.style.display = 'block';
}

function hideWildColorPicker() {
    wildColorPicker.style.display = 'none';
    pendingWildCard = null;
}

function updateDiscardPile(discardPile) {
    discardPileDiv.innerHTML = '';
    const card = discardPile[discardPile.length - 1];
    topCard = card;
    const cardDiv = createCard(card);
    discardPileDiv.appendChild(cardDiv);
}

function createCard(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    
    // Set data attributes for CSS styling
    cardDiv.setAttribute('data-color', card.color || 'black');
    cardDiv.setAttribute('data-type', card.type);
    
    // Create card content structure
    const cardContent = document.createElement('div');
    cardContent.classList.add('card-content');
    
    // Determine card display values
    let cornerNumber, cornerSymbol, centerContent;
    
    if (card.type === 'wild') {
        cornerNumber = 'W';
        cornerSymbol = '★';
        centerContent = 'W';
    } else if (card.type === 'wild4') {
        cornerNumber = '+4';
        cornerSymbol = '★';
        centerContent = '+4';
    } else if (card.type === 'draw2') {
        cornerNumber = '+2';
        cornerSymbol = '2';
        centerContent = '+2';
    } else if (card.type === 'skip') {
        cornerNumber = 'Ø';
        cornerSymbol = 'Ø';
        centerContent = 'Ø';
    } else if (card.type === 'reverse') {
        cornerNumber = '⇄';
        cornerSymbol = '⇄';
        centerContent = '⇄';
    } else {
        cornerNumber = card.type.toUpperCase();
        cornerSymbol = card.type.toUpperCase();
        centerContent = card.type.toUpperCase();
    }
    
    // Create top-left corner
    const topLeftCorner = document.createElement('div');
    topLeftCorner.classList.add('card-corner', 'top-left');
    
    const topLeftNumber = document.createElement('div');
    topLeftNumber.classList.add('card-corner-number');
    topLeftNumber.textContent = cornerNumber;
    
    topLeftCorner.appendChild(topLeftNumber);
    
    // Create bottom-right corner
    const bottomRightCorner = document.createElement('div');
    bottomRightCorner.classList.add('card-corner', 'bottom-right');
    
    const bottomRightNumber = document.createElement('div');
    bottomRightNumber.classList.add('card-corner-number');
    bottomRightNumber.textContent = cornerNumber;
    
    bottomRightCorner.appendChild(bottomRightNumber);
    
    // Create center ellipse
    const cardCenter = document.createElement('div');
    cardCenter.classList.add('card-center');
    
    const cardCenterContent = document.createElement('div');
    cardCenterContent.classList.add('card-center-content');
    
    const centerElement = document.createElement('div');
    centerElement.classList.add('card-center-number');
    centerElement.textContent = centerContent;
    
    cardCenterContent.appendChild(centerElement);
    cardCenter.appendChild(cardCenterContent);
    
    // Assemble the card
    cardContent.appendChild(topLeftCorner);
    cardContent.appendChild(bottomRightCorner);
    cardContent.appendChild(cardCenter);
    cardDiv.appendChild(cardContent);
    
    return cardDiv;
}

colorOptions.addEventListener('click', (e) => {
    if (e.target.classList.contains('color-option')) {
        const color = e.target.dataset.color;
        if (pendingWildCard) {
            sendMessage({ action: 'play', card: { ...pendingWildCard, color } });
            hideWildColorPicker();
        }
    }
});

function joinGame(solo = false) {
    if (!canSendMessage()) {
        alert(t('reconnecting'));
        return;
    }
    const name = nameInput.value.trim() || (solo ? 'You' : '');
    const lobbyId = lobbyIdInput.value.trim().toUpperCase();
    
    if (!name) {
        alert(t('nameRequired'));
        return;
    }
    
    if (name.length < 2) {
        alert(t('nameMin'));
        return;
    }
    
    if (name.length > 20) {
        alert(t('nameMax'));
        return;
    }
    
    // Disable form to prevent multiple submissions
    nameInput.disabled = true;
    lobbyIdInput.disabled = true;
    joinButton.disabled = true;
    soloButton.disabled = true;
    quickMatchButton.disabled = true;
    
    const message = { action: 'join', name: name, walletAddress, walletSignature, avatar: avatarConfig, solo };
    if (lobbyId && !solo) {
        message.lobbyId = lobbyId;
    }
    sendMessage(message);
}

joinButton.addEventListener('click', () => joinGame());
soloButton.addEventListener('click', () => joinGame(true));
quickMatchButton.addEventListener('click', () => {
    if (!canSendMessage()) { alert(t('reconnecting')); return; }
    const name = nameInput.value.trim();
    if (name.length < 2 || name.length > 20) { alert(t(name.length < 2 ? 'nameMin' : 'nameMax')); return; }
    nameInput.disabled = true;
    lobbyIdInput.disabled = true;
    joinButton.disabled = true;
    soloButton.disabled = true;
    quickMatchButton.disabled = true;
    queuePanel.hidden = false;
    queueStatus.textContent = t('queueStatus', 1);
    sendMessage({ action: 'matchmake', name, walletAddress, walletSignature, avatar: avatarConfig });
});
cancelMatchButton.addEventListener('click', () => sendMessage({ action: 'cancel_matchmaking' }));

readyButton.addEventListener('click', () => {
    sendMessage({ action: 'ready' });
});

drawCardButton.addEventListener('click', () => {
    sendMessage({ action: 'draw' });
});
passTurnButton.addEventListener('click', () => sendMessage({ action: 'pass' }));
callUnoButton.addEventListener('click', () => sendMessage({ action: 'uno' }));
catchUnoButton.addEventListener('click', () => sendMessage({ action: 'catch_uno' }));
acceptWild4Button.addEventListener('click', () => sendMessage({ action: 'accept_wild4' }));
challengeWild4Button.addEventListener('click', () => sendMessage({ action: 'challenge_wild4' }));

connectWalletButton.addEventListener('click', async () => {
    try {
        const wallet = await connectWallet(walletChallenge);
        walletAddress = wallet.address;
        walletSignature = wallet.signature;
        walletStatus.textContent = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
        sendMessage({ action: 'profile', walletAddress, walletSignature });
    } catch (error) {
        walletStatus.textContent = error.message;
    }
});

confirmResultButton.addEventListener('click', async () => {
    if (!completedGame) return;
    confirmResultButton.disabled = true;
    resultStatus.textContent = t('txPending');
    try {
        const result = await attestResult(completedGame);
        resultStatus.textContent = result.finalized
            ? t('finalized')
            : t('confirmations', result.confirmations, completedGame.players.length);
        if (result.txUrl) {
            resultLink.href = result.txUrl;
            resultLink.style.display = 'inline-block';
        }
    } catch (error) {
        resultStatus.textContent = error.shortMessage || error.message;
        confirmResultButton.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage();
    gameMenuCloseButton.setAttribute('aria-label', t('closeMenu'));
    resultDismissButton.setAttribute('aria-label', t('closeResult'));
    updateMusicButton();
    updateSfxButton();
    refreshAvatarImages();
    renderCollection();
    renderMatchHistory();
    renderWalletHistory();
    renderLeaderboard();
    renderShop();
    connect();
    
    // Add click-to-copy functionality to lobby ID
    const lobbyIdSpan = document.getElementById('current-lobby-id');
    if (lobbyIdSpan) {
        lobbyIdSpan.style.cursor = 'pointer';
        lobbyIdSpan.title = 'Click to copy lobby ID';
        lobbyIdSpan.addEventListener('click', copyLobbyId);
    }
});

languageSelect.addEventListener('change', () => {
    applyLanguage(languageSelect.value);
    gameMenuCloseButton.setAttribute('aria-label', t('closeMenu'));
    resultDismissButton.setAttribute('aria-label', t('closeResult'));
    updateMusicButton();
    renderMatchHistory();
    renderWalletHistory(walletHistoryData);
    renderLeaderboard(leaderboardData);
    renderShop();
    renderCollection();
    if (avatarDialog.open) renderAvatarFields();
    updateTurnIndicator();
    updatePlayers(players, currentTurn);
    if (myLobbyId) showLobbyInfo(myLobbyId);
    if (completedGame) {
        resultTitle.textContent = t('wins', completedGame.winner);
        resultStatus.textContent = completedGame.interrupted ? t('interruptedGame')
            : completedGame.players.some(player => player.isBot) ? t('soloDone') : t('localDone');
    }
});
window.addEventListener('resize', () => updatePlayers(players, currentTurn));

function copyLobbyId() {
    const lobbyIdSpan = document.getElementById('current-lobby-id');
    const lobbyId = lobbyIdSpan.textContent;
    
    // Use the modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(lobbyId).then(() => {
            showCopyFeedback(lobbyIdSpan);
        }).catch(() => {
            // Fallback for older browsers
            fallbackCopyToClipboard(lobbyId, lobbyIdSpan);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyToClipboard(lobbyId, lobbyIdSpan);
    }
}

function fallbackCopyToClipboard(text, element) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopyFeedback(element);
    } catch (err) {
        console.error('Failed to copy lobby ID:', err);
    }
    
    document.body.removeChild(textArea);
}

function showCopyFeedback(element) {
    const originalText = element.textContent;
    element.textContent = t('copied');
    element.style.background = 'rgba(72, 187, 120, 0.3)';
    
    setTimeout(() => {
        element.textContent = originalText;
        element.style.background = 'rgba(255,255,255,0.2)';
    }, 1000);
}

function createLeaveLobbyButton() {
    const leaveLobbyBtn = document.createElement('button');
    leaveLobbyBtn.id = 'leave-lobby';
    leaveLobbyBtn.textContent = t('leave');
    leaveLobbyBtn.classList.add('leave-lobby-btn');
    leaveLobbyBtn.addEventListener('click', leaveLobby);
    return leaveLobbyBtn;
}

function leaveLobby() {
    if (confirm(t('leaveConfirm'))) {
        sessionStorage.removeItem(sessionKey);
        // Send leave message to server
        sendMessage({ action: 'leave' });
        
        // Reset to join form state
        showJoinForm();
        hideLobbyInfo();
        
        // Clear lobby data
        myLobbyId = null;
        
        // Clear players list
        playersList.innerHTML = '';
        
        // Re-enable form inputs
        nameInput.disabled = false;
        lobbyIdInput.disabled = false;
        joinButton.disabled = false;
        soloButton.disabled = false;
        
        // Clear name input
        nameInput.value = '';
    }
}

function showJoinForm() {
    joinFormContainer.style.display = 'block';
    
    // Remove leave lobby button if it exists
    const existingLeaveBtn = document.getElementById('leave-lobby');
    if (existingLeaveBtn) {
        existingLeaveBtn.remove();
    }
}

function hideJoinForm() {
    joinFormContainer.style.display = 'none';
    
    // Add leave lobby button if it doesn't exist
    let leaveLobbyBtn = document.getElementById('leave-lobby');
    if (!leaveLobbyBtn) {
        leaveLobbyBtn = createLeaveLobbyButton();
        // Insert after lobby info
        const lobbyInfo = document.getElementById('lobby-info');
        lobbyInfo.parentNode.insertBefore(leaveLobbyBtn, lobbyInfo.nextSibling);
    }
}

function hideLobbyInfo() {
    lobbyInfo.style.display = 'none';
    readyButton.style.display = 'none';
    showJoinForm();
}
