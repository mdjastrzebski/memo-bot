export type Language = {
  code: string;
  name: string;
  voice: string;
  flag: string;
};

export const LANGUAGES: Language[] = [
  { code: 'en-GB', name: 'English (UK)', voice: 'en-GB', flag: '🇬🇧' },
  { code: 'en-US', name: 'English (US)', voice: 'en-US', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Spanish', voice: 'es-ES', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', voice: 'fr-FR', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', voice: 'de-DE', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', voice: 'it-IT', flag: '🇮🇹' },
  { code: 'pt-PT', name: 'Portuguese', voice: 'pt-PT', flag: '🇵🇹' },
  { code: 'pl-PL', name: 'Polish', voice: 'pl-PL', flag: '🇵🇱' },
];

export function getLanguageByCode(code: string): Language {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0];
}

export function isSupportedLanguageCode(code: string): boolean {
  return LANGUAGES.some((language) => language.code === code);
}
