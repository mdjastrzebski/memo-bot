import { useState } from 'react';

import { Footer } from './components/footer';
import { useBeforeUnload } from './hooks/use-before-unload';
import type { WordsSubmitParams } from './screens/input-screen';
import InputScreen from './screens/input-screen';
import QuestionScreen from './screens/question-screen';
import ResultsScreen from './screens/results-screen';
import type { GameState, WordResult, WordState } from './types';
import { LANGUAGES } from './utils/languages';

const STREAK_GOAL = 2;
const SCHEDULE_AFTER_CORRECT = 5;
const SCHEDULE_AFTER_INCORRECT = 3;

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    queue: [],
    results: [],
    completedWords: [],
    language: LANGUAGES[0],
    mode: 'learn',
    ignoreAccents: true,
  });

  const isSetupState = gameState.queue.length === 0 && gameState.completedWords.length === 0;
  const isResultsState = gameState.queue.length === 0 && gameState.completedWords.length > 0;
  const isLearningState = gameState.queue.length > 0;
  useBeforeUnload(isLearningState);

  const handleWordsSubmit = ({ words, mode, language }: WordsSubmitParams) => {
    const initialQueue = shuffleArray(
      words.map((word) => ({
        word,
        correctStreak: mode === 'review' ? 1 : 0,
        incorrectCount: 0,
      })),
    );

    setGameState({
      queue: initialQueue,
      results: [],
      completedWords: [],
      language,
      mode,
      ignoreAccents: mode !== 'review',
    });
  };

  if (isSetupState) {
    return (
      <>
        <InputScreen onWordsSubmit={handleWordsSubmit} />
        <Footer />
      </>
    );
  }

  const handleRestart = () => {
    setGameState({
      ...gameState,
      queue: [],
      results: [],
      completedWords: [],
    });
  };

  if (isResultsState) {
    return (
      <>
        <ResultsScreen completedWords={gameState.completedWords} onRestart={handleRestart} />
        <Footer />
      </>
    );
  }

  const handleAnswer = (result: WordResult) => {
    setGameState((prev) => {
      const [currentWord, ...remainingQueue] = prev.queue;

      // If word was skipped, mark it as skipped and move to completed
      if (result.skipped) {
        const skippedWord = { ...currentWord, skipped: true };
        return {
          ...prev,
          queue: remainingQueue,
          results: [...prev.results, result],
          completedWords: [...prev.completedWords, skippedWord],
        };
      }

      // Update the current word state based on the result
      const updatedWord: WordState = {
        ...currentWord,
        correctStreak: result.isCorrect ? currentWord.correctStreak + 1 : 0,
        incorrectCount: result.isCorrect
          ? currentWord.incorrectCount
          : currentWord.incorrectCount + 1,
      };

      const newQueue = [...remainingQueue];
      const newCompletedWords = [...prev.completedWords];

      // If word has been answered correctly twice, move to completed
      if (updatedWord.correctStreak >= STREAK_GOAL) {
        newCompletedWords.push(updatedWord);
      } else {
        const insertAfter = result.isCorrect ? SCHEDULE_AFTER_CORRECT : SCHEDULE_AFTER_INCORRECT;
        const insertPosition = Math.min(insertAfter - 1, newQueue.length);
        newQueue.splice(insertPosition, 0, updatedWord);
      }

      return {
        ...prev,
        queue: newQueue,
        results: [...prev.results, result],
        completedWords: newCompletedWords,
      };
    });
  };

  const currentWord = gameState.queue[0];
  const remaining = gameState.queue.reduce(
    (acc, word) => acc + STREAK_GOAL - word.correctStreak,
    0,
  );
  const completed =
    gameState.queue.reduce((acc, word) => acc + word.correctStreak, 0) +
    gameState.completedWords.reduce((acc, word) => acc + word.correctStreak, 0);

  return (
    <>
      <QuestionScreen
        key={`${currentWord.word}-${currentWord.correctStreak}-${currentWord.incorrectCount}`}
        word={currentWord.word}
        language={gameState.language}
        onAnswer={handleAnswer}
        remaining={remaining}
        completed={completed}
        ignoreAccents={gameState.ignoreAccents}
      />
      <Footer />
    </>
  );
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
