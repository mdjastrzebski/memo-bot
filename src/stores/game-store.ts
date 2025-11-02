import { create } from 'zustand';

import type { Word, WordResult, WordState } from '../types';
import { type Language, LANGUAGES } from '../utils/languages';

const STREAK_GOAL_AFTER_INCORRECT = 2;
const SCHEDULE_AFTER_CORRECT = 3;
const SCHEDULE_AFTER_INCORRECT = 1;

export interface GameStore {
  pendingWords: WordState[];
  completedWords: WordState[];

  language: Language;
  ignoreAccents: boolean;
  // Actions
  startGame: (words: Word[], language: Language) => void;
  handleAnswer: (result: WordResult) => void;
  restart: () => void;
  // Computed selectors
  isSetupState: () => boolean;
  isResultsState: () => boolean;
  isLearningState: () => boolean;
  getCurrentWord: () => WordState | undefined;
  getRemainingCount: () => number;
  getCompletedCount: () => number;
}

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const useGameStore = create<GameStore>((set, get) => ({
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

  handleAnswer: (result) => {
    set((state) => {
      const [currentWord, ...remainingQueue] = state.pendingWords;

      // If word was skipped, mark it as skipped and move to completed
      if (result.skipped) {
        const skippedWord = { ...currentWord, skipped: true };
        return {
          ...state,
          pendingWords: remainingQueue,
          completedWords: [...state.completedWords, skippedWord],
        };
      }

      // Update the current word state based on the result
      const updatedWord: WordState = {
        ...currentWord,
        correctStreak: result.isCorrect ? currentWord.correctStreak + 1 : 0,
        incorrectCount: result.isCorrect
          ? currentWord.incorrectCount
          : currentWord.incorrectCount + 1,
      };

      const newQueue = [...remainingQueue];
      const newCompletedWords = [...state.completedWords];

      // If word has been answered correctly twice, move to completed
      if (
        (updatedWord.correctStreak === 1 && currentWord.incorrectCount === 0) ||
        updatedWord.correctStreak >= STREAK_GOAL_AFTER_INCORRECT
      ) {
        newCompletedWords.push(updatedWord);
      } else {
        const insertAfter = result.isCorrect ? SCHEDULE_AFTER_CORRECT : SCHEDULE_AFTER_INCORRECT;
        const insertPosition = Math.min(insertAfter - 1, newQueue.length);
        newQueue.splice(insertPosition, 0, updatedWord);
      }

      return {
        ...state,
        pendingWords: newQueue,
        completedWords: newCompletedWords,
      };
    });
  },

  restart: () => {
    set((state) => ({
      ...state,
      pendingWords: [],
      completedWords: [],
    }));
  },

  // Computed selectors
  isSetupState: () => {
    const state = get();
    return state.pendingWords.length === 0 && state.completedWords.length === 0;
  },

  isResultsState: () => {
    const state = get();
    return get().pendingWords.length === 0 && state.completedWords.length > 0;
  },

  isLearningState: () => {
    return get().pendingWords.length > 0;
  },

  getCurrentWord: () => {
    return get().pendingWords[0];
  },

  getRemainingCount: () => {
    return get().pendingWords.length;
  },

  getCompletedCount: () => {
    return get().completedWords.length;
  },
}));
