import { Globe2 } from 'lucide-react';

import type { Language } from '../utils/languages';
import { LANGUAGES } from '../utils/languages';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
      <Globe2 className="w-5 h-5 text-purple-300" />
      <Select
        value={value.code}
        onValueChange={(code) => {
          const language = LANGUAGES.find((lang) => lang.code === code);
          if (language) onChange(language);
        }}
      >
        <SelectTrigger className="w-[180px] bg-transparent border-white/20 text-white">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span className="text-xl" role="img" aria-label={`Flag for ${value.name}`}>
                {value.flag}
              </span>
              {value.name}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="text-xl" role="img" aria-label={`Flag for ${lang.name}`}>
                  {lang.flag}
                </span>
                {lang.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
