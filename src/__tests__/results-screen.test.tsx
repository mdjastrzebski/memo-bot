import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResultsScreen from '../screens/results-screen';
import { useGameState } from '../stores/game-store';
import { LANGUAGES } from '../utils/languages';

// Mock sounds
vi.mock('../utils/sounds', () => ({
  playCorrect: vi.fn(),
  playWrong: vi.fn(),
  playCompleted: vi.fn(),
}));

describe('ResultsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameState.getState().resetGame();
  });

  it('displays results with score percentage and word review after game completion', () => {
    // Set up completed words with different scores
    useGameState.setState({
      completedWords: [
        {
          id: '1',
          word: 'perfect',
          prompt: undefined,
          correctStreak: 2,
          incorrectCount: 0,
          skipped: false,
        },
        {
          id: '2',
          word: 'good',
          prompt: undefined,
          correctStreak: 2,
          incorrectCount: 1,
          skipped: false,
        },
        {
          id: '3',
          word: 'okay',
          prompt: undefined,
          correctStreak: 2,
          incorrectCount: 2,
          skipped: false,
        },
      ],
    });

    render(<ResultsScreen />);

    // Should show completion message
    expect(screen.getByText(/Mission Complete!/i)).toBeInTheDocument();

    // Should show score percentage (perfect: 100, good: 75, okay: 50 = 225/300 = 75%)
    expect(screen.getByText(/75%/i)).toBeInTheDocument();

    // Should show score breakdown
    expect(screen.getByText(/225 \/ 300/i)).toBeInTheDocument();

    // Should show word review section
    expect(screen.getByText(/Word Review:/i)).toBeInTheDocument();

    // Validate each word has its correct score assigned
    // Use testID to find the container that holds both word and score, then use "within" to validate pairs
    const perfectContainer = screen.getByTestId('word-score-perfect');
    expect(within(perfectContainer).getByText(/perfect/i)).toBeInTheDocument();
    expect(within(perfectContainer).getByText(/Score: 100/i)).toBeInTheDocument();

    const goodContainer = screen.getByTestId('word-score-good');
    expect(within(goodContainer).getByText(/good/i)).toBeInTheDocument();
    expect(within(goodContainer).getByText(/Score: 75/i)).toBeInTheDocument();

    const okayContainer = screen.getByTestId('word-score-okay');
    expect(within(okayContainer).getByText(/okay/i)).toBeInTheDocument();
    expect(within(okayContainer).getByText(/Score: 50/i)).toBeInTheDocument();
  });

  it('shows appropriate emoji based on performance percentage', () => {
    // Test 100% score
    useGameState.setState({
      completedWords: [
        {
          id: '1',
          word: 'perfect',
          prompt: undefined,
          correctStreak: 2,
          incorrectCount: 0,
          skipped: false,
        },
      ],
    });

    const { unmount } = render(<ResultsScreen />);
    expect(screen.getByText(/🏆/)).toBeInTheDocument();
    unmount();

    // Test 80% score (need multiple words to average 80%+)
    useGameState.setState({
      completedWords: [
        {
          id: '1',
          word: 'perfect1',
          prompt: undefined,
          correctStreak: 2,
          incorrectCount: 0,
          skipped: false,
        },
        {
          id: '2',
          word: 'good',
          prompt: undefined,
          correctStreak: 2,
          incorrectCount: 1,
          skipped: false,
        },
      ],
    });
    render(<ResultsScreen />);
    // 100 + 75 = 175 / 200 = 87.5% should show 🌟
    expect(screen.getByText(/🌟/)).toBeInTheDocument();
  });

  it('allows user to restart game by clicking Start New Mission button', async () => {
    const user = userEvent.setup();

    useGameState.setState({
      completedWords: [
        {
          id: '1',
          word: 'test',
          prompt: undefined,
          correctStreak: 2,
          incorrectCount: 0,
          skipped: false,
        },
      ],
    });

    render(<ResultsScreen />);

    // Find and click restart button
    const restartButton = screen.getByRole('button', { name: /Start New Mission/i });
    await user.click(restartButton);

    // Verify game was reset
    const state = useGameState.getState();
    expect(state.completedWords).toHaveLength(0);
    expect(state.pendingWords).toHaveLength(0);
  });

  it('displays word prompts and mistake counts when present', () => {
    useGameState.setState({
      completedWords: [
        {
          id: '1',
          word: 'hello',
          prompt: 'Say hello',
          correctStreak: 2,
          incorrectCount: 1,
          skipped: false,
        },
        {
          id: '2',
          word: 'skipped',
          prompt: undefined,
          correctStreak: 0,
          incorrectCount: 0,
          skipped: true,
        },
      ],
    });

    render(<ResultsScreen />);

    // Should show prompt in parentheses
    expect(screen.getByText(/hello \(Say hello\)/i)).toBeInTheDocument();

    // Should show mistake count
    expect(screen.getByText(/\(1 mistakes\)/i)).toBeInTheDocument();

    // Should show skipped status (there are two "skipped" texts - word name and status label)
    const skippedElements = screen.getAllByText(/skipped/i);
    expect(skippedElements.length).toBeGreaterThan(0);
    // Check that the status label exists
    expect(screen.getByText(/skipped/i, { selector: 'span.text-yellow-400' })).toBeInTheDocument();
  });
});
