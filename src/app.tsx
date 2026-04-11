import { Footer } from './components/footer';
import { Toaster } from './components/ui/toaster';
import { useBeforeUnload } from './hooks/use-before-unload';
import { useLearningSession } from './hooks/use-learning-session';
import InputScreen from './screens/input-screen';
import QuestionScreen from './screens/question-screen';
import ResultsScreen from './screens/results-screen';
import { useCurrentWord, useGameStatus } from './stores/selectors';

function LearningSessionController() {
  useLearningSession();
  return null;
}

export default function App() {
  const status = useGameStatus();
  const currentWord = useCurrentWord();

  useBeforeUnload(status === 'learning');

  if (status === 'initial') {
    return (
      <>
        <InputScreen />
        <Footer />
        <Toaster />
      </>
    );
  }

  if (status === 'finished') {
    return (
      <>
        <ResultsScreen />
        <Footer />
        <Toaster />
      </>
    );
  }

  if (!currentWord) {
    // This should not happen
    return null;
  }

  return (
    <>
      <LearningSessionController />
      <QuestionScreen
        key={`${currentWord.word}-${currentWord.correctStreak}-${currentWord.incorrectCount}`}
      />
      <Footer />
      <Toaster />
    </>
  );
}
