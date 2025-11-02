import { Footer } from './components/footer';
import { useBeforeUnload } from './hooks/use-before-unload';
import InputScreen from './screens/input-screen';
import QuestionScreen from './screens/question-screen';
import ResultsScreen from './screens/results-screen';
import { useGameStore } from './stores/game-store';

export default function App() {
  const isSetupState = useGameStore((state) => state.isSetupState());
  const isResultsState = useGameStore((state) => state.isResultsState());
  const isLearningState = useGameStore((state) => state.isLearningState());
  const currentWord = useGameStore((state) => state.getCurrentWord());

  useBeforeUnload(isLearningState);

  if (isSetupState) {
    return (
      <>
        <InputScreen />
        <Footer />
      </>
    );
  }

  if (isResultsState) {
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
