import { useEffect, useRef, useState } from 'react';
import { BotIcon as Robot, Play, Volume2, X } from 'lucide-react';
import type React from 'react';

import { AppShell } from '../components/app-shell';
import { SpecialCharactersKeyboard } from '../components/special-chars-keyboard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { WordDiff } from '../components/word-diff';
import { useGameState } from '../stores/game-store';
import { useCurrentWord } from '../stores/selectors';
import { playCorrect } from '../utils/sounds';
import { speak } from '../utils/speak';
import { normalizeAnswerText } from '../utils/text-normalization';

const CORRECT_STATE_DURATION = 1000;

type QuestionStatus = 'question' | 'retry' | 'correct';

export default function QuestionScreen() {
  const currentWord = useCurrentWord();
  const language = useGameState((state) => state.language);
  const ignoreAccents = useGameState((state) => state.ignoreAccents);
  const remaining = useGameState((state) => state.pendingWords.length);
  const completed = useGameState((state) => state.completedWords.length);
  const correctAnswer = useGameState((state) => state.correctAnswer);
  const incorrectAnswer = useGameState((state) => state.incorrectAnswer);
  const skipWord = useGameState((state) => state.skipWord);

  const [status, setStatus] = useState<QuestionStatus>('question');
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number | null>(null);

  const initialSoundPlayed = useRef<string | null>(null);

  const word = currentWord?.word;
  const prompt = currentWord?.prompt;

  useEffect(() => {
    if (!word) return;

    // Reset local state when word changes
    setStatus('question');
    setInput('');
    setAnswer('');

    // Prevent initial sound from playing twice in strict mode for the same word
    if (initialSoundPlayed.current === word) return;
    initialSoundPlayed.current = word;

    if (prompt == null) {
      speak(word, language);
    }

    inputRef.current?.focus();
  }, [word, language, prompt, currentWord]);

  if (!currentWord || !word) {
    return null;
  }

  const handleSpeak = () => {
    speak(word, language);
    inputRef.current?.focus();
  };

  // Track cursor position when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    cursorPositionRef.current = e.target.selectionStart;
  };

  // Handle special character insertion
  const handleSpecialCharClick = (char: string) => {
    const position = cursorPositionRef.current !== null ? cursorPositionRef.current : input.length;

    // Insert the character at cursor position
    const newValue = input.slice(0, position) + char + input.slice(position);
    setInput(newValue);

    // Update cursor position for next time
    cursorPositionRef.current = position + char.length;

    // Set focus back to input after a short delay to ensure state is updated
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(cursorPositionRef.current!, cursorPositionRef.current!);
      }
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if input is empty or only whitespace
    if (!input) {
      inputRef.current?.focus();
      return;
    }

    const normalizedInput = normalizeAnswerText(input);
    const normalizedWord = normalizeAnswerText(word);

    // Use accent-insensitive comparison if ignoreAccents is true
    const isCorrect = ignoreAccents
      ? normalizedInput.localeCompare(normalizedWord, undefined, { sensitivity: 'base' }) === 0
      : normalizedInput === normalizedWord;

    if (!isCorrect) {
      speak(word, language);
      setStatus('retry');
      setAnswer(input);
      setInput('');
      return;
    }

    playCorrect();
    if (prompt != null) speak(word, language);

    const isFirstAttempt = status === 'question';
    setStatus('correct');
    setAnswer(input);
    setTimeout(() => {
      if (isFirstAttempt) {
        correctAnswer(currentWord);
      } else {
        incorrectAnswer(currentWord);
      }
    }, CORRECT_STATE_DURATION);
  };

  const handleSkip = () => {
    // Show confirmation dialog before skipping
    const confirmed = confirm('Skip this word?');
    if (!confirmed) {
      inputRef.current?.focus();
      return;
    }

    setStatus('correct');
    skipWord(currentWord);
  };

  const progressPercentage = (completed / (remaining + completed)) * 100;

  const showPlayButton = prompt == null || status !== 'question';

  return (
    <AppShell className="items-center">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <section className="stage-card flex flex-col justify-between bg-[rgba(246,196,83,0.16)]">
          <div className="space-y-6">
            <div className="eyebrow">Live Round</div>
            <div>
              <Robot className="h-20 w-20 text-[#de5a37]" />
              <h2 className="display-title mt-4 text-4xl font-black leading-tight text-[#22170f]">
                Type what you hear!
              </h2>
              <p className="mt-3 text-base leading-7 text-[#5f4b3b]">
                Listen closely, type the word, and Memo Bot will bring missed words back sooner.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.5rem] border border-black/10 bg-white/65 p-4">
                <div className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#7d3d20]">
                  Queue
                </div>
                <div className="mt-2 text-4xl font-black text-[#22170f]">{remaining}</div>
                <div className="text-sm text-[#6a503b]">words still ahead</div>
              </div>
              <div className="rounded-[1.5rem] border border-black/10 bg-white/65 p-4">
                <div className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#7d3d20]">
                  Cleared
                </div>
                <div className="mt-2 text-4xl font-black text-[#22170f]">{completed}</div>
                <div className="text-sm text-[#6a503b]">words completed</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-white/55 p-4">
            <div className="mb-3 flex items-center justify-between text-sm font-bold uppercase tracking-[0.18em] text-[#7d3d20]">
              <span>Mission progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-3 rounded-full bg-[#ead9c4]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#de5a37,#f6c453)] transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </section>

        <section className="stage-card bg-[rgba(255,251,245,0.92)]">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-extrabold uppercase tracking-[0.28em] text-[#7d3d20]">
                  Current prompt
                </div>
                {prompt != null ? (
                  <div className="mt-3 rounded-[1.5rem] border border-black/10 bg-[#fff7e8] px-5 py-4 text-3xl font-extrabold text-[#2f2218] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                    {prompt}
                  </div>
                ) : (
                  <p className="mt-3 max-w-md text-base leading-7 text-[#5f4b3b]">
                    No visual hint this round. Press play and spell the word from audio.
                  </p>
                )}
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-black/10 bg-[#f6c453]/60 text-[#7d3d20]">
                <Volume2 className="h-7 w-7" />
              </div>
            </div>

            {status !== 'question' && (
              <div className="rounded-[1.5rem] border border-black/10 bg-white/60 px-5 py-4">
                <div
                  className={`text-center text-xl font-black ${
                    status === 'correct' ? 'text-[#2f7a45]' : 'text-[#b24328]'
                  }`}
                >
                  {status === 'correct' ? 'Correct! 🎉' : 'Try again! 🙈'}
                </div>
                <div className="mt-4 text-center">
                  <WordDiff expected={word} actual={answer} />
                </div>
              </div>
            )}

            {showPlayButton && (
              <Button
                type="button"
                onClick={handleSpeak}
                aria-label="Play word"
                className="h-16 w-full rounded-[1.5rem] border border-black/10 bg-[#de5a37] text-base font-extrabold text-white shadow-[0_16px_30px_rgba(222,90,55,0.28)] hover:bg-[#c94d2d]"
              >
                <Play className="h-5 w-5" />
                Play word
              </Button>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onSelect={(e) => {
                  cursorPositionRef.current = e.currentTarget.selectionStart;
                }}
                className="h-20 rounded-[1.75rem] border-black/10 bg-white px-6 text-center text-3xl font-bold tracking-[0.08em] text-[#22170f] shadow-[inset_0_2px_0_rgba(255,255,255,0.65)] placeholder:text-[#9d8a79] focus-visible:ring-[#de5a37]"
                placeholder={status === 'retry' ? 'Type it again...' : 'Type here...'}
                disabled={status === 'correct'}
                spellCheck={false}
              />

              <SpecialCharactersKeyboard word={word} onCharacterClick={handleSpecialCharClick} />
            </form>

            <Button
              type="button"
              onClick={handleSkip}
              variant="ghost"
              className="h-12 w-full rounded-[1.25rem] border border-black/10 bg-white/40 font-bold text-[#7d3d20] hover:bg-white/70 hover:text-[#2f2218]"
            >
              <X className="h-4 w-4" />
              Skip
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
