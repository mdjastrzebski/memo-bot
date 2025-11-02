import type { Language } from './utils/languages';

export interface WordResult {
  word: string;
  prompt?: string;
  isCorrect: boolean;
  skipped?: boolean;
}

export interface WordState {
  word: string;
  prompt?: string;
  correctStreak: number;
  incorrectCount: number;
  skipped?: boolean;
}

export interface GameState {
  queue: WordState[];
  completedWords: WordState[];
  language: Language;
  ignoreAccents: boolean;
}
