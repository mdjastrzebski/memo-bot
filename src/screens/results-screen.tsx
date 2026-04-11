import { Award, RotateCcw, Trophy } from 'lucide-react';
import * as React from 'react';

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
      <div className="grid w-full max-w-5xl items-start gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <section className="stage-card flex h-fit flex-col gap-8 bg-[rgba(246,196,83,0.18)] dark:bg-[rgba(59,50,22,0.42)] lg:max-h-[50rem]">
          <div className="space-y-7">
            <div className="eyebrow">Results Deck</div>
            <Trophy className="h-20 w-20 text-[#de5a37]" />
            <h2 className="display-title text-5xl font-black leading-[0.96] text-[#22170f] dark:text-[#f8f1e6]">
              Mission Complete! {getEmoji(percentage)}
            </h2>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-black/10 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#7d3d20] dark:text-[#f7d27a]">
                Accuracy
              </div>
              <div className="mt-2 text-4xl font-black text-[#2f7a45] dark:text-[#8ee0a3]">
                {percentage}%
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-black/10 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#7d3d20] dark:text-[#f7d27a]">
                Total score
              </div>
              <div className="mt-2 text-2xl font-black text-[#22170f]">
                <span className="dark:text-[#f8f1e6]">
                  {actualScore} / {totalPossibleScore}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="stage-card bg-[rgba(255,251,245,0.92)] dark:bg-[rgba(29,34,46,0.92)]">
          <div className="flex items-center gap-4">
            <div className="text-[#b4832f] opacity-80">
              <Award className="h-7 w-7" />
            </div>
            <div className="text-sm font-extrabold uppercase tracking-[0.28em] text-[#7d3d20] dark:text-[#f7d27a]">
              Word Review:
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-black/10 bg-white/55 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="text-center space-y-3">
              <div className="text-sm font-extrabold uppercase tracking-[0.28em] text-[#7d3d20] dark:text-[#f7d27a]">
                Great job {getEmoji(percentage)}
              </div>
              <div className="display-title text-6xl font-black text-[#2f7a45] dark:text-[#8ee0a3]">
                {actualScore}!
              </div>
              <p className="text-xl font-bold text-[#6a503b] dark:text-[#efe3d4]">points</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {sortedWords.map((word) => (
              <div
                key={word.id}
                className="rounded-[1.5rem] border border-black/10 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-white/10 dark:bg-white/5 dark:shadow-none"
              >
                <div className="flex items-start gap-4" data-testid={`word-score-${word.word}`}>
                  <div className="min-w-0 flex-1 text-lg font-bold text-[#22170f] dark:text-[#f3eadf]">
                    <span>
                      {word.word} {word.prompt && `(${word.prompt})`}
                    </span>
                    {word.incorrectCount > 0 && !word.skipped && (
                      <span className="ml-2 text-sm font-medium text-[#b24328] dark:text-[#ef8d73]">
                        ({word.incorrectCount} mistakes)
                      </span>
                    )}
                    {word.skipped && (
                      <span className="ml-2 text-sm font-medium text-yellow-400 dark:text-[#f4c15d]">
                        skipped
                      </span>
                    )}
                  </div>

                  <div className="ml-auto shrink-0 text-sm">
                    <span className="rounded-full bg-[#f6c453]/35 px-3 py-1 font-bold text-[#6b4812] dark:bg-[rgba(246,196,83,0.18)] dark:text-[#f7d27a]">
                      Score: {calculateWordScore(word)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={restart}
            className="mt-6 h-14 w-full rounded-[1.4rem] border border-black/10 bg-[#de5a37] text-base font-extrabold text-white shadow-[0_16px_30px_rgba(222,90,55,0.28)] hover:bg-[#c94d2d] dark:border-white/10 dark:bg-[#d46b47] dark:hover:bg-[#bf5d3c]"
          >
            <RotateCcw className="h-5 w-5" />
            Start New Mission
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
