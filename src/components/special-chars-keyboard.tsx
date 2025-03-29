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
    <div className="flex flex-wrap gap-1 mt-2 justify-center">
      {specialChars.map((char) => (
        <Button
          key={char}
          type="button"
          variant="outline"
          onClick={() => onCharacterClick(char)}
          className="w-[36px] h-10 text-lg font-medium bg-white/10 border-white/20 
            hover:bg-white/20 hover:border-white/30 text-white 
            transform active:translate-y-0.5 active:shadow-none transition-all
            rounded-lg m-0.5"
          style={{
            boxShadow: '0 4px 0 rgba(255,255,255,0.1)',
          }}
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
