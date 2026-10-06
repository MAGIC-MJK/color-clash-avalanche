# Color Clash: 2–10 player card game with Avalanche result confirmation

This is a small Avalanche adaptation of [craigwduckett/uno-game](https://github.com/craigwduckett/uno-game). The original multiplayer game and instructions are preserved in [UPSTREAM_README.md](UPSTREAM_README.md). This version adds optional wallet connection, private hand delivery, and a contract where all players can confirm the winner.

For the Avalanche Buildathon, see the [8-slide project deck](submission/Color-Clash-Pitch-v6.pptx) and screenshots of the [home screen](submission/screenshots/home.png), [game table](submission/screenshots/game.png), [character editor](submission/screenshots/avatar.png), and [shop](submission/screenshots/shop.png).

## Play locally

Requires Node.js 20 or newer. In two terminals, from this directory:

```sh
npm install
npm start
```

```sh
npm run serve -- --host 127.0.0.1
```

For an immediate game, open [http://127.0.0.1:3000](http://127.0.0.1:3000) and click **Play solo vs 3 bots**. Take your turn by clicking a playable card, or click **Draw card**. The bots take their turns automatically. No wallet is needed.

Before joining, click **Create a comic pixel hero** to build an original full-body character. The three presets have different poses and silhouettes. Change the suit, colors, cape, mask, emblem, hair, and face; name the hero and save it to the browser's character library. The selected character now appears at the table for other players, with a larger self portrait beside your hand and an alternate reach pose when drawing. You can select and edit saved heroes later. **Export PNG** downloads a transparent 320×448 image. The option lists and color presets use the MIT-licensed [bitface](https://github.com/ignaciocabeza/bitface) library; the full-body pixel drawing and outfits are original to this project.

For a game with friends, open the same address in 2–10 browser tabs or devices that can reach the game server. Give each player a different name. The first player leaves the room ID blank; the others enter the displayed ID. Everyone clicks **Ready**. A wallet is optional for local play.

**Quick match** queues players for a four-person ranked game and starts automatically when the fourth player joins. Players can cancel while waiting. Invite rooms and solo games are casual; they appear in wallet history but do not affect the leaderboard or automatic on-chain ranked records. The queue and active rooms currently live only in server memory.

The 108-card deck uses the standard four colors, 19 number cards and 6 action cards per color, plus four Wild and four Wild Draw Four cards. Each turn plays one card. A player may draw even when holding a playable card; if the drawn card is playable, they may play only that card or keep it and pass. Call **UNO!** when you are about to have one card, or report another player's missed call before the next player acts. A missed call costs two cards. Round penalties are number values, 20 for action cards, and 50 for Wild cards; the same room can play another round with cumulative penalties and the previous winner starting. After a Wild Draw Four, the next player may accept four cards or challenge. A successful challenge makes the offender draw four and the challenger keeps the turn; a failed challenge makes the challenger draw six and lose the turn. Stacking is not included.

An idle turn is handled by the server after 60 seconds: it draws a card, then passes if the drawn card can be played. A pending Wild Draw Four is accepted automatically when its response times out. `TURN_TIMEOUT_MS` changes this duration for local testing.

To keep reviewable match records, set `MATCH_LOG_PATH` on the game server to a file **outside the web root**. Each completed or interrupted match appends one JSON line with the shuffled deck and action history. This log contains private hands and wallet addresses, so only the server operator should be able to read it. Without this setting, audit data is held only for the current match and then discarded.

If a multiplayer player's connection drops, the browser tries to rejoin the same seat and hand for 45 seconds. Keep that tab open. If a player stays disconnected, the game continues with the remaining players; a game ended by disconnection is marked as interrupted and cannot be recorded on-chain. The character library is stored in the current browser, and rooms are stored in server memory.

The **Match history** section in the lobby keeps the latest 100 results in this browser and shows wins, losses, and interrupted games. The **Wallet history** section shows up to 100 completed games for a verified wallet across devices, and the public leaderboard ranks verified wallets by **ranked quick-match wins**. Wallet records are kept by the game server in `~/.color-clash/records.json` by default; set `GAME_DATA_DIR` to a persistent directory outside the web root for a hosted server. These server records are separate from the optional Fuji result contract; ranked results go on-chain only when the server recorder is configured.

For several phones or computers on the same Wi-Fi, run Vite with `npm run serve -- --host 0.0.0.0` and open `http://YOUR_COMPUTER_LAN_IP:3000` on each device. The game server also needs port 8080 reachable on that network.

## Run the production build

Run `npm run build` and `npm start`; the game server then serves both the built webpage and WebSocket game on `http://127.0.0.1:8080`. A public host should expose this one port behind HTTPS/WSS and attach persistent storage for `GAME_DATA_DIR` and `MATCH_LOG_PATH`. The included `Dockerfile` sets both paths under `/data`; mount `/data` as a persistent volume. The container build has not been verified here because the local Docker daemon was unavailable.

## Record results on Fuji

The game server keeps hands private and checks card plays. The contract supports two result paths: the original all-player confirmation, and a server recorder that can write results for public matches containing guests. The recorder stores the winner identifier and wallet win/loss totals on-chain; player names and private hands stay off-chain. Players must trust the game server's dealing and verdict. No wager or token is involved. This targets Fuji testnet, not Avalanche mainnet.

The Fuji contract is deployed at [`0x9B73a197d10aD99d5f6135970B6E27C1b45701BF`](https://testnet.snowtrace.io/address/0x9B73a197d10aD99d5f6135970B6E27C1b45701BF). A four-player ranked quick match was played through the game server and recorded in [transaction `0x20ed43cf…82db95`](https://testnet.snowtrace.io/tx/0x20ed43cfa4d8ae0f5da77c03596173e05795c6b55a0be8d1f90b0e41b582db95); the chain shows one win and three losses for those test wallets. The local `.env.local` contains the public contract configuration. The server still needs `RESULTS_CONTRACT_ADDRESS` and `CHAIN_RECORDER_PRIVATE_KEY` in its environment whenever it starts; keep the key outside this repository.

1. Use a dedicated Fuji test wallet with test AVAX. Never use your main wallet's recovery phrase or put a key in a source file.
2. Set `DEPLOYER_PRIVATE_KEY` in your shell and run `npm run deploy:fuji`. The script prints the contract address. It only accepts Fuji (chain ID 43113) or a local chain (31337).
3. Copy `.env.example` to `.env.local` and set `VITE_CONTRACT_ADDRESS` to the address from step 2. Restart the Vite server.
4. Every player connects a wallet **before joining** the room. Play a game; then each player clicks **Confirm result on Avalanche** and approves one wallet transaction. The last confirmation finalizes the result.

For automatic recording of **ranked quick matches**, set `RESULTS_CONTRACT_ADDRESS` and `CHAIN_RECORDER_PRIVATE_KEY` in the **server's environment**, using the wallet that deployed the contract. Use `GAME_DATA_DIR` for persistent server storage. The server pays Fuji transaction fees and retries unrecorded eligible matches after a restart. Guests can play without a wallet; their ranked matches still get a result entry, while wallet win/loss totals update only for connected wallets. Keep the recorder key out of the browser build and repository. Automatic recording is inactive until these server variables are configured. Matches played before recorder configuration are not submitted retroactively.

**Connect wallet** asks a browser wallet extension to share its public address and sign a one-time login challenge. Signing does not send a transaction or spend AVAX. It does not control cards or join a room. The transaction happens only after a multiplayer game, when a player clicks **Confirm result on Avalanche**. This needs the Fuji contract address configured in `.env` and Fuji test AVAX for transaction fees. Solo games with bots cannot be confirmed on-chain.

**Collection shop:** Four original card backs and two outfit presets are available. The classic back is free. A connected wallet earns 20 in-game coins per completed match plus 10 for a win; interrupted matches earn none. Coins, purchases, and equipped cosmetics are stored by the game server in `GAME_DATA_DIR` and follow the verified wallet across devices. They are game points, not cryptocurrency or an on-chain token. Guests can preview the shop and keep playing without a wallet. Purchased outfits recolor the current custom character for future games; card backs appear beside player seats. No purchase changes card rules or match odds.

The front end can connect to a separately hosted WebSocket server through `VITE_WS_URL`. Fuji RPC and chain ID are already set in `.env.example`.

## Verify

```sh
npm run test:multiplayer
npm run test:contract
node --test test/history.test.mjs
node --test test/matchmaking.test.mjs test/turn-timeout.test.mjs
node --test test/wallet-auth.test.mjs
node --test test/records.test.mjs
node --test test/ranked-results.test.mjs test/chain-recorder.test.mjs
npm run test:run
npm run build
```

The multiplayer test opens five WebSocket clients, starts one room and checks that each player receives only their own hand. A rules test checks one-card turns, drawing, and ten-player rooms. The matchmaking test checks four-player start and cancellation. The timeout test checks idle turn handling. The reconnect test checks that a returning player keeps the same hand and that a timed-out game is marked interrupted. The contract test confirms a ten-player match on a local test chain.

## Current limits

- Card dealing and turn logic run on the game server. Players trust that server; the contract proves that all listed wallets confirmed the same reported result, not that the server dealt fairly.
- Rooms are held in server memory. Restarting the server ends active games.
- Wallet history and the leaderboard persist on one server. Fuji ranked recording works when the server starts with its recorder configuration. The website currently sorts the server's wallet totals; it does not read the leaderboard directly from chain.
- Wallet ownership is checked by a signed per-connection challenge. For public deployment, serve both the page and WebSocket connection over HTTPS/WSS.
- The upstream README says MIT, but the downloaded source archive did not include a separate license file. Keep the upstream attribution and confirm reuse terms before public release.
