import { Play, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';

import { AppShell } from '../components/app-shell';
import { SpecialCharactersKeyboard } from '../components/special-chars-keyboard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { WordDiff } from '../components/word-diff';
import { useGameState } from '../stores/game-store';
import { useCurrentWord } from '../stores/selectors';
import { getLanguageByCode } from '../utils/languages';
import { playCorrect } from '../utils/sounds';
import { speak } from '../utils/speak';
import { normalizeAnswerText } from '../utils/text-normalization';

const CORRECT_STATE_DURATION = 1000;

type QuestionStatus = 'question' | 'retry' | 'correct';

export default function QuestionScreen() {
  const currentWord = useCurrentWord();
  const language = useGameState((state) => getLanguageByCode(state.setup.languageCode));
  const exerciseType = useGameState((state) => state.setup.exerciseType);
  const remaining = useGameState((state) => state.pendingWords.length);
  const completed = useGameState((state) => state.completedWords.length);
  const correctAnswer = useGameState((state) => state.correctAnswer);
  const incorrectAnswer = useGameState((state) => state.incorrectAnswer);
  const skipWord = useGameState((state) => state.skipWord);
  const recordSessionActivity = useGameState((state) => state.recordSessionActivity);

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
    recordSessionActivity();
    speak(word, language);
    inputRef.current?.focus();
  };

  // Track cursor position when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    recordSessionActivity();
    setInput(e.target.value);
    cursorPositionRef.current = e.target.selectionStart;
  };

  // Handle special character insertion
  const handleSpecialCharClick = (char: string) => {
    recordSessionActivity();
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

    recordSessionActivity();

    const normalizedInput = normalizeAnswerText(input);
    const normalizedWord = normalizeAnswerText(word);

    // Relaxed mode ignores case and accent marks; strict mode requires an exact match.
    const isCorrect =
      exerciseType === 'relaxed'
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
    recordSessionActivity();

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
  const showSpecialCharactersKeyboard = exerciseType !== 'strict';

  return (
    <AppShell className="items-center">
      <div className="w-full max-w-4xl space-y-5">
        <section className="stage-card bg-[rgba(246,196,83,0.18)] dark:bg-[rgba(59,50,22,0.42)]">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-[1.25rem] border border-black/10 bg-white/65 px-5 py-3 text-center dark:border-white/15 dark:bg-[rgba(255,255,255,0.1)] sm:min-w-[148px]">
              <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#7d3d20] dark:text-[#f7d27a]">
                Done
              </div>
              <div className="text-3xl font-black text-[#22170f] dark:text-[#f8f1e6]">
                {completed}
              </div>
            </div>

            <div className="flex-1 px-1">
              <div className="h-10 rounded-full bg-[#ead9c4] p-1.5 dark:bg-[#3a404d]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#de5a37,#f6c453)] transition-all duration-300"
                  style={{ width: `${Math.max(progressPercentage, 8)}%` }}
                />
              </div>
              <div className="mt-2 text-center text-xl font-black text-[#7d3d20] dark:text-[#f4c15d]">
                {Math.round(progressPercentage)}%
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-black/10 bg-white/65 px-5 py-3 text-center dark:border-white/15 dark:bg-[rgba(255,255,255,0.1)] sm:min-w-[148px]">
              <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#7d3d20] dark:text-[#f7d27a]">
                Left
              </div>
              <div className="text-3xl font-black text-[#22170f] dark:text-[#f8f1e6]">
                {remaining}
              </div>
            </div>
          </div>
        </section>

        <section className="stage-card bg-[rgba(255,251,245,0.92)] dark:bg-[rgba(29,34,46,0.92)]">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-[#de5a37]">
                  <Volume2 className="h-8 w-8" />
                </div>
                <h2 className="display-title text-3xl font-black leading-tight text-[#22170f] dark:text-[#f8f1e6] sm:text-4xl">
                  {prompt != null ? 'Type the word!' : 'Type what you hear!'}
                </h2>
              </div>
            </div>

            {prompt != null ? (
              <div className="py-2 text-center text-3xl font-black text-[#2f2218] dark:text-[#f3eadf] sm:text-4xl">
                {prompt}
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleSpeak}
                aria-label="Play word"
                className="h-16 w-full rounded-[1.5rem] border border-black/10 bg-[#de5a37] text-xl font-extrabold text-white shadow-[0_16px_30px_rgba(222,90,55,0.28)] hover:bg-[#c94d2d]"
              >
                <Play className="h-6 w-6" />
                Play word
              </Button>
            )}

            {status !== 'question' && (
              <div className="rounded-[1.5rem] border border-black/10 bg-white/60 px-5 py-4 dark:border-white/10 dark:bg-white/5">
                <div
                  className={`text-center text-2xl font-black ${
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

            {showPlayButton && prompt != null && (
              <Button
                type="button"
                onClick={handleSpeak}
                aria-label="Play word"
                className="h-16 w-full rounded-[1.5rem] border border-black/10 bg-[#de5a37] text-xl font-extrabold text-white shadow-[0_16px_30px_rgba(222,90,55,0.28)] hover:bg-[#c94d2d]"
              >
                <Play className="h-6 w-6" />
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
                className="h-20 rounded-[1.75rem] border-black/10 bg-white px-6 text-center text-3xl font-bold tracking-[0.08em] text-[#22170f] shadow-[inset_0_2px_0_rgba(255,255,255,0.65)] placeholder:text-[#9d8a79] focus-visible:ring-[#de5a37] dark:border-white/10 dark:bg-[rgba(19,23,32,0.82)] dark:text-[#f3eadf] dark:placeholder:text-[#8b8f9a] dark:shadow-none"
                placeholder={status === 'retry' ? 'Type it again...' : 'Type here...'}
                disabled={status === 'correct'}
                spellCheck={false}
              />

              {showSpecialCharactersKeyboard && (
                <SpecialCharactersKeyboard word={word} onCharacterClick={handleSpecialCharClick} />
              )}
            </form>

            <Button
              type="button"
              onClick={handleSkip}
              variant="ghost"
              className="h-12 w-full rounded-[1.25rem] border border-black/10 bg-white/40 text-lg font-bold text-[#7d3d20] hover:bg-white/70 hover:text-[#2f2218] dark:border-white/10 dark:bg-white/5 dark:text-[#d7b780] dark:hover:bg-white/10 dark:hover:text-[#f3eadf]"
            >
              <X className="h-5 w-5" />
              Skip
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
