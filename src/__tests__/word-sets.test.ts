import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getWordSetConfigs,
  getWordSetWords,
  parseWordSetText,
  resetWordSetCache,
} from '../utils/word-sets';

describe('word sets', () => {
  beforeEach(() => {
    resetWordSetCache();
  });

  it('parses word-set files by ignoring comments, blank lines, and duplicates', () => {
    expect(parseWordSetText('# comment\nżółw\n\nżółw\nwiewiórka\n')).toEqual(['żółw', 'wiewiórka']);
  });

  it('preserves multi-word phrases in word-set files', () => {
    expect(parseWordSetText('ja pracuję\nja rysuję\n')).toEqual(['ja pracuję', 'ja rysuję']);
  });

  it('retries loading a word-set file before succeeding and caches the parsed words', async () => {
    vi.useFakeTimers();

    vi.mocked(fetch).mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/word-sets/config.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'pl-set',
              name: 'Polish set',
              url: '/word-sets/pl-set.txt',
              languageCode: 'pl-PL',
            },
          ],
        } as Response;
      }

      const attempts = vi
        .mocked(fetch)
        .mock.calls.filter(([calledUrl]) =>
          String(calledUrl).endsWith('/word-sets/pl-set.txt'),
        ).length;

      if (attempts < 3) {
        throw new Error('temporary failure');
      }

      return {
        ok: true,
        status: 200,
        text: async () => 'żółw\nwiewiórka',
      } as Response;
    });

    const [config] = await getWordSetConfigs();
    const wordsPromise = getWordSetWords(config);

    await vi.runAllTimersAsync();

    await expect(wordsPromise).resolves.toEqual(['żółw', 'wiewiórka']);
    await expect(getWordSetWords(config)).resolves.toEqual(['żółw', 'wiewiórka']);

    expect(
      vi
        .mocked(fetch)
        .mock.calls.filter(([calledUrl]) => String(calledUrl).endsWith('/word-sets/pl-set.txt')),
    ).toHaveLength(3);

    vi.useRealTimers();
  });

  it('allows config loading to recover after an initial failure', async () => {
    let configAttempts = 0;

    vi.mocked(fetch).mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (!url.endsWith('/word-sets/config.json')) {
        return {
          ok: false,
          status: 404,
          text: async () => '',
        } as Response;
      }

      configAttempts += 1;
      if (configAttempts === 1) {
        throw new Error('temporary failure');
      }

      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'pl-set',
            name: 'Polish set',
            url: '/word-sets/pl-set.txt',
            languageCode: 'pl-PL',
          },
        ],
      } as Response;
    });

    await expect(getWordSetConfigs()).rejects.toThrow('temporary failure');
    await expect(getWordSetConfigs()).resolves.toEqual([
      {
        id: 'pl-set',
        name: 'Polish set',
        url: '/word-sets/pl-set.txt',
        languageCode: 'pl-PL',
      },
    ]);
  });
});
