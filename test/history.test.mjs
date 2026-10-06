import test from 'node:test';
import assert from 'node:assert/strict';
import { addMatch, summarizeHistory } from '../history.js';

const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }];
const game = {
    gameId: 'round-1', winner: 'Alice', players, interrupted: false,
    roundScores: { a: 0, b: -25 }, scores: { a: 0, b: -25 }
};

test('history records each participant once and counts wins and losses', () => {
    let history = addMatch([], game, 'a', 1000);
    history = addMatch(history, game, 'b', 1000);
    assert.deepEqual(summarizeHistory(history), { wins: 1, losses: 1, interrupted: 0 });
    assert.equal(addMatch(history, game, 'a', 2000).length, 2);
    assert.equal(history[0].roundPenalty, -25);
    assert.deepEqual(history[0].opponents, ['Alice']);
});

test('an interrupted game does not count as a loss', () => {
    const history = addMatch([], { ...game, gameId: 'round-2', interrupted: true }, 'b');
    assert.equal(history[0].outcome, 'interrupted');
    assert.equal(history[0].roundPenalty, null);
    assert.deepEqual(summarizeHistory(history), { wins: 0, losses: 0, interrupted: 1 });
});
