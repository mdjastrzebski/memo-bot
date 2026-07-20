import {
  ArrowRight,
  BookOpen,
  BotIcon as Robot,
  MessageSquareText,
  Rocket,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { AppShell } from '../components/app-shell';
import { LanguageSelector } from '../components/language-selector';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Textarea } from '../components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { toast } from '../hooks/use-toast';
import { cn } from '../lib/utils';
import { useGameState } from '../stores/game-store';
import type { Difficulty, InputSource, Exercise, Word, WordInput } from '../types';
import { getLanguageByCode } from '../utils/languages';
import { normalizeInputText } from '../utils/text-normalization';
import {
  type WordSetConfig,
  type WordSetSampleSize,
  getWordSetConfigs,
  getWordSetWords,
  parseWordSetEntry,
  sampleWordSetWords,
  WORD_SET_SAMPLE_SIZES,
} from '../utils/word-sets';

type WordSetLoadState = 'loading' | 'ready' | 'error';

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
  const startGame = useGameState((state) => state.startGame);
  const sampleSizeIndex = WORD_SET_SAMPLE_SIZES.indexOf(sampleSize);

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
      const sampledWords = buildExercises(
        sampleWordSetWords(wordSetWords, sampleSize).map(parseWordSetEntry),
        exercises,
      );

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
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[rgba(222,90,55,0.12)] p-4 text-[#de5a37] dark:bg-[rgba(222,90,55,0.18)]">
                <Robot className="h-full w-full" />
              </div>
              <div className="space-y-2">
                <h1 className="display-title text-5xl font-black leading-[0.95] text-[#22170f] dark:text-[#f8f1e6] sm:text-6xl">
                  Memo Bot
                </h1>
                <p className="text-2xl font-extrabold text-[#5b4636] dark:text-[#d4c5b3]">
                  Build a spelling mission.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-extrabold uppercase tracking-[0.22em] text-[#7d3d20] dark:text-[#f7d27a]">
                Language
              </Label>
              <LanguageSelector value={language} onChange={setLanguage} />
              {wordSetLoadState === 'error' && (
                <div className="rounded-[1.2rem] border border-black/10 bg-white/55 px-4 py-3 text-sm font-semibold text-[#7d3d20] dark:border-white/10 dark:bg-white/5 dark:text-[#f4c15d]">
                  Word sets are unavailable right now. You can still practice with your own words.
                </div>
              )}
            </div>

            <ChoiceSection
              icon={<Sparkles className="h-5 w-5" />}
              title="Difficulty"
              value={difficulty}
              onValueChange={(value) => setDifficulty(value as Difficulty)}
              options={[
                {
                  value: 'relaxed',
                  title: 'Relaxed 🙂',
                },
                {
                  value: 'strict',
                  title: 'Strict 🎯',
                },
              ]}
            />

            <ExerciseSection
              exercises={exercises}
              hasPromptedWords={hasPromptedWords}
              onExerciseChange={handleExerciseChange}
            />

            <div
              aria-hidden={!showSourceSelector}
              className={cn(
                'overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out',
                showSourceSelector
                  ? 'max-h-32 opacity-100'
                  : 'pointer-events-none max-h-0 opacity-0',
              )}
            >
              <div className="pb-1">
                <ChoiceSection
                  icon={<BookOpen className="h-5 w-5" />}
                  title="Source"
                  value={source}
                  onValueChange={(value) => handleSourceChange(value as InputSource)}
                  options={[
                    {
                      value: 'manual',
                      title: 'My words',
                    },
                    {
                      value: 'word-set',
                      title: 'Word set',
                    },
                  ]}
                />
              </div>
            </div>

            <div>
              {source === 'manual' || !showSourceSelector ? (
                <div className="space-y-4 pb-1">
                  <Textarea
                    value={text}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder={`Enter one word per line...\nYou can also add an optional prompt with |`}
                    className="min-h-[260px] rounded-[1.5rem] border-black/10 bg-white/80 px-5 py-4 text-lg leading-8 text-[#2f2218] placeholder:text-[#9d8a79] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] focus-visible:ring-inset focus-visible:ring-[#de5a37] focus-visible:ring-offset-0 dark:border-white/10 dark:bg-[rgba(19,23,32,0.82)] dark:text-[#f3eadf] dark:placeholder:text-[#8b8f9a] dark:shadow-none"
                  />

                  <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-white/50 px-4 py-3 text-base font-semibold text-[#6a503b] dark:border-white/10 dark:bg-white/5 dark:text-[#d4c5b3]">
                    {preparedWords.length} exercises
                  </div>
                </div>
              ) : null}

              {showSourceSelector && source === 'word-set' ? (
                <div className="space-y-4 pb-1">
                  <div className="space-y-3">
                    <Label
                      htmlFor="word-set"
                      className="text-sm font-extrabold uppercase tracking-[0.22em] text-[#7d3d20] dark:text-[#f7d27a]"
                    >
                      Word Set
                    </Label>
                    <Select value={selectedWordSet?.id ?? ''} onValueChange={setSelectedWordSetId}>
                      <SelectTrigger
                        id="word-set"
                        className="h-14 rounded-[1.25rem] border-black/10 bg-white/80 text-base font-semibold text-[#2f2218] focus:ring-inset focus:ring-[#de5a37] focus:ring-offset-0 dark:border-white/10 dark:bg-[rgba(19,23,32,0.82)] dark:text-[#f3eadf]"
                      >
                        <SelectValue placeholder="Select a word set" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-black/10 bg-[rgba(255,251,245,0.98)] text-[#2f2218] dark:border-white/10 dark:bg-[rgba(29,34,46,0.98)] dark:text-[#f3eadf]">
                        {availableWordSets.map((config) => (
                          <SelectItem
                            key={config.id}
                            value={config.id}
                            className="cursor-pointer rounded-xl"
                          >
                            {config.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4 rounded-[1.25rem] border border-black/10 bg-white/60 px-4 py-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <Label
                        id="sample-size-label"
                        className="text-sm font-extrabold uppercase tracking-[0.22em] text-[#7d3d20] dark:text-[#f7d27a]"
                      >
                        Session Size
                      </Label>
                      <div className="rounded-full bg-[rgba(222,90,55,0.12)] px-3 py-1 text-sm font-black text-[#7d3d20] dark:bg-[rgba(244,193,93,0.16)] dark:text-[#f7d27a]">
                        {sampleSize} words
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="relative px-2">
                        <div className="pointer-events-none absolute inset-x-[0.5rem] top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#ead9c4] dark:bg-[#3a404d]" />
                        <div className="pointer-events-none absolute inset-x-[0.5rem] top-1/2 flex -translate-y-1/2 justify-between">
                          {WORD_SET_SAMPLE_SIZES.map((size) => (
                            <span
                              key={size}
                              className={cn(
                                'h-4 w-4 rounded-full border-2 border-white shadow-sm transition-colors dark:border-[rgba(29,34,46,0.95)]',
                                size <= sampleSize
                                  ? 'bg-[#de5a37] dark:bg-[#f4c15d]'
                                  : 'bg-[#d7c1a8] dark:bg-[#677087]',
                              )}
                            />
                          ))}
                        </div>
                        <Slider
                          thumbLabel="Session Size"
                          value={[sampleSizeIndex < 0 ? 0 : sampleSizeIndex]}
                          min={0}
                          max={WORD_SET_SAMPLE_SIZES.length - 1}
                          step={1}
                          onValueChange={([nextIndex]) => {
                            setSampleSize(
                              (WORD_SET_SAMPLE_SIZES[nextIndex] ??
                                WORD_SET_SAMPLE_SIZES[0]) as WordSetSampleSize,
                            );
                          }}
                          className="relative z-10"
                        />
                      </div>

                      <div className="flex justify-between gap-2 text-sm font-bold text-[#6a503b] dark:text-[#d4c5b3]">
                        {WORD_SET_SAMPLE_SIZES.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSampleSize(size)}
                            className={cn(
                              'min-w-0 flex-1 rounded-full px-2 py-1 text-center transition-colors',
                              size === sampleSize
                                ? 'bg-[rgba(222,90,55,0.14)] text-[#7d3d20] dark:bg-[rgba(244,193,93,0.16)] dark:text-[#f7d27a]'
                                : 'hover:bg-black/5 dark:hover:bg-white/10',
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-white/50 px-4 py-3 text-base font-semibold text-[#6a503b] dark:border-white/10 dark:bg-white/5 dark:text-[#d4c5b3]">
                    Randomly sample up to {sampleSize} words from{' '}
                    <span className="font-extrabold">{selectedWordSet?.name}</span>.
                  </div>
                </div>
              ) : null}
            </div>

            <Button
              onClick={() => {
                void handleSubmit();
              }}
              disabled={
                isStartingWordSet ||
                (source === 'manual' ? preparedWords.length === 0 : !selectedWordSet)
              }
              className="h-16 w-full rounded-[1.4rem] border border-black/10 bg-[#de5a37] px-6 text-xl font-extrabold text-white shadow-[0_16px_30px_rgba(222,90,55,0.32)] transition-transform hover:-translate-y-0.5 hover:bg-[#c94d2d] disabled:translate-y-0 disabled:bg-[#d6a08f] dark:border-white/10 dark:bg-[#d46b47] dark:hover:bg-[#bf5d3c] dark:disabled:bg-[#725245]"
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
      <fieldset className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.22em] text-[#7d3d20] dark:text-[#f7d27a]">
          <span className="text-[#de5a37] dark:text-[#f4c15d]">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>Exercise Type</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-[1.15rem] border border-black/10 bg-white/70 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
            <Checkbox
              checked={isDictationSelected}
              disabled={isDictationSelected && !isPromptSelected}
              onCheckedChange={(checked) => onExerciseChange('dictation', checked === true)}
              className="border-[#de5a37] data-[state=checked]:bg-[#de5a37] data-[state=checked]:text-white"
            />
            <Volume2 className="h-5 w-5 text-[#de5a37] dark:text-[#f4c15d]" />
            <div className="text-base font-black text-[#22170f] dark:text-[#f3eadf]">Dictation</div>
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <label
                className={`flex items-center gap-3 rounded-[1.15rem] border border-black/10 bg-white/70 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-colors dark:border-white/10 dark:bg-white/5 ${
                  hasPromptedWords
                    ? 'cursor-pointer hover:bg-white dark:hover:bg-white/10'
                    : 'cursor-not-allowed opacity-50'
                }`}
              >
                <Checkbox
                  checked={isPromptSelected}
                  disabled={!hasPromptedWords || (isPromptSelected && !isDictationSelected)}
                  onCheckedChange={(checked) => onExerciseChange('prompt', checked === true)}
                  className="border-[#de5a37] data-[state=checked]:bg-[#de5a37] data-[state=checked]:text-white"
                />
                <MessageSquareText className="h-5 w-5 text-[#de5a37] dark:text-[#f4c15d]" />
                <div className="text-base font-black text-[#22170f] dark:text-[#f3eadf]">
                  Prompt (translation)
                </div>
              </label>
            </TooltipTrigger>
            {!hasPromptedWords && (
              <TooltipContent>
                <p>Add words with hints using word|hint to enable</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </fieldset>
    </TooltipProvider>
  );
}

function ChoiceSection({
  icon,
  title,
  value,
  onValueChange,
  options,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{
    value: string;
    title: string;
  }>;
}) {
  return (
    <fieldset className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.22em] text-[#7d3d20] dark:text-[#f7d27a]">
        <span className="text-[#de5a37] dark:text-[#f4c15d]">{icon}</span>
        <div>{title}</div>
      </div>
      <RadioGroup value={value} onValueChange={onValueChange} className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-[1.15rem] border border-black/10 bg-white/70 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <RadioGroupItem value={option.value} className="border-[#de5a37] text-[#de5a37]" />
            <div className="text-base font-black text-[#22170f] dark:text-[#f3eadf]">
              {option.title}
            </div>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

function parseWordInputs(text: string): WordInput[] {
  const lines = text.split('\n');
  const words: WordInput[] = [];

  for (const line of lines) {
    const [word, prompt] = normalizeInputText(line).split('|');
    const trimmedWord = word.trim();
    if (!trimmedWord) {
      continue;
    }

    words.push({
      word: trimmedWord,
      prompt: prompt?.trim() || undefined,
    });
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
        ...wordInput,
        exercise: 'dictation',
      });
    }

    if (includePrompt && wordInput.prompt) {
      result.push({
        ...wordInput,
        exercise: 'prompt',
      });
    }
  }

  return result;
}
