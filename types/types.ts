export interface WordResult {
  word: string
  correct: boolean
  attempt: string
}

export interface WordState {
  word: string
  correctStreak: number
  incorrectCount: number
}

export interface GameState {
  queue: WordState[]
  results: WordResult[]
  completedWords: WordState[]
}

