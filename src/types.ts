export interface Word {
  word: string;
  prompt?: string;
}

export interface WordState extends Word {
  correctStreak: number;
  incorrectCount: number;
  skipped?: boolean;
}

export type GameStatus = 'initial' | 'learning' | 'finished';
