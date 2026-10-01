import type { Language } from '../utils/languages';
import { LANGUAGES } from '../utils/languages';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <Select
      value={value.code}
      onValueChange={(code) => {
        const language = LANGUAGES.find((lang) => lang.code === code);
        if (language) onChange(language);
      }}
    >
      <SelectTrigger
        aria-label="Language"
        className="h-14 w-auto shrink-0 gap-2 rounded-[1.25rem] border-black/10 bg-white/70 px-3.5 text-base font-semibold sm:h-16 sm:gap-3 sm:px-5 sm:text-lg text-[#2f2218] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ring-offset-transparent focus:ring-[#de5a37] dark:border-white/10 dark:bg-white/5 dark:text-[#f3eadf] dark:shadow-none"
      >
        <SelectValue>
          <span className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl" role="img" aria-label={`Flag for ${value.name}`}>
              {value.flag}
            </span>
            <span className="hidden sm:inline">{value.name}</span>
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
  );
}
