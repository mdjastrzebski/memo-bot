export interface Word {
  word: string;
  prompt?: string;
}

export interface WordResult extends Word {
  isCorrect: boolean;
  skipped?: boolean;
}

export interface WordState extends Word {
  correctStreak: number;
  incorrectCount: number;
  skipped?: boolean;
}
