import { useEffect, useRef, useState } from 'react';
import { BotIcon as Robot, Play, X } from 'lucide-react';
import type React from 'react';

import { SpecialCharactersKeyboard } from '../components/special-chars-keyboard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { WordDiff } from '../components/word-diff';
import { useGameState } from '../stores/game-store';
import { useCurrentWord } from '../stores/selectors';
import { playCorrect } from '../utils/sounds';
import { speak } from '../utils/speak';

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

  const [questionStatus, setQuestionStatus] = useState<QuestionStatus>('question');
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number | null>(null);

  const initialSoundPlayed = useRef<string | null>(null);

  const word = currentWord?.word ?? '';
  const prompt = currentWord?.prompt;

  useEffect(() => {
    if (!currentWord) return;

    // Reset local state when word changes
    setQuestionStatus('question');
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

  if (!currentWord) {
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

    const normalizedInput = normalizeInput(input);
    const normalizedWord = normalizeInput(word);

    // Use accent-insensitive comparison if ignoreAccents is true
    const isCorrect = ignoreAccents
      ? normalizedInput.localeCompare(normalizedWord, undefined, { sensitivity: 'base' }) === 0
      : normalizedInput === normalizedWord;

    if (!isCorrect) {
      speak(word, language);
      setQuestionStatus('retry');
      setAnswer(input);
      setInput('');
      return;
    }

    playCorrect();
    if (prompt != null) speak(word, language);

    const isFirstAttempt = questionStatus === 'question';
    setQuestionStatus('correct');
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

    setQuestionStatus('correct');
    skipWord(currentWord);
  };

  const progressPercentage = (completed / (remaining + completed)) * 100;

  const showPlayButton = prompt == null || questionStatus !== 'question';

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <Robot className="w-24 h-24 mx-auto text-purple-300 animate-bounce" />
          <h2 className="text-2xl font-bold text-white mb-4">Type what you hear!</h2>

          <div className="flex justify-between text-purple-200 text-sm mb-4">
            <span>To do: {remaining}</span>
            <span>Done: {completed}</span>
          </div>
          <div className="bg-white/10 rounded-full h-2 mb-4">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="space-y-4">
            {questionStatus !== 'question' && (
              <div className="text-center space-y-6 py-2">
                <div
                  className={`text-xl font-bold ${
                    questionStatus === 'correct' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {questionStatus === 'correct' ? 'Correct! 🎉' : 'Try again! 🙈'}
                </div>
              </div>
            )}

            {prompt != null && (
              <div className="text-3xl text-center text-purple-100 my-4">{prompt}</div>
            )}

            {questionStatus !== 'question' && (
              <div className="text-center space-y-6 py-2">
                <WordDiff expected={word} actual={answer} />
              </div>
            )}

            {showPlayButton && (
              <Button
                type="button"
                onClick={handleSpeak}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center"
              >
                <Play className="mr-2" style={{ height: '24', width: '24' }} />
              </Button>
            )}

            <div className="h-2" />

            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <Input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  onSelect={(e) => {
                    cursorPositionRef.current = e.currentTarget.selectionStart;
                  }}
                  className="w-full text-center text-3xl h-16 bg-white/20 text-white placeholder:text-purple-200"
                  placeholder={questionStatus === 'retry' ? 'Type it again...' : 'Type here...'}
                  disabled={questionStatus === 'correct'}
                  spellCheck={false}
                />

                <SpecialCharactersKeyboard word={word} onCharacterClick={handleSpecialCharClick} />
              </div>
            </form>

            <div className="h-4" />

            <Button
              type="button"
              onClick={handleSkip}
              variant="ghost"
              className="w-full text-purple-300 hover:bg-purple-800/30 hover:text-white border border-purple-500/30"
            >
              <X className="mr-2" style={{ height: '20', width: '20' }} />
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Function to normalize text by:
// - converting to lowercase
// - trimming
// - replacing multiple spaces with single spaces
// - removing trailing dots
const normalizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ').replace(/\.+$/, '');
};
