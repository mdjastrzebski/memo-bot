import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ExerciseType, InputSource, SessionState, Word, WordState } from '../types';
import { shuffleArray } from '../utils/data';
import { generateId } from '../utils/id';
import { type Language, LANGUAGES, isSupportedLanguageCode } from '../utils/languages';
import { WORD_SET_SAMPLE_SIZES, type WordSetSampleSize } from '../utils/word-sets';

const STREAK_GOAL_AFTER_INCORRECT = 2;
const SCHEDULE_AFTER_CORRECT = 5;
const SCHEDULE_AFTER_INCORRECT = 0;
const STORE_PERSISTENCE_KEY = 'memo-bot-setup-preferences';

export interface SetupPreferences {
  languageCode: string;
  exerciseType: ExerciseType;
  source: InputSource;
  manualText: string;
  sampleSize: WordSetSampleSize;
  selectedWordSetId: string;
}

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

function createInitialSetupPreferences(): SetupPreferences {
  return {
    languageCode: LANGUAGES[0].code,
    exerciseType: 'relaxed',
    source: 'manual',
    manualText: '',
    sampleSize: WORD_SET_SAMPLE_SIZES[0],
    selectedWordSetId: '',
  };
}

function isExerciseType(value: unknown): value is ExerciseType {
  return value === 'relaxed' || value === 'strict';
}

function isInputSource(value: unknown): value is InputSource {
  return value === 'manual' || value === 'word-set';
}

function isWordSetSampleSize(value: unknown): value is WordSetSampleSize {
  return typeof value === 'number' && WORD_SET_SAMPLE_SIZES.includes(value as WordSetSampleSize);
}

function sanitizeSetupPreferences(value: unknown): SetupPreferences {
  const defaults = createInitialSetupPreferences();
  if (typeof value !== 'object' || value === null) {
    return defaults;
  }

  const persisted = value as Record<string, unknown>;

  return {
    languageCode:
      typeof persisted.languageCode === 'string' && isSupportedLanguageCode(persisted.languageCode)
        ? persisted.languageCode
        : defaults.languageCode,
    exerciseType: isExerciseType(persisted.exerciseType)
      ? persisted.exerciseType
      : defaults.exerciseType,
    source: isInputSource(persisted.source) ? persisted.source : defaults.source,
    manualText:
      typeof persisted.manualText === 'string' ? persisted.manualText : defaults.manualText,
    sampleSize: isWordSetSampleSize(persisted.sampleSize)
      ? persisted.sampleSize
      : defaults.sampleSize,
    selectedWordSetId:
      typeof persisted.selectedWordSetId === 'string'
        ? persisted.selectedWordSetId
        : defaults.selectedWordSetId,
  };
}

export interface GameState {
  pendingWords: WordState[];
  completedWords: WordState[];
  setup: SetupPreferences;
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
  resetSetupPreferences: () => void;
  setLanguage: (language: Language) => void;
  setExerciseType: (exerciseType: ExerciseType) => void;
  setSource: (source: InputSource) => void;
  setManualText: (text: string) => void;
  setSampleSize: (sampleSize: WordSetSampleSize) => void;
  setSelectedWordSetId: (wordSetId: string) => void;
  correctAnswer: (word: WordState) => void;
  incorrectAnswer: (word: WordState) => void;
  skipWord: (word: WordState) => void;
  recordSessionActivity: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
}

export const useGameState = create<GameState & GameActions>()(
  persist(
    (set) => ({
      pendingWords: [],
      completedWords: [],
      setup: createInitialSetupPreferences(),
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

        set((state) => ({
          pendingWords: initialQueue,
          completedWords: [],
          setup: {
            ...state.setup,
            languageCode: language.code,
            exerciseType,
            source,
          },
          session: createRunningSessionState(now),
        }));
      },

      resetGame: () => {
        set((state) => ({
          pendingWords: [],
          completedWords: [],
          setup: state.setup,
          session: createInitialSessionState(),
        }));
      },

      resetSetupPreferences: () => {
        set((state) => ({
          ...state,
          setup: createInitialSetupPreferences(),
        }));
      },

      setLanguage: (language) => {
        set((state) => ({
          ...state,
          setup: {
            ...state.setup,
            languageCode: language.code,
          },
        }));
      },

      setExerciseType: (exerciseType) => {
        set((state) => ({
          ...state,
          setup: {
            ...state.setup,
            exerciseType,
          },
        }));
      },

      setSource: (source) => {
        set((state) => ({
          ...state,
          setup: {
            ...state.setup,
            source,
          },
        }));
      },

      setManualText: (manualText) => {
        set((state) => ({
          ...state,
          setup: {
            ...state.setup,
            manualText,
          },
        }));
      },

      setSampleSize: (sampleSize) => {
        set((state) => ({
          ...state,
          setup: {
            ...state.setup,
            sampleSize,
          },
        }));
      },

      setSelectedWordSetId: (selectedWordSetId) => {
        set((state) => ({
          ...state,
          setup: {
            ...state.setup,
            selectedWordSetId,
          },
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
              session:
                otherWords.length === 0 ? finishSessionState(state.session, now) : state.session,
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
              nextPendingWords.length === 0
                ? finishSessionState(state.session, now)
                : state.session,
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
    }),
    {
      name: STORE_PERSISTENCE_KEY,
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        setup: state.setup,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GameState> | undefined;
        const current = currentState as GameState & GameActions;

        return {
          ...current,
          setup: sanitizeSetupPreferences(persisted?.setup),
        };
      },
    },
  ),
);
