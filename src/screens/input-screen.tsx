import { useState } from 'react';
import { ArrowRight, BotIcon as Robot, Rocket } from 'lucide-react';

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
      <div className="mx-auto w-full max-w-3xl">
        <section className="stage-card bg-[rgba(255,251,245,0.92)]">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[rgba(222,90,55,0.12)] p-4 text-[#de5a37]">
                <Robot className="h-full w-full" />
              </div>
              <div className="space-y-2">
                <h1 className="display-title text-5xl font-black leading-[0.95] text-[#22170f] sm:text-6xl">
                  Memo Bot
                </h1>
                <p className="text-2xl font-extrabold text-[#5b4636]">Type your spelling words.</p>
              </div>
            </div>

            <LanguageSelector value={language} onChange={setLanguage} />

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Enter words here...\n${DEFAULT_WORDS.join('\n')}`}
              className="min-h-[260px] rounded-[1.5rem] border-black/10 bg-white/80 px-5 py-4 text-lg leading-8 text-[#2f2218] placeholder:text-[#9d8a79] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] focus-visible:ring-[#de5a37]"
            />

            <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-white/50 px-4 py-3 text-base font-semibold text-[#6a503b]">
              {preparedWords.length} words
            </div>

            <Button
              onClick={handleSubmit}
              className="h-16 w-full rounded-[1.4rem] border border-black/10 bg-[#de5a37] px-6 text-xl font-extrabold text-white shadow-[0_16px_30px_rgba(222,90,55,0.32)] transition-transform hover:-translate-y-0.5 hover:bg-[#c94d2d]"
            >
              <Rocket className="h-6 w-6" />
              Launch Mission
              <ArrowRight className="h-6 w-6" />
            </Button>
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
