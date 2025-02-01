export function playCorrect() {
  const audio = new Audio('/sounds/correct.wav');
  audio.volume = 0.5;
  audio.play();
}

export function playWrong() {
  const audio = new Audio('/sounds/wrong.wav');
  audio.volume = 0.5;
  audio.play();
}

export function playCompleted() {
  const audio = new Audio('/sounds/completed.mp3');
  audio.volume = 0.5;
  audio.play();
}
