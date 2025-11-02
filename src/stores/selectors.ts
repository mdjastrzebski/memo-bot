import type { GameStatus, WordState } from '../types';
import type { GameState } from './game-store';
import { useGameState } from './game-store';

export function selectGameStatus(state: GameState): GameStatus {
  if (state.pendingWords.length > 0) {
    return 'learning';
  }

  return state.completedWords.length > 0 ? 'finished' : 'initial';
}

export function selectCurrentWord(state: GameState): WordState | undefined {
  return state.pendingWords[0];
}

type GameProgress = {
  remaining: number;
  completed: number;
};

export function selectGameProgress(state: GameState): GameProgress {
  return {
    remaining: state.pendingWords.length,
    completed: state.completedWords.length,
  };
}

export const useGameStatus = () => useGameState(selectGameStatus);
export const useCurrentWord = () => useGameState(selectCurrentWord);
