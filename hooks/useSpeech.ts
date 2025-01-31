import { useCallback } from "react"

export function useSpeech() {
  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US"
    utterance.rate = 0.9 // Slightly slower for children
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }, [])

  return { speak }
}

