import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import QuestionScreen from '../screens/question-screen';
import { useGameState } from '../stores/game-store';
import { LANGUAGES } from '../utils/languages';

// Mock sounds
vi.mock('../utils/sounds', () => ({
  playCorrect: vi.fn(),
  playWrong: vi.fn(),
  playCompleted: vi.fn(),
}));

// Mock speech synthesis
const mockSpeak = vi.fn();
global.speechSynthesis = {
  speak: mockSpeak,
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
} as unknown as SpeechSynthesis;

global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
  text,
  lang: '',
  rate: 1,
  pitch: 1,
}));

// Mock Audio
global.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn(),
  volume: 0.5,
}));

describe('QuestionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameState.getState().resetGame();
    // Start a game with test words
    useGameState.getState().startGame(
      [{ word: 'hello', prompt: undefined }],
      LANGUAGES[0],
    );
  });

  it('allows user to submit correct answer and see success feedback', async () => {
    const user = userEvent.setup();
    render(<QuestionScreen />);

    // Find the input field
    const input = screen.getByPlaceholderText(/Type here/i);
    expect(input).toBeInTheDocument();

    // Type the correct answer and submit
    await user.type(input, 'hello{Enter}');

    // Should show "Correct!" feedback
    expect(await screen.findByText(/Correct!/i)).toBeInTheDocument();

    // Verify the word was marked as correct in the store
    await waitFor(
      () => {
        const state = useGameState.getState();
        // Word should be moved to completed after the timeout
        expect(state.completedWords.length).toBeGreaterThan(0);
      },
      { timeout: 1500 },
    );
  });

  it('shows retry feedback when user submits incorrect answer', async () => {
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);

    // Type an incorrect answer and submit
    await user.type(input, 'wrong{Enter}');

    // Should show "Try again!" feedback
    expect(await screen.findByText(/Try again!/i)).toBeInTheDocument();

    // Input should be cleared and ready for retry
    const retryInput = screen.getByPlaceholderText(/Type it again/i);
    expect(retryInput).toBeInTheDocument();
    expect(retryInput).toHaveValue('');

    // Word should still be in pending (not completed)
    const state = useGameState.getState();
    expect(state.pendingWords.length).toBeGreaterThan(0);
  });

  it('normalizes input by trimming punctuation and spacing', async () => {
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);

    // Type answer with extra punctuation and spacing that should be normalized, then submit
    await user.type(input, 'hello.  {Enter}');

    // Should still be marked as correct due to normalization
    expect(await screen.findByText(/Correct!/i)).toBeInTheDocument();
  });

  it('allows user to skip word with confirmation', async () => {
    const user = userEvent.setup();
    // Mock window.confirm to return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<QuestionScreen />);

    // Find and click skip button
    const skipButton = screen.getByRole('button', { name: /Skip/i });
    await user.click(skipButton);

    // Should show confirmation dialog
    expect(confirmSpy).toHaveBeenCalledWith('Skip this word?');

    // Word should be skipped (moved to completed)
    await waitFor(() => {
      const state = useGameState.getState();
      expect(state.completedWords.length).toBeGreaterThan(0);
    });

    // Verify the skipped flag is set
    const state = useGameState.getState();
    expect(state.completedWords[0].skipped).toBe(true);

    confirmSpy.mockRestore();
  });

  it('does not skip word when user cancels confirmation', async () => {
    const user = userEvent.setup();
    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<QuestionScreen />);

    const skipButton = screen.getByRole('button', { name: /Skip/i });
    await user.click(skipButton);

    // Should show confirmation dialog
    expect(confirmSpy).toHaveBeenCalledWith('Skip this word?');

    // Word should NOT be skipped (still in pending)
    const state = useGameState.getState();
    expect(state.pendingWords.length).toBeGreaterThan(0);
    expect(state.completedWords.length).toBe(0);

    confirmSpy.mockRestore();
  });

  it('allows user to replay word by clicking play button', async () => {
    const user = userEvent.setup();
    render(<QuestionScreen />);

    // Find play button using aria-label
    const playButton = screen.getByRole('button', { name: /Play word/i });
    await user.click(playButton);

    // Should call speak with the word
    expect(mockSpeak).toHaveBeenCalled();
  });

  it('displays text prompt when word has prompt instead of speaking', () => {
    useGameState.getState().resetGame();
    useGameState.getState().startGame(
      [{ word: 'hello', prompt: 'Say hello' }],
      LANGUAGES[0],
    );

    render(<QuestionScreen />);

    // Should show prompt text instead of speaking
    expect(screen.getByText(/Say hello/i)).toBeInTheDocument();
    // Play button should not be visible initially when there's a prompt (showPlayButton is false)
    expect(screen.queryByRole('button', { name: /Play word/i })).not.toBeInTheDocument();
  });

  it('shows WordDiff when answer is incorrect', async () => {
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);

    // Type incorrect answer and submit
    await user.type(input, 'wrong{Enter}');

    // Should show WordDiff component with expected and actual
    expect(await screen.findByText(/Try again!/i)).toBeInTheDocument();

    // WordDiff should be rendered (it shows the expected word)
    expect(screen.getByText(/hello/i)).toBeInTheDocument();
  });

  it('accepts answer with different accents when ignoreAccents is enabled', async () => {
    const user = userEvent.setup();
    // Start game with accented word
    useGameState.getState().startGame(
      [{ word: 'café', prompt: undefined }],
      LANGUAGES[0],
    );
    // Set ignoreAccents to true AFTER startGame (since startGame resets it to false)
    useGameState.setState({ ignoreAccents: true });

    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);

    // Type answer without accent (should be accepted when ignoreAccents is true)
    await user.type(input, 'cafe{Enter}');

    // Should be marked as correct due to accent-insensitive matching
    expect(await screen.findByText(/Correct!/i)).toBeInTheDocument();
  });

  it('calls incorrectAnswer when user corrects answer on retry', async () => {
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);
    const initialState = useGameState.getState();
    const initialPendingCount = initialState.pendingWords.length;

    // Submit incorrect answer first
    await user.type(input, 'wrong{Enter}');
    expect(await screen.findByText(/Try again!/i)).toBeInTheDocument();

    // Now submit correct answer on retry
    const retryInput = screen.getByPlaceholderText(/Type it again/i);
    await user.type(retryInput, 'hello{Enter}');

    // Should show "Correct!" feedback
    expect(await screen.findByText(/Correct!/i)).toBeInTheDocument();

    // After timeout, should call incorrectAnswer (not correctAnswer) because it was wrong first
    // Word should still be in pending (not completed) because it was wrong first
    await waitFor(
      () => {
        const state = useGameState.getState();
        const word = state.pendingWords.find((w) => w.word === 'hello');
        expect(word?.incorrectCount).toBeGreaterThan(0);
      },
      { timeout: 1500 },
    );

    // Verify word is still in pending (not completed)
    const state = useGameState.getState();
    expect(state.pendingWords.length).toBe(initialPendingCount);
    const word = state.pendingWords.find((w) => w.word === 'hello');
    expect(word).toBeDefined();
    expect(word!.incorrectCount).toBe(1);
  });
});
