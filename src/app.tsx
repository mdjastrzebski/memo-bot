import { useState } from "react";
import InputScreen from "./screens/input-screen";
import QuestionScreen from "./screens/question-screen";
import ResultsScreen from "./screens/results-screen";
import type { GameState, WordResult, WordState } from "./types/types";

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    queue: [],
    results: [],
    completedWords: [],
  });

  const handleWordsSubmit = (words: string[]) => {
    // Initialize queue with shuffled words
    const initialQueue = shuffleArray(
      words.map((word) => ({
        word,
        correctStreak: 0,
        incorrectCount: 0,
      }))
    );

    setGameState({
      queue: initialQueue,
      results: [],
      completedWords: [],
    });
  };

  const handleAnswer = (result: WordResult) => {
    setGameState((prev) => {
      const [currentWord, ...remainingQueue] = prev.queue;

      // Update the current word state based on the result
      const updatedWord: WordState = {
        ...currentWord,
        correctStreak: result.correct ? currentWord.correctStreak + 1 : 0,
        incorrectCount: result.correct
          ? currentWord.incorrectCount
          : currentWord.incorrectCount + 1,
      };

      const newQueue = [...remainingQueue];
      const newCompletedWords = [...prev.completedWords];

      // If word has been answered correctly twice, move to completed
      if (updatedWord.correctStreak >= 2) {
        newCompletedWords.push(updatedWord);
      } else {
        // For incorrect attempts or not enough correct streaks,
        // move to the end of the queue
        if (!result.correct || updatedWord.correctStreak < 2) {
          newQueue.push(updatedWord);
        }
      }

      return {
        queue: newQueue,
        results: [...prev.results, result],
        completedWords: newCompletedWords,
      };
    });
  };

  const handleRestart = () => {
    setGameState({
      queue: [],
      results: [],
      completedWords: [],
    });
  };

  // Calculate if the game is complete (queue is empty)
  const isGameComplete =
    gameState.queue.length === 0 && gameState.completedWords.length > 0;

  if (gameState.queue.length === 0 && gameState.completedWords.length === 0) {
    return <InputScreen onWordsSubmit={handleWordsSubmit} />;
  }

  if (!isGameComplete) {
    return (
      <QuestionScreen
        word={gameState.queue[0].word}
        onAnswer={handleAnswer}
        progress={{
          remaining: gameState.queue.length,
          completed: gameState.completedWords.length,
          currentStreak: gameState.queue[0].correctStreak,
          currentMistakes: gameState.queue[0].incorrectCount,
        }}
      />
    );
  }

  return (
    <ResultsScreen
      completedWords={gameState.completedWords}
      onRestart={handleRestart}
    />
  );
}
