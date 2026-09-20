// Persists per-word learning tiers across sessions, keyed by word set. Entries for words
// removed from a set are kept in case the word is re-added.

export type WordTier = 'not-seen' | 'learning' | 'known';

export interface WordHistoryEntry {
  tier: WordTier;
  updatedAt: number;
}

export type WordHistoryStore = Record<string, WordHistoryEntry>;

const WORD_HISTORY_KEY_PREFIX = 'memobot:set:history:';
const WORD_TIERS: WordTier[] = ['not-seen', 'learning', 'known'];

function getWordHistoryStorageKey(wordSetId: string): string {
  return `${WORD_HISTORY_KEY_PREFIX}${wordSetId}`;
}

function isWordTier(value: unknown): value is WordTier {
  return typeof value === 'string' && WORD_TIERS.includes(value as WordTier);
}

function sanitizeWordHistory(value: unknown): WordHistoryStore {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const store: WordHistoryStore = {};
  for (const [word, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }

    const { tier, updatedAt } = entry as Record<string, unknown>;
    if (isWordTier(tier) && typeof updatedAt === 'number') {
      store[word] = { tier, updatedAt };
    }
  }

  return store;
}

export function loadWordHistory(wordSetId: string): WordHistoryStore {
  try {
    const raw = window.localStorage.getItem(getWordHistoryStorageKey(wordSetId));
    if (!raw) {
      return {};
    }

    return sanitizeWordHistory(JSON.parse(raw));
  } catch {
    return {};
  }
}

function saveWordHistory(wordSetId: string, history: WordHistoryStore): void {
  try {
    window.localStorage.setItem(getWordHistoryStorageKey(wordSetId), JSON.stringify(history));
  } catch {
    // localStorage unavailable or full; fail silently.
  }
}

export function getWordTier(history: WordHistoryStore, word: string): WordTier {
  return history[word]?.tier ?? 'not-seen';
}

export function updateWordTier(wordSetId: string, word: string, tier: WordTier): void {
  const history = loadWordHistory(wordSetId);
  history[word] = { tier, updatedAt: Date.now() };
  saveWordHistory(wordSetId, history);
}
