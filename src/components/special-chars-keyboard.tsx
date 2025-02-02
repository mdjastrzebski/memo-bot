import { Button } from './ui/button';

interface SpecialCharactersKeyboardProps {
  characters: string[];
  onCharacterClick: (char: string) => void;
}

export function SpecialCharactersKeyboard({
  characters,
  onCharacterClick,
}: SpecialCharactersKeyboardProps) {
  if (characters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2 justify-center">
      {characters.map((char) => (
        <Button
          key={char}
          type="button"
          variant="outline"
          onClick={() => onCharacterClick(char)}
          className="w-[40px] h-10 text-lg font-medium bg-white/10 border-white/20 
            hover:bg-white/20 hover:border-white/30 text-white 
            transform active:translate-y-0.5 active:shadow-none transition-all
            rounded-lg"
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
