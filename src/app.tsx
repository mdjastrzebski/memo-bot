import { useState } from 'react';

import { Footer } from './components/footer';
import { useBeforeUnload } from './hooks/use-before-unload';
import type { WordsSubmitParams } from './screens/input-screen';
import InputScreen from './screens/input-screen';
import QuestionScreen from './screens/question-screen';
import ResultsScreen from './screens/results-screen';
import type { GameState, WordResult, WordState } from './types';
import { LANGUAGES } from './utils/languages';

const STREAK_GOAL_AFTER_INCORRECT = 2;
const SCHEDULE_AFTER_CORRECT = 3;
const SCHEDULE_AFTER_INCORRECT = 1;

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    queue: [],
    completedWords: [],
    language: LANGUAGES[0],
    ignoreAccents: true,
  });

  const isSetupState = gameState.queue.length === 0 && gameState.completedWords.length === 0;
  const isResultsState = gameState.queue.length === 0 && gameState.completedWords.length > 0;
  const isLearningState = gameState.queue.length > 0;
  useBeforeUnload(isLearningState);

  const handleWordsSubmit = ({ words, language }: WordsSubmitParams) => {
    const initialQueue = shuffleArray(
      words.map(({ word, prompt }) => ({
        word,
        prompt,
        correctStreak: 0,
        incorrectCount: 0,
      })),
    );

    setGameState({
      queue: initialQueue,
      completedWords: [],
      language,
      ignoreAccents: false,
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
      if (
        (updatedWord.correctStreak === 1 && currentWord.incorrectCount === 0) ||
        updatedWord.correctStreak >= STREAK_GOAL_AFTER_INCORRECT
      ) {
        newCompletedWords.push(updatedWord);
      } else {
        const insertAfter = result.isCorrect ? SCHEDULE_AFTER_CORRECT : SCHEDULE_AFTER_INCORRECT;
        const insertPosition = Math.min(insertAfter - 1, newQueue.length);
        newQueue.splice(insertPosition, 0, updatedWord);
      }

      return {
        ...prev,
        queue: newQueue,
        completedWords: newCompletedWords,
      };
    });
  };

  const currentWord = gameState.queue[0];
  const remaining = gameState.queue.length;
  const completed = gameState.completedWords.length;

  return (
    <>
      <QuestionScreen
        key={`${currentWord.word}-${currentWord.correctStreak}-${currentWord.incorrectCount}`}
        word={currentWord.word}
        prompt={currentWord.prompt}
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
