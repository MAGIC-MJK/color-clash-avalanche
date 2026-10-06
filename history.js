export function addMatch(history, game, playerId, playedAt = Date.now()) {
    const player = game.players.find(entry => entry.id === playerId);
    if (!player || !game.gameId) return history;
    const key = `${game.gameId}:${playerId}`;
    if (history.some(entry => entry.key === key)) return history;
    return [{
        key,
        playedAt,
        name: player.name,
        winner: game.winner,
        opponents: game.players.filter(entry => entry.id !== playerId).map(entry => entry.name),
        outcome: game.interrupted ? 'interrupted' : player.id === (game.winnerId || game.players.find(entry => entry.name === game.winner)?.id) ? 'win' : 'loss',
        roundPenalty: game.interrupted ? null : game.roundScores[playerId] ?? null,
        totalPenalty: game.interrupted ? null : game.scores[playerId] ?? null
    }, ...history].slice(0, 100);
}

export function summarizeHistory(history) {
    return {
        wins: history.filter(entry => entry.outcome === 'win').length,
        losses: history.filter(entry => entry.outcome === 'loss').length,
        interrupted: history.filter(entry => entry.outcome === 'interrupted').length
    };
}
