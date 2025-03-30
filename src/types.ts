import type { Language } from './utils/languages';

export interface WordResult {
  word: string;
  isCorrect: boolean;
  skipped?: boolean;
}

export interface WordState {
  word: string;
  correctStreak: number;
  incorrectCount: number;
  skipped?: boolean;
}

export type StudyMode = 'learn' | 'review';

export interface GameState {
  queue: WordState[];
  results: WordResult[];
  completedWords: WordState[];
  language: Language;
  mode: StudyMode;
  ignoreAccents: boolean;
}
