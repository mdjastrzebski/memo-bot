import type { WordInput } from '../types';
import { shuffleArray } from './data';
import { getWordTier, loadWordHistory } from './word-history';

// Priority order: up to half from the learning tier, then not-seen words in
// set order (not randomized), then leftover learning words, then known words
// as a last resort.
export function selectWordsForSession(
  wordSetId: string,
  wordInputs: WordInput[],
  count: number,
): WordInput[] {
  if (wordInputs.length <= count) {
    return shuffleArray(wordInputs);
  }

  const history = loadWordHistory(wordSetId);

  const notSeen: WordInput[] = [];
  const learning: WordInput[] = [];
  const known: WordInput[] = [];
  for (const wordInput of wordInputs) {
    const tier = getWordTier(history, wordInput.word);
    if (tier === 'not-seen') {
      notSeen.push(wordInput);
    } else if (tier === 'learning') {
      learning.push(wordInput);
    } else {
      known.push(wordInput);
    }
  }

  const shuffledLearning = shuffleArray(learning);
  const learningTarget = Math.ceil(count / 2);

  const selected: WordInput[] = shuffledLearning.slice(0, learningTarget);
  selected.push(...notSeen.slice(0, count - selected.length));

  // Not enough not-seen words to fill the rest: pull in remaining learning words first.
  if (selected.length < count) {
    selected.push(
      ...shuffledLearning.slice(learningTarget, learningTarget + (count - selected.length)),
    );
  }

  // Still short: only now fall back to already-known words.
  if (selected.length < count) {
    selected.push(...shuffleArray(known).slice(0, count - selected.length));
  }

  return shuffleArray(selected);
}
