import { beforeEach, describe, expect, it } from 'vitest';

import { useGameState } from '../stores/game-store';
import type { Word } from '../types';
import { LANGUAGES } from '../utils/languages';

// Mock crypto.randomUUID
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => Math.random().toString(36).substring(7),
    },
  });
}

describe('Game Store Logic', () => {
  beforeEach(() => {
    useGameState.getState().resetGame();
  });

  it('should handle duplicate words correctly by ID', () => {
    const wordList: Word[] = [
      { word: 'duplicate', prompt: 'prompt 1' },
      { word: 'duplicate', prompt: 'prompt 2' },
    ];
    const { startGame } = useGameState.getState();

    startGame(wordList, LANGUAGES[0]);

    const stateAfterStart = useGameState.getState();
    expect(stateAfterStart.pendingWords).toHaveLength(2);

    const word1 = stateAfterStart.pendingWords[0];
    const word2 = stateAfterStart.pendingWords[1];

    expect(word1.word).toBe('duplicate');
    expect(word2.word).toBe('duplicate');
    expect(word1.id).toBeDefined();
    expect(word2.id).toBeDefined();
    expect(word1.id).not.toBe(word2.id);

    // Answer the first one correctly
    useGameState.getState().correctAnswer(word1);

    const stateAfterAnswer = useGameState.getState();

    // Logic in game-store: if incorrectCount == 0, it is completed immediately.
    // So word1 should be in completedWords.
    // word2 should still be in pendingWords.

    expect(stateAfterAnswer.completedWords).toHaveLength(1);
    expect(stateAfterAnswer.completedWords[0].id).toBe(word1.id);

    expect(stateAfterAnswer.pendingWords).toHaveLength(1);
    expect(stateAfterAnswer.pendingWords[0].id).toBe(word2.id);
  });
});
