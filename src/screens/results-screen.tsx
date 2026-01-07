import * as React from 'react';
import { RotateCcw, Trophy } from 'lucide-react';

import { Button } from '../components/ui/button';
import { useGameState } from '../stores/game-store';
import { calculateWordScore, compareWordScores } from '../utils/score';
import { playCompleted } from '../utils/sounds';

export default function ResultsScreen() {
  const words = useGameState((state) => state.completedWords);
  const restart = useGameState((state) => state.resetGame);

  React.useEffect(() => {
    playCompleted();
  }, []);

  const totalPossibleScore = words.length * 100;
  const actualScore = words.reduce((sum, word) => sum + calculateWordScore(word), 0);
  const percentage = Math.round((actualScore / totalPossibleScore) * 100);

  const getEmoji = (percentage: number) => {
    if (percentage === 100) return '🏆';
    if (percentage >= 80) return '🌟';
    if (percentage >= 60) return '👍';
    return '💪';
  };

  const sortedWords = [...words].sort(compareWordScores);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-6">
          <Trophy className="w-24 h-24 mx-auto text-yellow-400 animate-pulse" />
          <h2 className="text-4xl font-bold text-white mb-2">
            Mission Complete! {getEmoji(percentage)}
          </h2>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-green-600">{percentage}%</div>
            <p className="text-purple-200">
              Score: {actualScore} / {totalPossibleScore}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Word Review:</h3>
            {sortedWords.map((word) => (
              <div key={word.id} className="p-4 rounded-lg bg-white/10">
                <div className="flex justify-between items-center" data-testid={`word-score-${word.word}`}>
                  <span className="text-white font-medium">
                    {word.word} {word.prompt && `(${word.prompt})`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-purple-200">
                      Score: {calculateWordScore(word)}
                    </span>

                    {word.incorrectCount > 0 && !word.skipped && (
                      <span className="text-sm text-red-400">({word.incorrectCount} mistakes)</span>
                    )}
                    {word.skipped && <span className="text-sm text-yellow-400">skipped</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={restart}
            className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 rounded-xl"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Start New Mission
          </Button>
        </div>
      </div>
    </div>
  );
}
