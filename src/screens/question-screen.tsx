import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeech } from "../hooks/use-speech";
import { BotIcon as Robot, Play } from "lucide-react";
import type { WordResult } from "../types";
import type React from "react";
import { WordDiff } from "../components/word-diff";

interface QuestionScreenProps {
  word: string;
  onAnswer: (result: WordResult) => void;
  progress: {
    remaining: number;
    completed: number;
    currentStreak: number;
    currentMistakes: number;
  };
}

export default function QuestionScreen({
  word,
  onAnswer,
  progress,
}: QuestionScreenProps) {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [retryMode, setRetryMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const retryInputRef = useRef<HTMLInputElement>(null);
  const { speak } = useSpeech();

  const isCorrect = input.toLowerCase().trim() === word.toLowerCase().trim();

  useEffect(() => {
    const id = setTimeout(() => {
      speak(word);
      inputRef.current?.focus();
    }, 150);

    return () => clearTimeout(id);
  }, [word]);

  useEffect(() => {
    if (retryMode && retryInputRef.current) {
      retryInputRef.current.focus();
    }
  }, [retryMode]);

  const handleSpeak = () => {
    speak(word);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!showResult) {
      setShowResult(true);

      if (!isCorrect) {
        setRetryMode(true);
        setAnswer(input);
        setInput("");
      } else {
        setAnswer(input);
        // If correct, proceed after delay with all accumulated attempts
        setTimeout(() => {
          onAnswer({
            word,
            correct: true,
            attempt: input,
          });
          setInput("");
          setAnswer("");
          setShowResult(false);
          setRetryMode(false);
        }, 1500);
      }
    }
  };

  const handleRetrySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isRetryCorrect =
      input.toLowerCase().trim() === word.toLowerCase().trim();
    if (isRetryCorrect) {
      setAnswer(input);
      setTimeout(() => {
        onAnswer({
          word,
          correct: false,
          attempt: input,
        });
        setInput("");
        setAnswer("");
        setShowResult(false);
        setRetryMode(false);
      }, 1500);
    } else {
      setAnswer(input);
      setInput("");
      if (retryInputRef.current) {
        retryInputRef.current.focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <Robot className="w-24 h-24 mx-auto text-purple-300 animate-bounce" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Type what you hear!
          </h2>

          {/* Progress information */}
          <div className="flex justify-between text-purple-200 text-sm mb-4">
            <span>Words remaining: {progress.remaining}</span>
            <span>Completed: {progress.completed}</span>
          </div>
          <div className="bg-white/10 rounded-full h-2 mb-4">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  (progress.completed /
                    (progress.remaining + progress.completed)) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="space-y-4">
            {/* Show diff of the original attempt */}
            {showResult && (
              <div className="text-center space-y-6 py-2">
                <div
                  className={`text-xl font-bold ${
                    isCorrect ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isCorrect ? "🎉 Correct! 🎉" : "Try again!"}
                </div>
                <WordDiff expected={word} actual={answer} />
              </div>
            )}

            <Button
              type="button"
              onClick={handleSpeak}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl"
            >
              <Play className="mr-2" style={{ height: "24", width: "24" }} />
            </Button>

            {/* Original attempt form */}
            {!retryMode && (
              <form onSubmit={handleSubmit}>
                <Input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full text-center text-2xl bg-white/20 text-white placeholder:text-purple-200"
                  placeholder="Type the word here..."
                  disabled={showResult}
                />
              </form>
            )}

            {/* Retry form */}
            {retryMode && (
              <form onSubmit={handleRetrySubmit} className="mt-4">
                <div className="relative">
                  <Input
                    ref={retryInputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full text-center text-2xl bg-white/20 text-white placeholder:text-purple-200 pr-12"
                    placeholder="Type it again..."
                    autoFocus
                  />
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
