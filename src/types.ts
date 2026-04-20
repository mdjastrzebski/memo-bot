export interface Word {
  word: string;
  prompt?: string;
}

export type Difficulty = 'relaxed' | 'strict';
export type PracticeMode = 'typing' | 'pronunciation';
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
