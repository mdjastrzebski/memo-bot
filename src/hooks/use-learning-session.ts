import { useEffect } from 'react';

import { useGameState } from '../stores/game-store';

export const SESSION_IDLE_TIMEOUT_MS = 30_000;

export function useLearningSession() {
  const { startedAt, endedAt, isPaused, lastActivityAt } = useGameState((state) => state.session);
  const pauseSession = useGameState((state) => state.pauseSession);

  useEffect(() => {
    if (startedAt == null || endedAt != null || isPaused || lastActivityAt == null) {
      return;
    }

    const remainingMs = SESSION_IDLE_TIMEOUT_MS - (Date.now() - lastActivityAt);
    if (remainingMs <= 0) {
      pauseSession();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      pauseSession();
    }, remainingMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [startedAt, endedAt, isPaused, lastActivityAt, pauseSession]);

  useEffect(() => {
    if (startedAt == null || endedAt != null) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startedAt, endedAt, pauseSession]);
}
