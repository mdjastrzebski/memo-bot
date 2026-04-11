import { shuffleArray } from './data';
import { normalizeInputText } from './text-normalization';

export interface WordSetConfig {
  id: string;
  name: string;
  url: string;
  languageCode: string;
}

const WORD_SET_CONFIG_URL = '/word-sets/config.json';
const WORD_SET_FETCH_RETRY_DELAYS_MS = [300, 1000];

let wordSetConfigsPromise: Promise<WordSetConfig[]> | null = null;

const wordSetWordsCache = new Map<string, Promise<string[]>>();

export const WORD_SET_SAMPLE_SIZES = [5, 10, 25, 50, 100] as const;

export function resetWordSetCache() {
  wordSetConfigsPromise = null;
  wordSetWordsCache.clear();
}

export async function getWordSetConfigs(): Promise<WordSetConfig[]> {
  if (!wordSetConfigsPromise) {
    wordSetConfigsPromise = loadWordSetConfigs();
  }

  try {
    return await wordSetConfigsPromise;
  } catch (error) {
    wordSetConfigsPromise = null;
    throw error;
  }
}

export async function getWordSetWords(config: WordSetConfig): Promise<string[]> {
  const cached = wordSetWordsCache.get(config.id);
  if (cached) {
    return cached;
  }

  const promise = loadWordSetWords(config.url);
  wordSetWordsCache.set(config.id, promise);

  try {
    return await promise;
  } catch (error) {
    wordSetWordsCache.delete(config.id);
    throw error;
  }
}

export function parseWordSetText(text: string): string[] {
  const seen = new Set<string>();
  const words: string[] = [];

  for (const line of normalizeInputText(text).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    words.push(trimmed);
  }

  return words;
}

export function sampleWordSetWords(words: string[], requestedSize: number): string[] {
  const sampleSize = Math.min(requestedSize, words.length);
  return shuffleArray(words).slice(0, sampleSize);
}

async function loadWordSetConfigs(): Promise<WordSetConfig[]> {
  const response = await fetch(WORD_SET_CONFIG_URL);
  if (!response.ok) {
    throw new Error(`Failed to load word set config (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Invalid word set config format');
  }

  return data.map(parseWordSetConfig);
}

async function loadWordSetWords(url: string): Promise<string[]> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= WORD_SET_FETCH_RETRY_DELAYS_MS.length; attempt += 1) {
    if (attempt > 0) {
      await delay(WORD_SET_FETCH_RETRY_DELAYS_MS[attempt - 1]);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load word set (${response.status})`);
      }

      const text = await response.text();
      return parseWordSetText(text);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to load word set');
}

function parseWordSetConfig(entry: unknown): WordSetConfig {
  if (typeof entry !== 'object' || entry === null) {
    throw new Error('Invalid word set config entry');
  }

  const config = entry as Record<string, unknown>;
  if (
    typeof config.id !== 'string' ||
    typeof config.name !== 'string' ||
    typeof config.url !== 'string' ||
    typeof config.languageCode !== 'string'
  ) {
    throw new Error('Invalid word set config entry');
  }

  return {
    id: config.id,
    name: config.name,
    url: config.url,
    languageCode: config.languageCode,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
