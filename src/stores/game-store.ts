import { create } from 'zustand';

import type { ExerciseType, InputSource, SessionState, Word, WordState } from '../types';
import { shuffleArray } from '../utils/data';
import { generateId } from '../utils/id';
import { type Language, LANGUAGES } from '../utils/languages';

const STREAK_GOAL_AFTER_INCORRECT = 2;
const SCHEDULE_AFTER_CORRECT = 5;
const SCHEDULE_AFTER_INCORRECT = 0;

function createInitialSessionState(): SessionState {
  return {
    startedAt: null,
    endedAt: null,
    accumulatedActiveMs: 0,
    activeSince: null,
    lastActivityAt: null,
    isPaused: true,
  };
}

function createRunningSessionState(now: number): SessionState {
  return {
    startedAt: now,
    endedAt: null,
    accumulatedActiveMs: 0,
    activeSince: now,
    lastActivityAt: now,
    isPaused: false,
  };
}

function getAccumulatedActiveMs(session: SessionState, now: number): number {
  if (session.activeSince == null) {
    return session.accumulatedActiveMs;
  }

  return session.accumulatedActiveMs + Math.max(0, now - session.activeSince);
}

function pauseSessionState(session: SessionState, now: number): SessionState {
  if (session.startedAt == null || session.endedAt != null || session.isPaused) {
    return session;
  }

  return {
    ...session,
    accumulatedActiveMs: getAccumulatedActiveMs(session, now),
    activeSince: null,
    isPaused: true,
  };
}

function resumeSessionState(session: SessionState, now: number): SessionState {
  if (session.startedAt == null || session.endedAt != null || !session.isPaused) {
    return session;
  }

  return {
    ...session,
    activeSince: now,
    lastActivityAt: now,
    isPaused: false,
  };
}

function recordSessionActivityState(session: SessionState, now: number): SessionState {
  if (session.startedAt == null || session.endedAt != null) {
    return session;
  }

  if (session.isPaused) {
    return resumeSessionState(session, now);
  }

  return {
    ...session,
    lastActivityAt: now,
  };
}

function finishSessionState(session: SessionState, now: number): SessionState {
  if (session.startedAt == null || session.endedAt != null) {
    return session;
  }

  const pausedSession = pauseSessionState(session, now);
  return {
    ...pausedSession,
    endedAt: now,
  };
}

export interface GameState {
  pendingWords: WordState[];
  completedWords: WordState[];
  language: Language;
  exerciseType: ExerciseType;
  source: InputSource;
  session: SessionState;
}

export interface GameActions {
  startGame: (
    words: Word[],
    language: Language,
    exerciseType: ExerciseType,
    source: InputSource,
  ) => void;
  resetGame: () => void;
  correctAnswer: (word: WordState) => void;
  incorrectAnswer: (word: WordState) => void;
  skipWord: (word: WordState) => void;
  recordSessionActivity: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
}

export const useGameState = create<GameState & GameActions>((set) => ({
  pendingWords: [],
  completedWords: [],
  language: LANGUAGES[0],
  exerciseType: 'relaxed',
  source: 'manual',
  session: createInitialSessionState(),

  startGame: (words, language, exerciseType, source) => {
    const now = Date.now();
    const initialQueue = shuffleArray(
      words.map(({ word, prompt }) => ({
        id: generateId(),
        word,
        prompt,
        correctStreak: 0,
        incorrectCount: 0,
      })),
    );

    set({
      pendingWords: initialQueue,
      completedWords: [],
      language,
      exerciseType,
      source,
      session: createRunningSessionState(now),
    });
  },

  resetGame: () => {
    set((state) => ({
      pendingWords: [],
      completedWords: [],
      language: state.language,
      exerciseType: state.exerciseType,
      source: state.source,
      session: createInitialSessionState(),
    }));
  },

  correctAnswer: (word: WordState) => {
    set((state: GameState & GameActions) => {
      const now = Date.now();
      const updatedWord = { ...word, correctStreak: word.correctStreak + 1 };
      const otherWords = state.pendingWords.filter((w) => w.id !== word.id);

      const isCompleted =
        updatedWord.incorrectCount === 0 ||
        updatedWord.correctStreak >= STREAK_GOAL_AFTER_INCORRECT;
      if (isCompleted) {
        const nextCompletedWords = [...state.completedWords, updatedWord];
        return {
          ...state,
          pendingWords: otherWords,
          completedWords: nextCompletedWords,
          session: otherWords.length === 0 ? finishSessionState(state.session, now) : state.session,
        };
      }

      const insertPosition = Math.min(SCHEDULE_AFTER_CORRECT, otherWords.length);
      otherWords.splice(insertPosition, 0, updatedWord);

      return {
        ...state,
        pendingWords: otherWords,
      };
    });
  },

  incorrectAnswer: (word: WordState) => {
    set((state) => {
      const otherWords = state.pendingWords.filter((w) => w.id !== word.id);
      const updatedWord: WordState = {
        ...word,
        correctStreak: 0,
        incorrectCount: word.incorrectCount + 1,
      };

      // In the first pass, go through all words. In subsequent passes, schedule the repetition closer.
      const isFirstAttempt = word.incorrectCount === 0;
      if (isFirstAttempt) {
        return {
          ...state,
          pendingWords: [...otherWords, updatedWord],
        };
      }

      const insertPosition = Math.min(SCHEDULE_AFTER_INCORRECT, otherWords.length);
      otherWords.splice(insertPosition, 0, updatedWord);
      return {
        ...state,
        pendingWords: otherWords,
      };
    });
  },

  skipWord: (word: WordState) => {
    set((state: GameState & GameActions) => {
      const skippedWord: WordState = { ...word, skipped: true };
      const now = Date.now();
      const nextPendingWords = state.pendingWords.filter((w) => w.id !== word.id);
      return {
        ...state,
        pendingWords: nextPendingWords,
        completedWords: [...state.completedWords, skippedWord],
        session:
          nextPendingWords.length === 0 ? finishSessionState(state.session, now) : state.session,
      };
    });
  },

  recordSessionActivity: () => {
    set((state) => ({
      ...state,
      session: recordSessionActivityState(state.session, Date.now()),
    }));
  },

  pauseSession: () => {
    set((state) => ({
      ...state,
      session: pauseSessionState(state.session, Date.now()),
    }));
  },

  resumeSession: () => {
    set((state) => ({
      ...state,
      session: resumeSessionState(state.session, Date.now()),
    }));
  },
}));
