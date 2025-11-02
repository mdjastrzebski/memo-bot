import { useState } from 'react';
import { Rocket } from 'lucide-react';

import { LanguageSelector } from '../components/language-selector';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import type { Language } from '../utils/languages';
import { LANGUAGES } from '../utils/languages';

const DEFAULT_WORDS = ['robot', 'spaceship', 'rocket', 'moon', 'star'];

export interface WordsSubmitParams {
  words: string[];
  language: Language;
}

interface InputScreenProps {
  onWordsSubmit: (params: WordsSubmitParams) => void;
}

export default function InputScreen({ onWordsSubmit }: InputScreenProps) {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<Language>(LANGUAGES[0]);

  const handleSubmit = () => {
    const input = text.trim() ? text.split('\n') : DEFAULT_WORDS;
    const words = input.map((word: string) => word.trim()).filter((word) => word.length > 0);
    onWordsSubmit({ words, language });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Memo Bot 🤖</h1>
          <p className="text-purple-200">Enter your spelling words below, one per line!</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <LanguageSelector value={language} onChange={setLanguage} />

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Enter words here...\n${DEFAULT_WORDS.join('\n')}`}
            className="min-h-[200px] my-4 bg-white/20 text-white placeholder:text-purple-200"
          />

          <Button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg transform transition hover:scale-105"
          >
            <Rocket className="mr-2 h-5 w-5" />
            Launch Mission!
          </Button>
        </div>
      </div>
    </div>
  );
}
