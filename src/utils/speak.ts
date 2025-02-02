import type { Language } from './languages';

export function speak(text: string, language: Language) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language.code;
  utterance.rate = 0.6; // Slightly slower for children
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}
