import { Footer } from './components/footer';
import { useBeforeUnload } from './hooks/use-before-unload';
import InputScreen from './screens/input-screen';
import QuestionScreen from './screens/question-screen';
import ResultsScreen from './screens/results-screen';
import { useCurrentWord, useGameStatus } from './stores/selectors';

export default function App() {
  const status = useGameStatus();
  const currentWord = useCurrentWord();

  useBeforeUnload(status === 'learning');

  if (status === 'initial') {
    return (
      <>
        <InputScreen />
        <Footer />
      </>
    );
  }

  if (status === 'finished') {
    return (
      <>
        <ResultsScreen />
        <Footer />
      </>
    );
  }

  if (!currentWord) {
    // This should not happen
    return null;
  }

  return (
    <>
      <QuestionScreen
        key={`${currentWord.word}-${currentWord.correctStreak}-${currentWord.incorrectCount}`}
      />
      <Footer />
    </>
  );
}
