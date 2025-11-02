import type { GameStatus, WordState } from '../types';
import type { GameStore } from './game-store';
import { useGameState } from './game-store';

export function selectGameStatus(state: GameStore): GameStatus {
  if (state.pendingWords.length > 0) {
    return 'learning';
  }

  return state.completedWords.length > 0 ? 'finished' : 'initial';
}

export function selectCurrentWord(state: GameStore): WordState | undefined {
  return state.pendingWords[0];
}

type GameProgress = {
  remaining: number;
  completed: number;
};

export function selectGameProgress(state: GameStore): GameProgress {
  return {
    remaining: state.pendingWords.length,
    completed: state.completedWords.length,
  };
}

export const useGameStatus = () => useGameState(selectGameStatus);
export const useCurrentWord = () => useGameState(selectCurrentWord);
