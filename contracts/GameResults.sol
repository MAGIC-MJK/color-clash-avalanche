// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GameResults {
    address public recorder;

    struct RankedMatch {
        bytes32 winnerId;
        address winnerWallet;
        uint8 playerCount;
        bool recorded;
    }

    mapping(bytes32 => RankedMatch) public rankedMatches;
    mapping(address => uint256) public wins;
    mapping(address => uint256) public losses;
    address[] public rankedPlayers;
    mapping(address => bool) public knownPlayer;

    event MatchRecorded(bytes32 indexed gameId, bytes32 indexed winnerId, address indexed winnerWallet, address[] wallets);
    event RecorderTransferred(address indexed previousRecorder, address indexed nextRecorder);

    constructor() {
        recorder = msg.sender;
    }

    function transferRecorder(address nextRecorder) external {
        require(msg.sender == recorder, "Only recorder");
        require(nextRecorder != address(0), "Invalid recorder");
        emit RecorderTransferred(recorder, nextRecorder);
        recorder = nextRecorder;
    }

    function rankedPlayerCount() external view returns (uint256) {
        return rankedPlayers.length;
    }

    function recordMatch(bytes32 gameId, bytes32 winnerId, address winnerWallet, address[] calldata wallets) external {
        require(msg.sender == recorder, "Only recorder");
        require(!rankedMatches[gameId].recorded, "Already recorded");
        require(wallets.length >= 2 && wallets.length <= 10, "Need 2-10 players");
        require(winnerId != bytes32(0), "Invalid winner");

        bool winnerWalletFound = winnerWallet == address(0);
        for (uint256 i = 0; i < wallets.length; i++) {
            address wallet = wallets[i];
            if (wallet == address(0)) continue;
            for (uint256 j = 0; j < i; j++) {
                require(wallets[j] != wallet, "Duplicate wallet");
            }
            if (!knownPlayer[wallet]) {
                knownPlayer[wallet] = true;
                rankedPlayers.push(wallet);
            }
            if (wallet == winnerWallet) {
                winnerWalletFound = true;
                wins[wallet]++;
            } else {
                losses[wallet]++;
            }
        }
        require(winnerWalletFound, "Winner wallet missing");
        rankedMatches[gameId] = RankedMatch(winnerId, winnerWallet, uint8(wallets.length), true);
        emit MatchRecorded(gameId, winnerId, winnerWallet, wallets);
    }

    struct MatchResult {
        bytes32 playersHash;
        address winner;
        uint8 confirmations;
        bool finalized;
    }

    mapping(bytes32 => MatchResult) public results;
    mapping(bytes32 => mapping(address => bool)) public confirmed;

    event ResultProposed(bytes32 indexed gameId, address[] players, address indexed winner);
    event ResultConfirmed(bytes32 indexed gameId, address indexed player, uint8 confirmations);
    event ResultFinalized(bytes32 indexed gameId, address indexed winner);

    function attest(bytes32 gameId, address[] calldata players, address winner) external {
        require(players.length >= 2 && players.length <= 10, "Need 2-10 players");
        require(winner != address(0), "Invalid winner");

        bool senderIsPlayer;
        bool winnerIsPlayer;
        for (uint256 i = 0; i < players.length; i++) {
            require(players[i] != address(0), "Invalid player");
            for (uint256 j = 0; j < i; j++) {
                require(players[i] != players[j], "Duplicate player");
            }
            if (players[i] == msg.sender) senderIsPlayer = true;
            if (players[i] == winner) winnerIsPlayer = true;
        }
        require(senderIsPlayer && winnerIsPlayer, "Player or winner missing");

        MatchResult storage result = results[gameId];
        bytes32 playersHash = keccak256(abi.encode(players));
        if (result.playersHash == bytes32(0)) {
            result.playersHash = playersHash;
            result.winner = winner;
            emit ResultProposed(gameId, players, winner);
        } else {
            require(result.playersHash == playersHash && result.winner == winner, "Result differs");
            require(!result.finalized, "Already finalized");
        }
        require(!confirmed[gameId][msg.sender], "Already confirmed");

        confirmed[gameId][msg.sender] = true;
        result.confirmations += 1;
        emit ResultConfirmed(gameId, msg.sender, result.confirmations);
        if (result.confirmations == players.length) {
            result.finalized = true;
            emit ResultFinalized(gameId, winner);
        }
    }
}
