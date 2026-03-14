import { useState } from 'react';
import { ArrowRight, NotebookPen, Rocket, Sparkles } from 'lucide-react';

import { AppShell } from '../components/app-shell';
import { LanguageSelector } from '../components/language-selector';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useGameState } from '../stores/game-store';
import type { Word } from '../types';
import { LANGUAGES } from '../utils/languages';
import { normalizeInputText } from '../utils/text-normalization';

const DEFAULT_WORDS = ['robot', 'spaceship', 'rocket', 'moon', 'star'];

export default function InputScreen() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const startGame = useGameState((state) => state.startGame);

  const handleSubmit = () => {
    const words = parseWords(text);
    startGame(words, language);
  };

  const preparedWords = parseWords(text);

  return (
    <AppShell>
      <div className="grid items-center gap-6 lg:grid-cols-[1.02fr_1.18fr]">
        <section className="space-y-6">
          <div className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            Spelling Mission Control
          </div>
          <div className="space-y-4">
            <h1 className="display-title max-w-xl text-5xl font-black leading-[0.92] text-[#22170f] sm:text-6xl">
              Memo Bot
            </h1>
            <p className="max-w-lg text-lg leading-8 text-[#5f4b3b]">
              Enter your spelling words below, one per line! Turn the drill into a playful mission
              board with quick repeats, speech prompts, and a clean review at the end.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stage-card bg-[rgba(246,196,83,0.23)]">
              <div className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#7d3d20]">
                Rhythm
              </div>
              <div className="mt-3 text-2xl font-extrabold text-[#22170f]">Hear. Type. Repeat.</div>
            </div>
            <div className="stage-card bg-[rgba(222,90,55,0.12)]">
              <div className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#7d3d20]">
                Prep
              </div>
              <div className="mt-3 text-2xl font-extrabold text-[#22170f]">
                {preparedWords.length} words ready
              </div>
            </div>
            <div className="stage-card bg-[rgba(86,120,102,0.12)]">
              <div className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#7d3d20]">
                Prompt
              </div>
              <div className="mt-3 text-2xl font-extrabold text-[#22170f]">Use `word|hint`</div>
            </div>
          </div>
        </section>

        <section className="stage-card max-w-2xl bg-[rgba(255,251,245,0.92)]">
          <div className="absolute right-5 top-5 flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-black/10 bg-[#de5a37] text-white shadow-[0_14px_26px_rgba(222,90,55,0.34)]">
            <NotebookPen className="h-7 w-7" />
          </div>

          <div className="max-w-xl space-y-6">
            <div className="space-y-2">
              <div className="text-sm font-extrabold uppercase tracking-[0.28em] text-[#7d3d20]">
                Build your word list
              </div>
              <p className="text-base leading-7 text-[#5f4b3b]">
                Add one word per line. If you want a visual clue instead of audio, add a prompt
                after a pipe.
              </p>
            </div>

            <LanguageSelector value={language} onChange={setLanguage} />

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Enter words here...\n${DEFAULT_WORDS.join('\n')}`}
              className="min-h-[260px] rounded-[1.5rem] border-black/10 bg-white/80 px-5 py-4 text-lg leading-8 text-[#2f2218] placeholder:text-[#9d8a79] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] focus-visible:ring-[#de5a37]"
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-white/50 px-4 py-3 text-sm leading-6 text-[#6a503b]">
                Example:
                <span className="ml-2 font-semibold text-[#2f2218]">
                  bonjour|Say hello in French
                </span>
              </div>

              <Button
                onClick={handleSubmit}
                className="h-14 rounded-[1.4rem] border border-black/10 bg-[#de5a37] px-6 text-base font-extrabold text-white shadow-[0_16px_30px_rgba(222,90,55,0.32)] transition-transform hover:-translate-y-0.5 hover:bg-[#c94d2d]"
              >
                <Rocket className="h-5 w-5" />
                Launch Mission
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function parseWords(text: string): Word[] {
  const input = text.trim() ? text.split('\n') : DEFAULT_WORDS;
  const words: Word[] = [];
  for (const line of input) {
    const [word, prompt] = normalizeInputText(line).split('|');
    const trimmedWord = word.trim();
    if (trimmedWord.length > 0) {
      words.push({ word: trimmedWord, prompt: prompt?.trim() });
    }
  }

  return words;
}
