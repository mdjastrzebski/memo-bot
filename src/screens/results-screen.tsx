import * as React from 'react';
import { Award, RotateCcw, Trophy } from 'lucide-react';

import { AppShell } from '../components/app-shell';
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
    <AppShell className="items-center">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <section className="stage-card flex flex-col justify-between bg-[rgba(246,196,83,0.18)]">
          <div className="space-y-5">
            <div className="eyebrow">Results Deck</div>
            <Trophy className="h-20 w-20 text-[#de5a37]" />
            <h2 className="display-title text-5xl font-black leading-[0.96] text-[#22170f]">
              Mission Complete! {getEmoji(percentage)}
            </h2>
            <p className="max-w-sm text-base leading-7 text-[#5f4b3b]">
              Your score reflects accuracy and recovery. Tricky words stay visible so the next round
              is easier to target.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-black/10 bg-white/65 p-4">
              <div className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#7d3d20]">
                Accuracy
              </div>
              <div className="mt-2 text-4xl font-black text-[#2f7a45]">
                {percentage === 100
                  ? 'Perfect'
                  : percentage >= 80
                    ? 'Sharp'
                    : percentage >= 60
                      ? 'Solid'
                      : 'Building'}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-black/10 bg-white/65 p-4">
              <div className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#7d3d20]">
                Total score
              </div>
              <div className="mt-2 text-2xl font-black text-[#22170f]">
                {actualScore} / {totalPossibleScore}
              </div>
            </div>
          </div>
        </section>

        <section className="stage-card bg-[rgba(255,251,245,0.92)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-extrabold uppercase tracking-[0.28em] text-[#7d3d20]">
                Word Review:
              </div>
              <p className="mt-2 text-base leading-7 text-[#5f4b3b]">
                Review the list from strongest performance to the ones that still need another lap.
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-black/10 bg-[#f6c453]/60 text-[#7d3d20]">
              <Award className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-black/10 bg-white/55 p-5">
            <div className="text-center space-y-3">
              <div className="display-title text-6xl font-black text-[#2f7a45]">{percentage}%</div>
              <p className="text-[#6a503b]">
                Score: {actualScore} / {totalPossibleScore}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {sortedWords.map((word) => (
              <div
                key={word.id}
                className="rounded-[1.5rem] border border-black/10 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
              >
                <div
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  data-testid={`word-score-${word.word}`}
                >
                  <div className="text-lg font-bold text-[#22170f]">
                    {word.word} {word.prompt && `(${word.prompt})`}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-[#f6c453]/35 px-3 py-1 font-bold text-[#6b4812]">
                      Score: {calculateWordScore(word)}
                    </span>

                    {word.incorrectCount > 0 && !word.skipped && (
                      <span className="text-sm text-[#b24328]">
                        ({word.incorrectCount} mistakes)
                      </span>
                    )}
                    {word.skipped && <span className="text-sm text-yellow-400">skipped</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={restart}
            className="mt-6 h-14 w-full rounded-[1.4rem] border border-black/10 bg-[#de5a37] text-base font-extrabold text-white shadow-[0_16px_30px_rgba(222,90,55,0.28)] hover:bg-[#c94d2d]"
          >
            <RotateCcw className="h-5 w-5" />
            Start New Mission
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
