export type Language = {
  code: string;
  name: string;
  voice: string;
  flag: string;
};

export const LANGUAGES: Language[] = [
  { code: 'en-US', name: 'English (US)', voice: 'en-US', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', voice: 'en-GB', flag: '🇬🇧' },
  { code: 'pl-PL', name: 'Polish', voice: 'pl-PL', flag: '🇵🇱' },
  { code: 'es-ES', name: 'Spanish', voice: 'es-ES', flag: '🇪🇸' },
  { code: 'pt-PT', name: 'Portuguese', voice: 'pt-PT', flag: '🇵🇹' },
];

export type SpecialCharacters = {
  [key: string]: string[]; // language code -> special characters
};

export const SPECIAL_CHARACTERS: SpecialCharacters = {
  'en-US': [],
  'en-GB': [],
  'pl-PL': ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż'],
  'es-ES': ['á', 'é', 'í', 'ñ', 'ó', 'ú', 'ü', '¿', '¡'],
  'pt-PT': ['ã', 'á', 'à', 'â', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'],
};
