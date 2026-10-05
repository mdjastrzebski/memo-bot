import type { WordInput } from '../types';
import { shuffleArray } from './data';
import { getWordTier, loadWordHistory } from './word-history';

// While not-seen words remain, priority order is: up to half from the learning
// tier, then not-seen words in set order (not randomized), then leftover learning
// words, then known words as a last resort.
//
// Once every word has been seen, the session mixes in known words for review:
// 25% (rounded down) from the known tier and 75% (rounded up) from the learning
// tier, with either tier filling any shortfall of the other.
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
  const shuffledKnown = shuffleArray(known);

  if (notSeen.length === 0) {
    return shuffleArray(selectReviewWords(shuffledLearning, shuffledKnown, count));
  }

  const learningTarget = Math.floor(count / 2);

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
    selected.push(...shuffledKnown.slice(0, count - selected.length));
  }

  return shuffleArray(selected);
}

function selectReviewWords(learning: WordInput[], known: WordInput[], count: number): WordInput[] {
  const knownTarget = Math.min(Math.floor(count / 4), known.length);
  const learningTarget = Math.min(count - knownTarget, learning.length);

  const selected = [...learning.slice(0, learningTarget), ...known.slice(0, knownTarget)];

  // Not enough learning words to fill the rest: top up with more known words.
  if (selected.length < count) {
    selected.push(...known.slice(knownTarget, knownTarget + (count - selected.length)));
  }

  return selected;
}
