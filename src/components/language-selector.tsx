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
    <div className="flex items-center gap-3 rounded-[1.25rem] border border-black/10 bg-white/70 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6c453]/60 text-[#7d3d20] dark:bg-[rgba(246,196,83,0.18)] dark:text-[#f4c15d]">
        <Globe2 className="h-5 w-5" />
      </div>
      <Select
        value={value.code}
        onValueChange={(code) => {
          const language = LANGUAGES.find((lang) => lang.code === code);
          if (language) onChange(language);
        }}
      >
        <SelectTrigger className="h-12 w-[200px] rounded-2xl border-black/10 bg-transparent text-base font-semibold text-[#2f2218] shadow-none ring-offset-transparent focus:ring-[#de5a37] dark:border-white/10 dark:text-[#f3eadf]">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span className="text-xl" role="img" aria-label={`Flag for ${value.name}`}>
                {value.flag}
              </span>
              {value.name}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-black/10 bg-[rgba(255,251,245,0.98)] text-[#2f2218] dark:border-white/10 dark:bg-[rgba(29,34,46,0.98)] dark:text-[#f3eadf]">
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="cursor-pointer rounded-xl">
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
