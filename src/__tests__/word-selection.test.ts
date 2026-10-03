import { describe, expect, it } from 'vitest';

import { updateWordTier, type WordTier } from '../utils/word-history';
import { selectWordsForSession } from '../utils/word-selection';

const SET_ID = 'test-set';

function seedTiers(tiers: Record<string, WordTier>) {
  for (const [word, tier] of Object.entries(tiers)) {
    updateWordTier(SET_ID, word, tier);
  }
}

function select(words: string[], count: number): string[] {
  return selectWordsForSession(
    SET_ID,
    words.map((word) => ({ word })),
    count,
  ).map((input) => input.word);
}

describe('selectWordsForSession', () => {
  it('returns all words when the set is not larger than the requested count', () => {
    expect(select(['a', 'b', 'c'], 3).sort()).toEqual(['a', 'b', 'c']);
  });

  it('takes not-seen words in set order', () => {
    expect(select(['a', 'b', 'c', 'd', 'e'], 3).sort()).toEqual(['a', 'b', 'c']);
  });

  it('caps learning words at the rounded-down half of the count', () => {
    seedTiers({ l1: 'learning', l2: 'learning', l3: 'learning' });

    const selected = select(['l1', 'l2', 'l3', 'n1', 'n2', 'n3', 'n4'], 5);

    expect(selected).toHaveLength(5);
    expect(selected.filter((word) => word.startsWith('l'))).toHaveLength(2);
    expect(selected.filter((word) => word.startsWith('n')).sort()).toEqual(['n1', 'n2', 'n3']);
  });

  it('prefers not-seen words over learning words for a single-word session', () => {
    seedTiers({ l1: 'learning' });

    expect(select(['l1', 'n1'], 1)).toEqual(['n1']);
  });

  it('fills with extra learning words when not-seen words run out', () => {
    seedTiers({ l1: 'learning', l2: 'learning', l3: 'learning', k1: 'known' });

    expect(select(['l1', 'l2', 'l3', 'n1', 'k1'], 4).sort()).toEqual(['l1', 'l2', 'l3', 'n1']);
  });

  it('uses known words only as a last resort', () => {
    seedTiers({ l1: 'learning', k1: 'known', k2: 'known', k3: 'known' });

    const selected = select(['l1', 'n1', 'k1', 'k2', 'k3'], 3);

    expect(selected).toEqual(expect.arrayContaining(['l1', 'n1']));
    expect(selected.filter((word) => word.startsWith('k'))).toHaveLength(1);
  });
});
