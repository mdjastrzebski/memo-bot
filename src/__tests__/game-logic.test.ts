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

  it('should reschedule words closer to front when answered incorrectly multiple times', () => {
    const wordList: Word[] = [
      { word: 'easy', prompt: undefined },
      { word: 'hard', prompt: undefined },
      { word: 'medium', prompt: undefined },
    ];
    const { startGame, incorrectAnswer } = useGameState.getState();

    startGame(wordList, LANGUAGES[0]);
    const initialState = useGameState.getState();
    const hardWord = initialState.pendingWords.find((w) => w.word === 'hard')!;

    // First incorrect answer - word goes to end of queue
    incorrectAnswer(hardWord);
    const afterFirstIncorrect = useGameState.getState();
    const lastWord = afterFirstIncorrect.pendingWords[afterFirstIncorrect.pendingWords.length - 1];
    expect(lastWord.id).toBe(hardWord.id);
    expect(lastWord.incorrectCount).toBe(1);

    // Second incorrect answer - word should be rescheduled to front (position 0)
    const hardWordAfterFirst = afterFirstIncorrect.pendingWords.find((w) => w.word === 'hard')!;
    incorrectAnswer(hardWordAfterFirst);
    const afterSecondIncorrect = useGameState.getState();
    expect(afterSecondIncorrect.pendingWords[0].id).toBe(hardWord.id);
    expect(afterSecondIncorrect.pendingWords[0].incorrectCount).toBe(2);
  });

  it('should complete word after achieving correct streak goal following incorrect answer', () => {
    const wordList: Word[] = [{ word: 'challenge', prompt: undefined }];
    const { startGame, incorrectAnswer, correctAnswer } = useGameState.getState();

    startGame(wordList, LANGUAGES[0]);
    const initialState = useGameState.getState();
    const challengeWord = initialState.pendingWords[0];

    // Answer incorrectly first
    incorrectAnswer(challengeWord);
    const afterIncorrect = useGameState.getState();
    const wordAfterIncorrect = afterIncorrect.pendingWords.find((w) => w.id === challengeWord.id)!;
    expect(wordAfterIncorrect.incorrectCount).toBe(1);
    expect(wordAfterIncorrect.correctStreak).toBe(0);
    expect(afterIncorrect.completedWords).toHaveLength(0);

    // Answer correctly once - should still be in pending (streak = 1, not enough)
    correctAnswer(wordAfterIncorrect);
    const afterFirstCorrect = useGameState.getState();
    const wordAfterFirstCorrect = afterFirstCorrect.pendingWords.find((w) => w.id === challengeWord.id)!;
    expect(wordAfterFirstCorrect.correctStreak).toBe(1);
    expect(wordAfterFirstCorrect.incorrectCount).toBe(1);
    expect(afterFirstCorrect.completedWords).toHaveLength(0);

    // Answer correctly second time - should be completed (streak = 2, meets goal)
    correctAnswer(wordAfterFirstCorrect);
    const afterSecondCorrect = useGameState.getState();
    expect(afterSecondCorrect.pendingWords.find((w) => w.id === challengeWord.id)).toBeUndefined();
    expect(afterSecondCorrect.completedWords).toHaveLength(1);
    expect(afterSecondCorrect.completedWords[0].id).toBe(challengeWord.id);
    expect(afterSecondCorrect.completedWords[0].correctStreak).toBe(2);
    expect(afterSecondCorrect.completedWords[0].incorrectCount).toBe(1);
  });
});
