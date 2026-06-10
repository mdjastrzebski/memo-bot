export const EXERCISES = ['dictation', 'prompt'] as const;

export type Exercise = (typeof EXERCISES)[number];

export interface Word {
  word: string;
  prompt?: string;
  exercise: Exercise;
}

export interface WordInput {
  word: string;
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
