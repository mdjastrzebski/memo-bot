import {
  ArrowRight,
  BookOpen,
  BotIcon as Robot,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleDotDashed,
  MessageSquareText,
  Rocket,
  SlidersHorizontal,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { AppShell } from '../components/app-shell';
import { LanguageSelector } from '../components/language-selector';
import { SegmentedControl } from '../components/segmented-control';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { toast } from '../hooks/use-toast';
import { cn } from '../lib/utils';
import { useGameState } from '../stores/game-store';
import type { Difficulty, InputSource, Exercise, Word, WordInput } from '../types';
import { getLanguageByCode } from '../utils/languages';
import {
  getWordTier,
  getWordTierCounts,
  loadWordHistory,
  type WordTier,
  type WordTierCounts,
} from '../utils/word-history';
import { selectWordsForSession } from '../utils/word-selection';
import {
  type WordSetConfig,
  type WordSetSampleSize,
  getWordSetConfigs,
  getWordSetWords,
  parseWordSetEntry,
  WORD_SET_SAMPLE_SIZES,
} from '../utils/word-sets';

type WordSetLoadState = 'loading' | 'ready' | 'error';

function WordSetStatsDots({ stats }: { stats: WordTierCounts }) {
  return (
    <span
      className="flex items-center gap-2 text-xs font-semibold text-current tabular-nums opacity-70"
      title={`${stats.known} known · ${stats.learning} learning · ${stats['not-seen']} new`}
    >
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {stats.known}
      </span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        {stats.learning}
      </span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
        {stats['not-seen']}
      </span>
    </span>
  );
}

const WORD_TIER_DISPLAY: Record<WordTier, { label: string; icon: ReactNode }> = {
  'known': {
    label: 'Known',
    icon: <CircleCheck className="h-4 w-4 text-emerald-500" />,
  },
  'learning': {
    label: 'Learning',
    icon: <CircleDotDashed className="h-4 w-4 text-amber-500" />,
  },
  'not-seen': {
    label: 'New',
    icon: <Circle className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />,
  },
};

function WordSetWordList({ wordSetId, words }: { wordSetId: string; words: string[] }) {
  const entries = useMemo(() => {
    const history = loadWordHistory(wordSetId);
    return words.map((line) => {
      const { word, prompt } = parseWordSetEntry(line);
      return { word, prompt, tier: getWordTier(history, word) };
    });
  }, [wordSetId, words]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label="Words in set"
      className="max-h-72 overflow-y-auto rounded-[1.5rem] border border-black/10 bg-white/80 px-5 py-3 text-sm leading-7 text-[#2f2218] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:border-white/10 dark:bg-[rgba(19,23,32,0.82)] dark:text-[#f3eadf] dark:shadow-none"
    >
      {entries.map(({ word, prompt, tier }) => (
        <li key={word} className="flex items-center gap-2.5">
          <span
            role="img"
            aria-label={WORD_TIER_DISPLAY[tier].label}
            title={WORD_TIER_DISPLAY[tier].label}
          >
            {WORD_TIER_DISPLAY[tier].icon}
          </span>
          <span className="truncate">
            {word}
            {prompt ? (
              <span className="text-[#9d8a79] dark:text-[#8b8f9a]"> – {prompt}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function InputScreen() {
  const language = useGameState((state) => getLanguageByCode(state.setup.languageCode));
  const difficulty = useGameState((state) => state.setup.difficulty);
  const source = useGameState((state) => state.setup.source);
  const exercises = useGameState((state) => state.setup.exercises);
  const text = useGameState((state) => state.setup.manualText);
  const sampleSize = useGameState((state) => state.setup.sampleSize);
  const selectedWordSetId = useGameState((state) => state.setup.selectedWordSetId);
  const setLanguage = useGameState((state) => state.setLanguage);
  const setDifficulty = useGameState((state) => state.setDifficulty);
  const setSource = useGameState((state) => state.setSource);
  const setExercises = useGameState((state) => state.setExercises);
  const setManualText = useGameState((state) => state.setManualText);
  const setSampleSize = useGameState((state) => state.setSampleSize);
  const setSelectedWordSetId = useGameState((state) => state.setSelectedWordSetId);
  const [wordSetConfigs, setWordSetConfigs] = useState<WordSetConfig[]>([]);
  const [wordSetLoadState, setWordSetLoadState] = useState<WordSetLoadState>('loading');
  const [isStartingWordSet, setIsStartingWordSet] = useState(false);
  const [selectedWordSetWords, setSelectedWordSetWords] = useState<string[]>([]);
  const [wordSetStats, setWordSetStats] = useState<Record<string, WordTierCounts>>({});
  const [isWordListOpen, setIsWordListOpen] = useState(false);
  const startGame = useGameState((state) => state.startGame);

  useEffect(() => {
    let isCancelled = false;

    const loadWordSetConfigs = async () => {
      try {
        const configs = await getWordSetConfigs();
        if (isCancelled) return;

        setWordSetConfigs(configs);
        setWordSetLoadState('ready');
      } catch {
        if (isCancelled) return;

        setWordSetConfigs([]);
        setWordSetLoadState('error');
      }
    };

    void loadWordSetConfigs();

    return () => {
      isCancelled = true;
    };
  }, []);

  const availableWordSets = wordSetConfigs.filter(
    (config) => config.languageCode === language.code,
  );
  const selectedWordSet = availableWordSets.find((config) => config.id === selectedWordSetId);
  const preparedWordInputs = parseWordInputs(text);
  const preparedWords = buildExercises(preparedWordInputs, exercises);
  const hasPromptedWords =
    source === 'manual'
      ? preparedWordInputs.some((w) => w.prompt)
      : selectedWordSetWords.some((word) => parseWordSetEntry(word).prompt);
  const showSourceSelector = availableWordSets.length > 0;

  useEffect(() => {
    if (!selectedWordSet) {
      setSelectedWordSetWords([]);
      return;
    }

    let isCancelled = false;

    getWordSetWords(selectedWordSet)
      .then((words) => {
        if (!isCancelled) {
          setSelectedWordSetWords(words);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSelectedWordSetWords([]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedWordSet]);

  useEffect(() => {
    const sets = wordSetConfigs.filter((config) => config.languageCode === language.code);
    if (sets.length === 0) {
      setWordSetStats({});
      return;
    }

    let isCancelled = false;

    Promise.all(
      sets.map(async (config) => {
        const words = await getWordSetWords(config).catch(() => [] as string[]);
        const history = loadWordHistory(config.id);
        const counts = getWordTierCounts(
          history,
          words.map((line) => parseWordSetEntry(line).word),
        );
        return [config.id, counts] as const;
      }),
    ).then((entries) => {
      if (!isCancelled) {
        setWordSetStats(Object.fromEntries(entries));
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [wordSetConfigs, language.code]);

  useEffect(() => {
    if (availableWordSets.length === 0) {
      if (wordSetLoadState === 'loading') {
        return;
      }

      if (source !== 'manual') {
        setSource('manual');
      }
      return;
    }

    const nextSelectedWordSetId =
      availableWordSets.find((config) => config.id === selectedWordSetId)?.id ??
      availableWordSets[0].id;

    if (nextSelectedWordSetId !== selectedWordSetId) {
      setSelectedWordSetId(nextSelectedWordSetId);
    }
  }, [
    availableWordSets,
    selectedWordSetId,
    setSelectedWordSetId,
    setSource,
    source,
    wordSetLoadState,
  ]);

  const handleSourceChange = (nextSource: InputSource) => {
    if (nextSource === 'word-set' && !selectedWordSetId) {
      setSelectedWordSetId(availableWordSets[0]?.id || '');
    }

    setSource(nextSource);
  };

  const handleExerciseChange = (exercise: Exercise, checked: boolean) => {
    const nextExercises = checked
      ? [...exercises, exercise]
      : exercises.filter((selectedExercise) => selectedExercise !== exercise);

    if (nextExercises.length > 0) {
      setExercises(nextExercises);
    }
  };

  const handleSubmit = async () => {
    if (source === 'manual') {
      if (preparedWords.length === 0) {
        return;
      }

      startGame(preparedWords, language, difficulty, source);
      return;
    }

    if (!selectedWordSet) {
      return;
    }

    setIsStartingWordSet(true);

    try {
      const wordSetWords = await getWordSetWords(selectedWordSet);
      // Each word yields one exercise per selected type, so scale word count accordingly.
      const wordsNeeded = Math.ceil(sampleSize / Math.max(exercises.length, 1));
      const selectedWordInputs = selectWordsForSession(
        selectedWordSet.id,
        wordSetWords.map(parseWordSetEntry),
        wordsNeeded,
      );
      const sampledWords: Word[] = [];
      for (const wordInput of selectedWordInputs) {
        sampledWords.push(...buildExercises([wordInput], exercises));
      }

      if (sampledWords.length === 0) {
        toast({
          title: 'No exercises to launch',
          description: 'Choose dictation or use words that include prompts after |.',
        });
        return;
      }

      startGame(sampledWords, language, difficulty, source);
    } catch {
      toast({
        title: 'Could not load word set',
        description: 'Please try again in a moment.',
      });
    } finally {
      setIsStartingWordSet(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl">
        <section className="stage-card bg-[rgba(255,251,245,0.92)] dark:bg-[rgba(29,34,46,0.92)]">
          <div className="space-y-6 sm:space-y-7">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-[rgba(222,90,55,0.12)] p-2.5 text-[#de5a37] dark:bg-[rgba(222,90,55,0.18)] sm:h-20 sm:w-20 sm:rounded-[1.6rem] sm:p-3.5">
                <Robot className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="display-title whitespace-nowrap text-3xl font-black leading-none text-[#22170f] dark:text-[#f8f1e6] sm:text-5xl">
                  Memo Bot
                </h1>
                <p className="mt-1.5 text-sm font-extrabold leading-tight text-[#5b4636] dark:text-[#d4c5b3] sm:mt-2 sm:text-xl">
                  Build a spelling mission.
                </p>
              </div>
              <LanguageSelector value={language} onChange={setLanguage} />
            </div>

            {wordSetLoadState === 'error' && (
              <div className="rounded-[1.2rem] border border-black/10 bg-white/55 px-4 py-3 text-sm font-semibold text-[#7d3d20] dark:border-white/10 dark:bg-white/5 dark:text-[#f4c15d]">
                Word sets are unavailable right now. You can still practice with your own words.
              </div>
            )}

            <div
              aria-hidden={!showSourceSelector}
              className={cn(
                'overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out',
                showSourceSelector
                  ? 'max-h-20 opacity-100'
                  : 'pointer-events-none max-h-0 opacity-0',
              )}
            >
              <SegmentedControl
                label="Source"
                value={source}
                onValueChange={handleSourceChange}
                options={[
                  { value: 'manual', label: 'My words' },
                  { value: 'word-set', label: 'Word set' },
                ]}
              />
            </div>

            {source === 'manual' || !showSourceSelector ? (
              <div className="space-y-3">
                <Textarea
                  value={text}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={`Enter one word per line...\nAdd an optional prompt with | and/or a spoken hint with #`}
                  className="min-h-[200px] rounded-[1.5rem] border-black/10 bg-white/80 px-5 py-4 text-lg leading-8 text-[#2f2218] placeholder:text-[#9d8a79] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] focus-visible:ring-inset focus-visible:ring-[#de5a37] focus-visible:ring-offset-0 dark:border-white/10 dark:bg-[rgba(19,23,32,0.82)] dark:text-[#f3eadf] dark:placeholder:text-[#8b8f9a] dark:shadow-none"
                />
                <p className="px-2 text-right text-sm font-bold text-[#6a503b] dark:text-[#d4c5b3] sm:text-base">
                  {preparedWords.length} exercises
                </p>
              </div>
            ) : null}

            {showSourceSelector && source === 'word-set' ? (
              <div className="space-y-4 sm:space-y-5">
                <Select value={selectedWordSet?.id ?? ''} onValueChange={setSelectedWordSetId}>
                  <SelectTrigger
                    aria-label="Word set"
                    className="h-14 rounded-[1.25rem] border-black/10 bg-white/80 px-4 text-base font-semibold sm:text-lg text-[#2f2218] focus:ring-inset focus:ring-[#de5a37] focus:ring-offset-0 dark:border-white/10 dark:bg-[rgba(19,23,32,0.82)] dark:text-[#f3eadf]"
                  >
                    <SelectValue placeholder="Select a word set" />
                    {selectedWordSet && wordSetStats[selectedWordSet.id] ? (
                      <span className="ml-auto mr-1">
                        <WordSetStatsDots stats={wordSetStats[selectedWordSet.id]} />
                      </span>
                    ) : null}
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-black/10 bg-[rgba(255,251,245,0.98)] text-[#2f2218] dark:border-white/10 dark:bg-[rgba(29,34,46,0.98)] dark:text-[#f3eadf]">
                    {availableWordSets.map((config) => {
                      const stats = wordSetStats[config.id];
                      return (
                        <SelectItem
                          key={config.id}
                          value={config.id}
                          className="cursor-pointer rounded-xl"
                          endAdornment={stats ? <WordSetStatsDots stats={stats} /> : null}
                        >
                          {config.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {selectedWordSet && selectedWordSetWords.length > 0 ? (
                  <Collapsible open={isWordListOpen} onOpenChange={setIsWordListOpen}>
                    <CollapsibleTrigger className="-mt-1 group flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-bold sm:text-base text-[#6a503b] transition-colors hover:bg-black/5 dark:text-[#d4c5b3] dark:hover:bg-white/10">
                      <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                      {isWordListOpen ? 'Hide words' : `Show ${selectedWordSetWords.length} words`}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <WordSetWordList
                        wordSetId={selectedWordSet.id}
                        words={selectedWordSetWords}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                ) : null}

                <div className="space-y-2.5">
                  <div className={SECTION_LABEL_CLASS_NAME}>Session size</div>
                  <SegmentedControl
                    label="Session size"
                    value={String(sampleSize)}
                    onValueChange={(value) => setSampleSize(Number(value) as WordSetSampleSize)}
                    options={WORD_SET_SAMPLE_SIZES.map((size) => ({
                      value: String(size),
                      label: String(size),
                    }))}
                  />
                </div>
              </div>
            ) : null}

            <OptionsSection
              difficulty={difficulty}
              exercises={exercises}
              hasPromptedWords={hasPromptedWords}
              onDifficultyChange={setDifficulty}
              onExerciseChange={handleExerciseChange}
            />

            <Button
              onClick={() => {
                void handleSubmit();
              }}
              disabled={
                isStartingWordSet ||
                (source === 'manual' ? preparedWords.length === 0 : !selectedWordSet)
              }
              className="h-14 w-full rounded-[1.4rem] sm:h-16 border border-black/10 bg-[#de5a37] px-6 text-xl font-extrabold text-white shadow-[0_16px_30px_rgba(222,90,55,0.32)] transition-transform hover:-translate-y-0.5 hover:bg-[#c94d2d] disabled:translate-y-0 disabled:bg-[#d6a08f] dark:border-white/10 dark:bg-[#d46b47] dark:hover:bg-[#bf5d3c] dark:disabled:bg-[#725245]"
            >
              {isStartingWordSet ? (
                <BookOpen className="h-6 w-6 animate-pulse" />
              ) : (
                <Rocket className="h-6 w-6" />
              )}
              {isStartingWordSet ? 'Loading Word Set...' : 'Launch Mission'}
              <ArrowRight className="h-6 w-6" />
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

const SECTION_LABEL_CLASS_NAME =
  'text-xs font-extrabold uppercase tracking-[0.22em] sm:text-sm text-[#7d3d20] dark:text-[#f7d27a]';

const DIFFICULTY_OPTIONS: Array<{ value: Difficulty; label: string; name: string }> = [
  { value: 'relaxed', label: 'Relaxed 🙂', name: 'Relaxed' },
  { value: 'regular', label: 'Regular 🙌', name: 'Regular' },
  { value: 'strict', label: 'Strict 🎯', name: 'Strict' },
];

const EXERCISE_NAMES: Record<Exercise, string> = {
  dictation: 'Dictation',
  prompt: 'Prompt',
};

function OptionsSection({
  difficulty,
  exercises,
  hasPromptedWords,
  onDifficultyChange,
  onExerciseChange,
}: {
  difficulty: Difficulty;
  exercises: Exercise[];
  hasPromptedWords: boolean;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onExerciseChange: (exercise: Exercise, checked: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const difficultyName = DIFFICULTY_OPTIONS.find((option) => option.value === difficulty)?.name;
  const exerciseSummary = (['dictation', 'prompt'] as const)
    .filter((exercise) => exercises.includes(exercise))
    .map((exercise) => EXERCISE_NAMES[exercise])
    .join(' + ');

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-[1.25rem] border border-black/10 bg-white/50 dark:border-white/10 dark:bg-white/5"
    >
      <CollapsibleTrigger className="group flex w-full items-center gap-3 rounded-[1.25rem] px-4 py-3.5 text-left sm:px-5 sm:py-4 transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#de5a37] dark:hover:bg-white/5">
        <SlidersHorizontal className="h-5 w-5 shrink-0 text-[#de5a37] dark:text-[#f4c15d]" />
        <span className={SECTION_LABEL_CLASS_NAME}>Options</span>
        <span className="ml-auto truncate text-sm font-bold text-[#6a503b] dark:text-[#d4c5b3] sm:text-base">
          {difficultyName} · {exerciseSummary}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#6a503b] transition-transform group-data-[state=open]:rotate-180 dark:text-[#d4c5b3]" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-5 px-3 pb-4 pt-1 sm:px-5 sm:pb-5">
        <div className="space-y-2.5">
          <div className={SECTION_LABEL_CLASS_NAME}>Difficulty</div>
          <SegmentedControl
            label="Difficulty"
            value={difficulty}
            onValueChange={onDifficultyChange}
            options={DIFFICULTY_OPTIONS}
          />
        </div>
        <ExerciseSection
          exercises={exercises}
          hasPromptedWords={hasPromptedWords}
          onExerciseChange={onExerciseChange}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

function ExerciseSection({
  exercises,
  hasPromptedWords,
  onExerciseChange,
}: {
  exercises: Exercise[];
  hasPromptedWords: boolean;
  onExerciseChange: (exercise: Exercise, checked: boolean) => void;
}) {
  const isDictationSelected = exercises.includes('dictation');
  const isPromptSelected = exercises.includes('prompt');

  return (
    <TooltipProvider>
      <fieldset className="space-y-2">
        <legend className={cn(SECTION_LABEL_CLASS_NAME, 'mb-2.5')}>Exercise type</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex cursor-pointer items-center gap-2.5 rounded-[1rem] border border-black/10 bg-white/70 px-3 py-2.5 transition-colors sm:px-4 sm:py-3 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
            <Checkbox
              checked={isDictationSelected}
              disabled={isDictationSelected && !isPromptSelected}
              onCheckedChange={(checked) => onExerciseChange('dictation', checked === true)}
              className="border-[#de5a37] data-[state=checked]:bg-[#de5a37] data-[state=checked]:text-white"
            />
            <Volume2 className="hidden h-4 w-4 shrink-0 text-[#de5a37] dark:text-[#f4c15d] sm:block" />
            <span className="truncate text-sm font-black text-[#22170f] dark:text-[#f3eadf] sm:text-base">
              Dictation
            </span>
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <label
                className={cn(
                  'flex items-center gap-2.5 rounded-[1rem] border border-black/10 bg-white/70 px-3 py-2.5 transition-colors sm:px-4 sm:py-3 dark:border-white/10 dark:bg-white/5',
                  hasPromptedWords
                    ? 'cursor-pointer hover:bg-white dark:hover:bg-white/10'
                    : 'cursor-not-allowed opacity-50',
                )}
              >
                <Checkbox
                  checked={isPromptSelected}
                  disabled={!hasPromptedWords || (isPromptSelected && !isDictationSelected)}
                  onCheckedChange={(checked) => onExerciseChange('prompt', checked === true)}
                  className="border-[#de5a37] data-[state=checked]:bg-[#de5a37] data-[state=checked]:text-white"
                />
                <MessageSquareText className="hidden h-4 w-4 shrink-0 text-[#de5a37] dark:text-[#f4c15d] sm:block" />
                <span className="truncate text-sm font-black text-[#22170f] dark:text-[#f3eadf] sm:text-base">
                  Prompt<span className="hidden sm:inline"> (translation)</span>
                </span>
              </label>
            </TooltipTrigger>
            {!hasPromptedWords && (
              <TooltipContent>
                <p>Add words with a prompt using word|prompt to enable</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </fieldset>
    </TooltipProvider>
  );
}

function parseWordInputs(text: string): WordInput[] {
  const words: WordInput[] = [];

  for (const line of text.split('\n')) {
    const wordInput = parseWordSetEntry(line);
    if (!wordInput.word) {
      continue;
    }

    words.push(wordInput);
  }

  return words;
}

function buildExercises(wordInputs: WordInput[], selectedExercises: Exercise[]): Word[] {
  const includeDictation = selectedExercises.includes('dictation');
  const includePrompt = selectedExercises.includes('prompt');
  const result: Word[] = [];

  for (const wordInput of wordInputs) {
    if (includeDictation) {
      result.push({
        word: wordInput.word,
        hint: wordInput.hint,
        prompt: wordInput.prompt,
        exercise: 'dictation',
      });
    }

    if (includePrompt && wordInput.prompt) {
      result.push({
        word: wordInput.word,
        prompt: wordInput.prompt,
        exercise: 'prompt',
      });
    }
  }

  return result;
}
