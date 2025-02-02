export function speak(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = 0.6; // Slightly slower for children
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}
