import type { WordInput } from '../types';
import { shuffleArray } from './data';
import { getWordTier, loadWordHistory, type WordTier } from './word-history';

/**
 * Relative likelihood of picking a word of each tier for the next session. Higher = more
 * likely. Adjust freely to retune prioritization without touching the selection logic.
 */
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

/**
 * Sole entry point for deciding which words go into the next session for a word set.
 * Current policy: weighted random sampling that favors not-yet-seen words, then words still
 * being learned, then well-known words (see WORD_TIER_SELECTION_WEIGHTS) — using per-word
 * history persisted by ../utils/word-history. Swap this function's implementation to change
 * the policy; callers don't need to change.
 */
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
