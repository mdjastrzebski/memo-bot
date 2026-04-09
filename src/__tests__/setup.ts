import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, vi } from 'vitest';

import { resetWordSetCache } from '../utils/word-sets';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

beforeEach(() => {
  resetWordSetCache();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/word-sets/config.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => [],
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        text: async () => '',
      } as Response;
    }),
  );
});

// Mock crypto.randomUUID for consistent test IDs
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => Math.random().toString(36).substring(7),
    },
  });
}

if (!global.ResizeObserver) {
  Object.defineProperty(global, 'ResizeObserver', {
    value: class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });
}
