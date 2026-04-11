import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, vi } from 'vitest';

import { resetSpeechServiceForTests } from '../utils/speech-service';
import { resetWordSetCache } from '../utils/word-sets';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
  resetSpeechServiceForTests();
});

beforeEach(() => {
  resetWordSetCache();
  resetSpeechServiceForTests();
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

if (!global.URL.createObjectURL) {
  Object.defineProperty(global.URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:mock-audio'),
  });
}

if (!global.URL.revokeObjectURL) {
  Object.defineProperty(global.URL, 'revokeObjectURL', {
    value: vi.fn(),
  });
}
