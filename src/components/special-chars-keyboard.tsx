import { Button } from './ui/button';

interface SpecialCharactersKeyboardProps {
  word: string;
  onCharacterClick: (char: string) => void;
}

export function SpecialCharactersKeyboard({
  word,
  onCharacterClick,
}: SpecialCharactersKeyboardProps) {
  const specialChars = extractNonLatinChars(word);

  if (specialChars.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap justify-center gap-2">
      {specialChars.map((char) => (
        <Button
          key={char}
          type="button"
          variant="outline"
          onClick={() => onCharacterClick(char)}
          className="h-11 min-w-11 rounded-[1rem] border border-black/10 bg-white px-3 text-lg font-bold text-[#2f2218] shadow-[0_8px_18px_rgba(98,61,31,0.12)] transition-all hover:bg-[#fff7e8] hover:text-[#7d3d20] active:translate-y-0.5"
        >
          {char}
        </Button>
      ))}
    </div>
  );
}

function extractNonLatinChars(word: string): string[] {
  const latinRegex = /[a-zA-Z0-9\s.,!?'"()[\]{}-]/;

  const nonLatinChars = new Set<string>();
  for (const char of word) {
    if (!latinRegex.test(char)) {
      nonLatinChars.add(char);
    }
  }

  return Array.from(nonLatinChars).sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!);
}
