import type { Language } from './utils/languages';

export interface WordResult {
  word: string;
  isCorrect: boolean;
}

export interface WordState {
  word: string;
  correctStreak: number;
  incorrectCount: number;
}

export interface GameState {
  queue: WordState[];
  results: WordResult[];
  completedWords: WordState[];
  language: Language;
}
