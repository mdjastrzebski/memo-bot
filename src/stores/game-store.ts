import { create } from 'zustand';

import type { Word, WordState } from '../types';
import { shuffleArray } from '../utils/data';
import { type Language, LANGUAGES } from '../utils/languages';

const STREAK_GOAL_AFTER_INCORRECT = 2;
const SCHEDULE_AFTER_CORRECT = 3;
const SCHEDULE_AFTER_INCORRECT = 1;

export interface GameState {
  pendingWords: WordState[];
  completedWords: WordState[];
  language: Language;
  ignoreAccents: boolean;
}

export interface GameActions {
  startGame: (words: Word[], language: Language) => void;
  resetGame: () => void;
  correctAnswer: (word: WordState) => void;
  incorrectAnswer: (word: WordState) => void;
  skipWord: (word: WordState) => void;
}

export const useGameState = create<GameState & GameActions>((set) => ({
  pendingWords: [],
  completedWords: [],
  language: LANGUAGES[0],
  ignoreAccents: false,

  startGame: (words, language) => {
    const initialQueue = shuffleArray(
      words.map(({ word, prompt }) => ({
        word,
        prompt,
        correctStreak: 0,
        incorrectCount: 0,
      })),
    );

    set({
      pendingWords: initialQueue,
      completedWords: [],
      language,
      ignoreAccents: false,
    });
  },

  resetGame: () => {
    set({
      pendingWords: [],
      completedWords: [],
    });
  },

  correctAnswer: (word: WordState) => {
    set((state: GameState & GameActions) => {
      const remainingWords = state.pendingWords.filter((w) => w.word !== word.word);
      const updatedWord: WordState = {
        ...word,
        correctStreak: word.correctStreak + 1,
      };

      const isCompleted =
        (updatedWord.correctStreak === 1 && updatedWord.incorrectCount === 0) ||
        updatedWord.correctStreak >= STREAK_GOAL_AFTER_INCORRECT;
      if (isCompleted) {
        return {
          ...state,
          pendingWords: remainingWords,
          completedWords: [...state.completedWords, updatedWord],
        };
      }

      const insertPosition = Math.min(SCHEDULE_AFTER_CORRECT - 1, remainingWords.length);
      remainingWords.splice(insertPosition, 0, updatedWord);

      return {
        ...state,
        pendingWords: remainingWords,
      };
    });
  },

  incorrectAnswer: (word: WordState) => {
    set((state) => {
      const remainingWords = state.pendingWords.filter((w) => w.word !== word.word);
      const updatedWord: WordState = {
        ...word,
        correctStreak: 0,
        incorrectCount: word.incorrectCount + 1,
      };

      const insertPosition = Math.min(SCHEDULE_AFTER_INCORRECT - 1, remainingWords.length);
      remainingWords.splice(insertPosition, 0, updatedWord);

      return {
        ...state,
        pendingWords: remainingWords,
      };
    });
  },

  skipWord: (word: WordState) => {
    set((state: GameState & GameActions) => {
      const skippedWord: WordState = { ...word, skipped: true };
      return {
        ...state,
        pendingWords: state.pendingWords.filter((w) => w.word !== word.word),
        completedWords: [...state.completedWords, skippedWord],
      };
    });
  },
}));
