import { create } from 'zustand';

import type { Word, WordState } from '../types';
import { shuffleArray } from '../utils/data';
import { generateId } from '../utils/id';
import { type Language, LANGUAGES } from '../utils/languages';

const STREAK_GOAL_AFTER_INCORRECT = 2;
const SCHEDULE_AFTER_CORRECT = 5;
const SCHEDULE_AFTER_INCORRECT = 0;

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
        id: generateId(),
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
      const updatedWord = { ...word, correctStreak: word.correctStreak + 1 };
      const otherWords = state.pendingWords.filter((w) => w.id !== word.id);

      const isCompleted =
        updatedWord.incorrectCount === 0 ||
        updatedWord.correctStreak >= STREAK_GOAL_AFTER_INCORRECT;
      if (isCompleted) {
        return {
          ...state,
          pendingWords: otherWords,
          completedWords: [...state.completedWords, updatedWord],
        };
      }

      const insertPosition = Math.min(SCHEDULE_AFTER_CORRECT, otherWords.length);
      otherWords.splice(insertPosition, 0, updatedWord);

      return {
        ...state,
        pendingWords: otherWords,
      };
    });
  },

  incorrectAnswer: (word: WordState) => {
    set((state) => {
      const otherWords = state.pendingWords.filter((w) => w.id !== word.id);
      const updatedWord: WordState = {
        ...word,
        correctStreak: 0,
        incorrectCount: word.incorrectCount + 1,
      };

      // In the first pass, go through all words. In subsequent passes, schedule the repetition closer.
      const isFirstAttempt = word.incorrectCount === 0;
      if (isFirstAttempt) {
        return {
          ...state,
          pendingWords: [...otherWords, updatedWord],
        };
      }

      const insertPosition = Math.min(SCHEDULE_AFTER_INCORRECT, otherWords.length);
      otherWords.splice(insertPosition, 0, updatedWord);
      return {
        ...state,
        pendingWords: otherWords,
      };
    });
  },

  skipWord: (word: WordState) => {
    set((state: GameState & GameActions) => {
      const skippedWord: WordState = { ...word, skipped: true };
      return {
        ...state,
        pendingWords: state.pendingWords.filter((w) => w.id !== word.id),
        completedWords: [...state.completedWords, skippedWord],
      };
    });
  },
}));
