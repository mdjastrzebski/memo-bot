import { useEffect, useRef, useState } from 'react';
import { BotIcon as Robot, Play, X } from 'lucide-react';
import type React from 'react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { WordDiff } from '../components/word-diff';
import type { WordResult } from '../types';
import { SPECIAL_CHARACTERS, type Language } from '../utils/languages';
import { playCorrect } from '../utils/sounds';
import { speak } from '../utils/speak';
import { SpecialCharactersKeyboard } from '../components/special-chars-keyboard';

const CORRECT_STATE_DURATION = 1000;

export type QuestionScreenProps = {
  word: string;
  language: Language;
  onAnswer: (result: WordResult) => void;
  remaining: number;
  completed: number;
};

type State = 'question' | 'retry' | 'correct';

export default function QuestionScreen({
  word,
  language,
  onAnswer,
  remaining,
  completed,
}: QuestionScreenProps) {
  const [state, setState] = useState<State>('question');
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const initialSoundPlayed = useRef(false);

  useEffect(() => {
    // Prevent initial sound from playing twice in strict mode
    if (initialSoundPlayed.current) return;
    initialSoundPlayed.current = true;

    speak(word, language);
    inputRef.current?.focus();
  }, [word, language]);

  const handleSpeak = () => {
    speak(word, language);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedInput = normalizeText(input);
    const normalizedWord = normalizeText(word);

    const isCorrect = normalizedInput === normalizedWord;
    if (!isCorrect) {
      speak(word, language);
      setState('retry');
      setAnswer(input);
      setInput('');
      return;
    }

    playCorrect();
    const isFirstAttempt = state === 'question';
    setState('correct');
    setAnswer(input);
    setTimeout(() => {
      onAnswer({
        word,
        isCorrect: isFirstAttempt,
      });
    }, CORRECT_STATE_DURATION);
  };

  const handleSkip = () => {
    setState('correct');
    onAnswer({
      word,
      isCorrect: false,
      skipped: true,
    });
  };

  const progressPercentage = (completed / (remaining + completed)) * 100;

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
            {state !== 'question' && (
              <div className="text-center space-y-6 py-2">
                <div
                  className={`text-xl font-bold ${
                    state === 'correct' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {state === 'correct' ? 'Correct! 🎉' : 'Try again! 🙈'}
                </div>
                <WordDiff expected={word} actual={answer} />
              </div>
            )}

            <Button
              type="button"
              onClick={handleSpeak}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center"
            >
              <Play className="mr-2" style={{ height: '24', width: '24' }} />
            </Button>

            <div className="h-2" />

            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <Input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full text-center text-3xl h-16 bg-white/20 text-white placeholder:text-purple-200"
                  placeholder={state === 'retry' ? 'Type it again...' : 'Type here...'}
                  disabled={state === 'correct'}
                  spellCheck={false}
                />

                <SpecialCharactersKeyboard
                  characters={SPECIAL_CHARACTERS[language.code]}
                  onCharacterClick={(char) => setInput((prev) => prev + char)}
                />
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
const normalizeText = (text: string): string => {
  return text.toLowerCase().trim().replace(/\s+/g, ' ').replace(/\.+$/, '');
};
