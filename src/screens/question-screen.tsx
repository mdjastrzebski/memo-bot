import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeech } from "../hooks/use-speech";
import { BotIcon as Robot, Play } from "lucide-react";
import type { WordResult } from "../types";
import type React from "react";
import { WordDiff } from "../components/word-diff";

export type QuestionScreenProps = {
  word: string;
  onAnswer: (result: WordResult) => void;
  progress: {
    remaining: number;
    completed: number;
  };
};

type State = "question" | "retry" | "correct";

export default function QuestionScreen({
  word,
  onAnswer,
  progress,
}: QuestionScreenProps) {
  const [state, setState] = useState<State>("question");
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { speak } = useSpeech();

  useEffect(() => {
    const id = setTimeout(() => {
      speak(word);
      inputRef.current?.focus();
    }, 150);

    return () => clearTimeout(id);
  }, [word]);

  const handleSpeak = () => {
    speak(word);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isCorrect = input.toLowerCase().trim() === word.toLowerCase().trim();
    if (!isCorrect) {
      speak(word);
      setState("retry");
      setAnswer(input);
      setInput("");
      return;
    }

    const isFirstAttempt = state === "question";
    setState("correct");
    setAnswer(input);
    setTimeout(() => {
      onAnswer({
        word,
        correct: isFirstAttempt,
        attempt: input,
      });
    }, 1000);
  };

  const progressPercentage =
    (progress.completed / (progress.remaining + progress.completed)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <Robot className="w-24 h-24 mx-auto text-purple-300 animate-bounce" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Type what you hear!
          </h2>

          <div className="flex justify-between text-purple-200 text-sm mb-4">
            <span>To do: {progress.remaining}</span>
            <span>Done: {progress.completed}</span>
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
            {state !== "question" && (
              <div className="text-center space-y-6 py-2">
                <div
                  className={`text-xl font-bold ${
                    state === "correct" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {state === "correct" ? "🎉 Correct! 🎉" : "Try again!"}
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

            <form onSubmit={handleSubmit}>
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full text-center text-2xl bg-white/20 text-white placeholder:text-purple-200"
                placeholder={
                  state === "retry" ? "Type it again..." : "Type here..."
                }
                disabled={state === "correct"}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
