import { useState } from 'react';

import { useBeforeUnload } from './hooks/use-before-unload';
import InputScreen from './screens/input-screen';
import QuestionScreen from './screens/question-screen';
import ResultsScreen from './screens/results-screen';
import type { GameState, WordResult, WordState } from './types';

const STREAK_GOAL = 2;

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    queue: [],
    results: [],
    completedWords: [],
  });

  const isSetupState = gameState.queue.length === 0 && gameState.completedWords.length === 0;
  const isResultsState = gameState.queue.length === 0 && gameState.completedWords.length > 0;
  const isLearningState = gameState.queue.length > 0;
  useBeforeUnload(isLearningState);

  const handleWordsSubmit = (words: string[]) => {
    // Initialize queue with shuffled words
    const initialQueue = shuffleArray(
      words.map((word) => ({
        word,
        correctStreak: 0,
        incorrectCount: 0,
      })),
    );

    setGameState({
      queue: initialQueue,
      results: [],
      completedWords: [],
    });
  };

  if (isSetupState) {
    return <InputScreen onWordsSubmit={handleWordsSubmit} />;
  }

  const handleRestart = () => {
    setGameState({
      queue: [],
      results: [],
      completedWords: [],
    });
  };

  if (isResultsState) {
    return <ResultsScreen completedWords={gameState.completedWords} onRestart={handleRestart} />;
  }

  const handleAnswer = (result: WordResult) => {
    setGameState((prev) => {
      const [currentWord, ...remainingQueue] = prev.queue;

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
        newQueue.push(updatedWord);
      }

      return {
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
    <QuestionScreen
      key={`${currentWord.word}-${currentWord.correctStreak}-${currentWord.incorrectCount}`}
      word={currentWord.word}
      onAnswer={handleAnswer}
      remaining={remaining}
      completed={completed}
    />
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
