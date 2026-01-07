import { render, screen } from '@testing-library/react';
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
    // Reset the game state before each test
    useGameState.getState().resetGame();
  });

  it('allows user to enter words and start the game', async () => {
    const user = userEvent.setup();
    render(<InputScreen />);

    // Find the textarea and enter words
    const textarea = screen.getByPlaceholderText(/Enter words here/i);
    await user.type(textarea, 'hello\nworld\ntest');

    // Find and click the launch button
    const launchButton = screen.getByRole('button', { name: /Launch Mission/i });
    await user.click(launchButton);

    // Verify the game was started with the correct words (order may be shuffled)
    const state = useGameState.getState();
    expect(state.pendingWords).toHaveLength(3);
    const words = state.pendingWords.map((w) => w.word);
    expect(words.sort()).toEqual(['hello', 'test', 'world'].sort());
    expect(state.language).toEqual(LANGUAGES[0]);
  });

  it('uses default words when textarea is empty', async () => {
    const user = userEvent.setup();
    render(<InputScreen />);

    // Don't enter any text, just click launch
    const launchButton = screen.getByRole('button', { name: /Launch Mission/i });
    await user.click(launchButton);

    // Verify the game was started with default words (order may be shuffled)
    const state = useGameState.getState();
    expect(state.pendingWords).toHaveLength(5);
    const words = state.pendingWords.map((w) => w.word);
    expect(words.sort()).toEqual(['moon', 'robot', 'rocket', 'spaceship', 'star'].sort());
  });

  it('parses words with optional prompts using pipe separator', async () => {
    const user = userEvent.setup();
    render(<InputScreen />);

    const textarea = screen.getByPlaceholderText(/Enter words here/i);
    await user.type(textarea, 'hello|Say hello\nworld\nbonjour|Say bonjour');

    const launchButton = screen.getByRole('button', { name: /Launch Mission/i });
    await user.click(launchButton);

    // Verify words with prompts are parsed correctly (order may be shuffled)
    const state = useGameState.getState();
    expect(state.pendingWords).toHaveLength(3);
    const words = state.pendingWords.map((w) => ({ word: w.word, prompt: w.prompt }));
    const expectedWords = [
      { word: 'hello', prompt: 'Say hello' },
      { word: 'world', prompt: undefined },
      { word: 'bonjour', prompt: 'Say bonjour' },
    ];
    // Sort by word to compare regardless of shuffle order
    expect(words.sort((a, b) => a.word.localeCompare(b.word))).toEqual(
      expectedWords.sort((a, b) => a.word.localeCompare(b.word)),
    );
  });
});
