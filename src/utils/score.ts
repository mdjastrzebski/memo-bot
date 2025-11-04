import type { WordState } from '../types';

export function compareWordScores(a: WordState, b: WordState): number {
  const scoreA = calculateWordScore(a);
  const scoreB = calculateWordScore(b);
  if (scoreA !== scoreB) {
    return scoreB - scoreA;
  }

  if (a.incorrectCount !== b.incorrectCount) {
    return a.incorrectCount - b.incorrectCount;
  }

  return a.word.localeCompare(b.word);
}

// Calculate scores
export function calculateWordScore(word: WordState): number {
  // If word was skipped, return 0
  if (word.skipped) {
    return 0;
  }

  // Base score is 100 points
  // Deduct 25 points for each mistake
  // If there were any mistakes, maximum score is 75
  if (word.incorrectCount > 0) {
    return Math.max(75 - (word.incorrectCount - 1) * 25, 10);
  }

  return 100;
}
