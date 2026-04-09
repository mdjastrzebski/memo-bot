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
    expect(state.language).toEqual(LANGUAGES[0]);
    expect(state.exerciseType).toBe('relaxed');
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
    expect(state.exerciseType).toBe('strict');
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
    expect(state.language.code).toBe('en-GB');
    expect(state.pendingWords.map((word) => word.word).sort()).toEqual([
      'colour',
      'enough',
      'friend',
    ]);
  });

  it('disables manual start when no words are entered', () => {
    render(<InputScreen />);

    expect(screen.getByRole('button', { name: /Launch Mission/i })).toBeDisabled();
  });
});
