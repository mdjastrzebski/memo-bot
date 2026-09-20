import type { WordInput } from '../types';
import { shuffleArray } from './data';
import { getWordTier, loadWordHistory, type WordTier } from './word-history';

// Relative likelihood of picking a word of each tier; higher = more likely.
export const WORD_TIER_SELECTION_WEIGHTS: Record<WordTier, number> = {
  'not-seen': 5,
  'learning': 3,
  'known': 1,
};

function weightedSampleWithoutReplacement<T>(items: T[], weights: number[], count: number): T[] {
  const pool = items.map((item, index) => ({ item, weight: weights[index] }));
  const picked: T[] = [];

  while (pool.length > 0 && picked.length < count) {
    const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let target = Math.random() * totalWeight;

    let selectedIndex = pool.length - 1;
    for (let i = 0; i < pool.length; i += 1) {
      target -= pool[i].weight;
      if (target <= 0) {
        selectedIndex = i;
        break;
      }
    }

    picked.push(pool[selectedIndex].item);
    pool.splice(selectedIndex, 1);
  }

  return picked;
}

// Weighted sampling favoring not-yet-seen and still-learning words over known ones.
export function selectWordsForSession(
  wordSetId: string,
  wordInputs: WordInput[],
  count: number,
): WordInput[] {
  if (wordInputs.length <= count) {
    return shuffleArray(wordInputs);
  }

  const history = loadWordHistory(wordSetId);
  const weights = wordInputs.map(
    (wordInput) => WORD_TIER_SELECTION_WEIGHTS[getWordTier(history, wordInput.word)],
  );

  return weightedSampleWithoutReplacement(wordInputs, weights, count);
}
