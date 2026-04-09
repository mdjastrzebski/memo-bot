export interface Word {
  word: string;
  prompt?: string;
}

export type ExerciseType = 'relaxed' | 'strict';

export interface WordState extends Word {
  id: string;
  correctStreak: number;
  incorrectCount: number;
  skipped?: boolean;
}

export type GameStatus = 'initial' | 'learning' | 'finished';
