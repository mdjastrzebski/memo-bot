import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import InputScreen from '../screens/input-screen';
import { useGameState } from '../stores/game-store';
import { LANGUAGES } from '../utils/languages';

// Mock speech synthesis
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
} as unknown as SpeechSynthesis;

describe('InputScreen', () => {
  beforeEach(() => {
    useGameState.getState().resetGame();
    useGameState.getState().resetSetupPreferences();
  });

  it('allows user to enter words and start the game in relaxed mode', async () => {
    const user = userEvent.setup();
    render(<InputScreen />);

    const textarea = screen.getByPlaceholderText(/Enter one word per line/i);
    const launchButton = screen.getByRole('button', { name: /Launch Mission/i });

    expect(launchButton).toBeDisabled();
    expect(screen.queryByRole('radio', { name: /Word set/i })).not.toBeInTheDocument();

    await user.type(textarea, 'hello\nworld\ntest');
    await user.click(launchButton);

    const state = useGameState.getState();
    expect(state.pendingWords).toHaveLength(3);
    expect(state.pendingWords.map((word) => word.word).sort()).toEqual(['hello', 'test', 'world']);
    expect(state.setup.languageCode).toBe(LANGUAGES[0].code);
    expect(state.setup.difficulty).toBe('relaxed');
    expect(state.setup.mode).toBe('typing');
  });

  it('parses words with optional prompts in relaxed mode', async () => {
    const user = userEvent.setup();
    render(<InputScreen />);

    const textarea = screen.getByPlaceholderText(/Enter one word per line/i);
    await user.type(textarea, 'hello|Say hello\nworld\nbonjour|Say bonjour');

    await user.click(screen.getByRole('button', { name: /Launch Mission/i }));

    const state = useGameState.getState();
    const words = state.pendingWords.map((word) => ({ word: word.word, prompt: word.prompt }));
    expect(words.sort((a, b) => a.word.localeCompare(b.word))).toEqual(
      [
        { word: 'bonjour', prompt: 'Say bonjour' },
        { word: 'hello', prompt: 'Say hello' },
        { word: 'world', prompt: undefined },
      ].sort((a, b) => a.word.localeCompare(b.word)),
    );
  });

  it('ignores prompts in strict mode', async () => {
    const user = userEvent.setup();
    render(<InputScreen />);

    await user.click(screen.getByLabelText(/Strict/i));

    const textarea = screen.getByPlaceholderText(/Enter one word per line/i);
    await user.type(textarea, 'żółw|Helpful hint');
    await user.click(screen.getByRole('button', { name: /Launch Mission/i }));

    const state = useGameState.getState();
    expect(state.setup.difficulty).toBe('strict');
    expect(state.setup.mode).toBe('typing');
    expect(state.pendingWords).toHaveLength(1);
    expect(state.pendingWords[0].word).toBe('żółw');
    expect(state.pendingWords[0].prompt).toBeUndefined();
  });

  it('shows word-set controls for languages with configured sets and starts from the selected set', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/word-sets/config.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'en-set',
              name: 'Common tricky words',
              url: '/word-sets/en-set.txt',
              languageCode: 'en-GB',
            },
          ],
        } as Response;
      }

      if (url.endsWith('/word-sets/en-set.txt')) {
        return {
          ok: true,
          status: 200,
          text: async () => 'colour\nfriend\nenough',
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        text: async () => '',
      } as Response;
    });

    render(<InputScreen />);

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Word set/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('radio', { name: /Word set/i }));
    expect(screen.getAllByText(/Common tricky words/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('slider', { name: /Session Size/i })).toBeInTheDocument();
    expect(screen.getAllByText(/5 words/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Launch Mission/i }));

    await waitFor(() => {
      expect(useGameState.getState().pendingWords).toHaveLength(3);
    });

    const state = useGameState.getState();
    expect(state.setup.languageCode).toBe('en-GB');
    expect(state.pendingWords.map((word) => word.word).sort()).toEqual([
      'colour',
      'enough',
      'friend',
    ]);
  });

  it('restores saved setup preferences from local storage', async () => {
    vi.mocked(fetch).mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/word-sets/config.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'en-set-1',
              name: 'Common tricky words',
              url: '/word-sets/en-set-1.txt',
              languageCode: 'en-GB',
            },
            {
              id: 'en-set-2',
              name: 'Animals',
              url: '/word-sets/en-set-2.txt',
              languageCode: 'en-GB',
            },
          ],
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        text: async () => '',
      } as Response;
    });

    window.localStorage.setItem(
      'memo-bot-setup-preferences',
      JSON.stringify({
        state: {
          setup: {
            languageCode: 'en-GB',
            difficulty: 'strict',
            mode: 'typing',
            source: 'word-set',
            manualText: 'otter|Helpful prompt',
            sampleSize: 25,
            selectedWordSetId: 'en-set-2',
          },
        },
        version: 0,
      }),
    );

    await useGameState.persist.rehydrate();

    render(<InputScreen />);

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Word set/i })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    expect(screen.getByRole('radio', { name: /Strict/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(LANGUAGES[0].name)).toBeInTheDocument();
    expect(screen.getAllByText(/25 words/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Animals/i).length).toBeGreaterThan(0);
    expect(useGameState.getState().setup.manualText).toBe('otter|Helpful prompt');
  });

  it('preserves the selected word-set size when toggling sources', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/word-sets/config.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'en-set',
              name: 'Common tricky words',
              url: '/word-sets/en-set.txt',
              languageCode: 'en-GB',
            },
          ],
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        text: async () => '',
      } as Response;
    });

    render(<InputScreen />);

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Word set/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('radio', { name: /Word set/i }));
    await user.click(screen.getByRole('button', { name: '25' }));
    await user.click(screen.getByRole('radio', { name: /My words/i }));
    await user.click(screen.getByRole('radio', { name: /Word set/i }));

    expect(screen.getAllByText(/25 words/i).length).toBeGreaterThan(0);
    expect(useGameState.getState().setup.sampleSize).toBe(25);
  });

  it('falls back to manual mode when saved word-set source is unavailable for the language', async () => {
    window.localStorage.setItem(
      'memo-bot-setup-preferences',
      JSON.stringify({
        state: {
          setup: {
            languageCode: 'pl-PL',
            difficulty: 'relaxed',
            mode: 'typing',
            source: 'word-set',
            manualText: 'żółw',
            sampleSize: 10,
            selectedWordSetId: 'missing-set',
          },
        },
        version: 0,
      }),
    );

    await useGameState.persist.rehydrate();

    render(<InputScreen />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter one word per line/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole('radio', { name: /Word set/i })).not.toBeInTheDocument();
    expect(useGameState.getState().setup.source).toBe('manual');
    expect(useGameState.getState().setup.selectedWordSetId).toBe('missing-set');
  });

  it('unmounts manual controls when the word-set source is selected', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/word-sets/config.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'en-set',
              name: 'Common tricky words',
              url: '/word-sets/en-set.txt',
              languageCode: 'en-GB',
            },
          ],
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        text: async () => '',
      } as Response;
    });

    render(<InputScreen />);

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Word set/i })).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/Enter one word per line/i)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Word set/i }));

    expect(screen.queryByPlaceholderText(/Enter one word per line/i)).not.toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /Session Size/i })).toBeInTheDocument();
  });

  it('disables manual start when no words are entered', () => {
    render(<InputScreen />);

    expect(screen.getByRole('button', { name: /Launch Mission/i })).toBeDisabled();
  });
});
