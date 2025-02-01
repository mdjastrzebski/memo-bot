import { useCallback } from "react";

export function useSpeech() {
  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = 0.6; // Slightly slower for children
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak };
}
