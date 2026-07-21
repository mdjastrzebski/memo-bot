export const EXERCISES = ['dictation', 'prompt'] as const;

export type Exercise = (typeof EXERCISES)[number];

export interface Word {
  word: string;
  /** Spoken alongside the word in dictation exercises to disambiguate homophones (same language as the word). */
  hint?: string;
  /** Shown as on-screen text in prompt exercises (e.g. a translation); never spoken. */
  prompt?: string;
  exercise: Exercise;
}

export interface WordInput {
  word: string;
  hint?: string;
  prompt?: string;
}

export type Difficulty = 'relaxed' | 'strict';
export type InputSource = 'manual' | 'word-set';

export interface WordState extends Word {
  id: string;
  correctStreak: number;
  incorrectCount: number;
  skipped?: boolean;
}

export type GameStatus = 'initial' | 'learning' | 'finished';

export interface SessionState {
  startedAt: number | null;
  endedAt: number | null;
  accumulatedActiveMs: number;
  activeSince: number | null;
  lastActivityAt: number | null;
  isPaused: boolean;
}
