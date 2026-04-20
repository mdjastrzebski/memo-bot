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
    useGameState
      .getState()
      .startGame(
        [{ word: 'hello', prompt: undefined }],
        LANGUAGES[0],
        'relaxed',
        'typing',
        'manual',
      );
  });

  it('allows user to submit correct answer and see success feedback', async () => {
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);
    expect(input).toBeInTheDocument();

    await user.type(input, 'hello{Enter}');

    expect(await screen.findByText(/Correct!/i)).toBeInTheDocument();

    await waitFor(
      () => {
        const state = useGameState.getState();
        expect(state.completedWords.length).toBeGreaterThan(0);
      },
      { timeout: 1500 },
    );
  });

  it('shows retry feedback when user submits incorrect answer', async () => {
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);

    await user.type(input, 'wrong{Enter}');

    expect(await screen.findByText(/Try again!/i)).toBeInTheDocument();

    const retryInput = screen.getByPlaceholderText(/Type it again/i);
    expect(retryInput).toBeInTheDocument();
    expect(retryInput).toHaveValue('');

    const state = useGameState.getState();
    expect(state.pendingWords.length).toBeGreaterThan(0);
  });

  it('normalizes input by trimming punctuation and spacing', async () => {
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);

    await user.type(input, 'hello.  {Enter}');

    expect(await screen.findByText(/Correct!/i)).toBeInTheDocument();
  });

  it('prevents submission when input is empty', async () => {
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i) as HTMLInputElement;
    const initialState = useGameState.getState();
    const initialPendingCount = initialState.pendingWords.length;

    await user.type(input, '{Enter}');

    expect(input).toHaveFocus();
    expect(screen.queryByText(/Correct!/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Try again!/i)).not.toBeInTheDocument();

    const state = useGameState.getState();
    expect(state.pendingWords.length).toBe(initialPendingCount);
    expect(state.completedWords.length).toBe(0);
  });

  it('allows user to skip word with confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<QuestionScreen />);

    const skipButton = screen.getByRole('button', { name: /Skip/i });
    await user.click(skipButton);

    expect(confirmSpy).toHaveBeenCalledWith('Skip this word?');

    await waitFor(() => {
      const state = useGameState.getState();
      expect(state.completedWords.length).toBeGreaterThan(0);
    });

    const state = useGameState.getState();
    expect(state.completedWords[0].skipped).toBe(true);

    confirmSpy.mockRestore();
  });

  it('does not skip word when user cancels confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<QuestionScreen />);

    const skipButton = screen.getByRole('button', { name: /Skip/i });
    await user.click(skipButton);

    expect(confirmSpy).toHaveBeenCalledWith('Skip this word?');

    const state = useGameState.getState();
    expect(state.pendingWords.length).toBeGreaterThan(0);
    expect(state.completedWords.length).toBe(0);

    confirmSpy.mockRestore();
  });

  it('allows user to replay word by clicking play button', async () => {
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const playButton = screen.getByRole('button', { name: /Play word/i });
    await user.click(playButton);

    expect(mockSpeak).toHaveBeenCalled();
  });

  it('displays text prompt when word has prompt instead of speaking', () => {
    useGameState.getState().resetGame();
    useGameState
      .getState()
      .startGame(
        [{ word: 'hello', prompt: 'Say hello' }],
        LANGUAGES[0],
        'relaxed',
        'typing',
        'manual',
      );

    render(<QuestionScreen />);

    expect(screen.getByText(/Say hello/i)).toBeInTheDocument();
  });

  it('shows WordDiff when answer is incorrect', async () => {
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);

    await user.type(input, 'wrong{Enter}');

    expect(await screen.findByText(/Try again!/i)).toBeInTheDocument();
    expect(screen.getByText(/hello/i)).toBeInTheDocument();
  });

  it('accepts answer with different casing and accents in relaxed mode', async () => {
    const user = userEvent.setup();
    useGameState
      .getState()
      .startGame(
        [{ word: 'Café', prompt: undefined }],
        LANGUAGES[0],
        'relaxed',
        'typing',
        'manual',
      );

    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);

    await user.type(input, 'cafe{Enter}');

    expect(await screen.findByText(/Correct!/i)).toBeInTheDocument();
  });

  it('rejects answer with different casing or accents in strict mode', async () => {
    const user = userEvent.setup();
    useGameState.getState().resetGame();
    useGameState
      .getState()
      .startGame([{ word: 'Café' }], LANGUAGES[0], 'strict', 'typing', 'manual');

    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);
    await user.type(input, 'cafe{Enter}');

    expect(await screen.findByText(/Try again!/i)).toBeInTheDocument();
  });

  it('calls incorrectAnswer when user corrects answer on retry', async () => {
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);
    const initialState = useGameState.getState();
    const initialPendingCount = initialState.pendingWords.length;

    await user.type(input, 'wrong{Enter}');
    expect(await screen.findByText(/Try again!/i)).toBeInTheDocument();

    const retryInput = screen.getByPlaceholderText(/Type it again/i);
    await user.type(retryInput, 'hello{Enter}');

    expect(await screen.findByText(/Correct!/i)).toBeInTheDocument();

    await waitFor(
      () => {
        const state = useGameState.getState();
        const word = state.pendingWords.find((w) => w.word === 'hello');
        expect(word?.incorrectCount).toBeGreaterThan(0);
      },
      { timeout: 1500 },
    );

    const state = useGameState.getState();
    expect(state.pendingWords.length).toBe(initialPendingCount);
    const word = state.pendingWords.find((w) => w.word === 'hello');
    expect(word).toBeDefined();
    expect(word!.incorrectCount).toBe(1);
  });

  it('inserts special character into input field when clicking special character button', async () => {
    const user = userEvent.setup();
    useGameState
      .getState()
      .startGame(
        [{ word: 'café', prompt: undefined }],
        LANGUAGES[0],
        'relaxed',
        'typing',
        'manual',
      );

    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i) as HTMLInputElement;

    await user.type(input, 'caf');

    const eButton = screen.getByRole('button', { name: 'é' });
    await user.click(eButton);

    await waitFor(() => {
      expect(input.value).toBe('café');
    });

    expect(input).toHaveFocus();
  });

  it('accepts smart apostrophes in answers for words with straight apostrophes', async () => {
    const user = userEvent.setup();
    useGameState.getState().resetGame();
    useGameState
      .getState()
      .startGame([{ word: "don't" }], LANGUAGES[0], 'relaxed', 'typing', 'manual');

    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);
    await user.type(input, 'don’t{enter}');

    expect(await screen.findByText(/Correct!/i)).toBeInTheDocument();
  });

  it('accepts smart double quotes in answers for words with straight double quotes', async () => {
    const user = userEvent.setup();
    useGameState.getState().resetGame();
    useGameState
      .getState()
      .startGame([{ word: '"hello"' }], LANGUAGES[0], 'relaxed', 'typing', 'manual');

    render(<QuestionScreen />);

    const input = screen.getByPlaceholderText(/Type here/i);
    await user.type(input, '“hello”{enter}');

    expect(await screen.findByText(/Correct!/i)).toBeInTheDocument();
  });

  it('hides the special-characters keyboard in strict mode', () => {
    useGameState.getState().resetGame();
    useGameState
      .getState()
      .startGame([{ word: 'café' }], LANGUAGES[0], 'strict', 'typing', 'manual');

    render(<QuestionScreen />);

    expect(screen.queryByRole('button', { name: 'é' })).not.toBeInTheDocument();
  });

  it('shows pronunciation controls and does not autoplay in strict mode', async () => {
    const user = userEvent.setup();
    useGameState.getState().resetGame();
    useGameState
      .getState()
      .startGame(
        [{ word: 'bonjour', prompt: 'ignored prompt' }],
        LANGUAGES[0],
        'strict',
        'pronunciation',
        'manual',
      );

    render(<QuestionScreen />);

    expect(screen.getByText('bonjour')).toBeInTheDocument();
    expect(screen.queryByText(/ignored prompt/i)).not.toBeInTheDocument();
    expect(mockSpeak).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Play/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Answer/i }));
    expect(mockSpeak).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Answer/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Good/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wrong/i })).toBeInTheDocument();
  });

  it('autoplays in pronunciation relaxed mode', () => {
    useGameState.getState().resetGame();
    useGameState
      .getState()
      .startGame([{ word: 'hello' }], LANGUAGES[0], 'relaxed', 'pronunciation', 'manual');

    render(<QuestionScreen />);

    expect(mockSpeak).toHaveBeenCalled();
  });

  it('grades pronunciation flow with good and wrong buttons', async () => {
    const user = userEvent.setup();
    useGameState.getState().resetGame();
    useGameState
      .getState()
      .startGame([{ word: 'hello' }], LANGUAGES[0], 'strict', 'pronunciation', 'manual');

    render(<QuestionScreen />);

    await user.click(screen.getByRole('button', { name: /Answer/i }));
    await user.click(screen.getByRole('button', { name: /Wrong/i }));

    let state = useGameState.getState();
    expect(state.pendingWords).toHaveLength(1);
    expect(state.pendingWords[0].incorrectCount).toBe(1);

    await user.click(screen.getByRole('button', { name: /Answer/i }));
    await user.click(screen.getByRole('button', { name: /Good/i }));

    state = useGameState.getState();
    expect(state.pendingWords).toHaveLength(1);
    expect(state.pendingWords[0].incorrectCount).toBe(1);
    expect(state.pendingWords[0].correctStreak).toBe(1);
  });
});
