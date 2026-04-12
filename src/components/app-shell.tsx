import { Moon, Sun, Volume2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';

import { toast } from '../hooks/use-toast';
import { cn } from '../lib/utils';
import {
  clearElevenLabsApiKey,
  setElevenLabsApiKey,
  useSpeechStatus,
} from '../utils/speech-service';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Toggle } from './ui/toggle';

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  const [isDark, setIsDark] = useState(false);
  const [isTtsDialogOpen, setIsTtsDialogOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const { hasElevenLabsApiKey, hasElevenLabsError, isElevenLabsActive } = useSpeechStatus();
  const apiKeyInputId = useId();

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('memo-bot-theme');
    const nextDark = storedTheme === 'dark';
    setIsDark(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
  }, []);

  const handleThemeChange = (pressed: boolean) => {
    setIsDark(pressed);
    document.documentElement.classList.toggle('dark', pressed);
    window.localStorage.setItem('memo-bot-theme', pressed ? 'dark' : 'light');
  };

  useEffect(() => {
    if (isTtsDialogOpen) {
      setApiKeyInput('');
    }
  }, [isTtsDialogOpen]);

  const ttsStatusLabel = hasElevenLabsError
    ? 'Saved key needs attention'
    : hasElevenLabsApiKey
      ? 'Key configured on this device'
      : 'No key configured';
  const ttsButtonClassName = hasElevenLabsError
    ? 'border-amber-400/50 bg-amber-100/80 text-amber-900 hover:bg-amber-100 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100 dark:hover:bg-amber-300/15'
    : isElevenLabsActive
      ? 'border-emerald-500/35 bg-emerald-100/80 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100 dark:hover:bg-emerald-300/15'
      : 'border-black/10 bg-white/75 text-[#5b4636] hover:bg-white dark:border-white/10 dark:bg-[rgba(255,255,255,0.08)] dark:text-[#d4c5b3] dark:hover:bg-[rgba(255,255,255,0.12)]';

  const handleSaveTtsKey = () => {
    const nextApiKey = apiKeyInput.trim();
    if (!nextApiKey) {
      return;
    }

    if (!setElevenLabsApiKey(nextApiKey)) {
      toast({
        title: 'Could not save ElevenLabs key',
        description: 'Please try again on this device.',
      });
      return;
    }

    setIsTtsDialogOpen(false);
    setApiKeyInput('');
  };

  const handleRemoveTtsKey = () => {
    if (!clearElevenLabsApiKey()) {
      toast({
        title: 'Could not remove ElevenLabs key',
        description: 'Please try again on this device.',
      });
      return;
    }

    setIsTtsDialogOpen(false);
    setApiKeyInput('');
  };

  return (
    <div className="app-shell min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[9%] h-28 w-28 rounded-full border border-black/10 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.7),rgba(255,255,255,0))] dark:border-white/5 dark:bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
        <div className="absolute right-[12%] top-[14%] h-20 w-20 rotate-12 border border-black/10 bg-[#f6c453]/60 dark:border-white/5 dark:bg-[rgba(246,196,83,0.12)]" />
        <div className="absolute bottom-[14%] left-[10%] h-24 w-24 rounded-[30%] border border-black/10 bg-[#de5a37]/15" />
        <div className="absolute bottom-[16%] right-[8%] h-40 w-40 rounded-full border border-black/10 bg-[radial-gradient(circle_at_center,rgba(222,90,55,0.18),rgba(222,90,55,0))]" />
      </div>

      <div
        className={cn(
          'relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-center pt-10',
          className,
        )}
      >
        <div className="fixed right-4 top-4 z-30 flex items-center justify-end gap-2 sm:right-6 lg:right-10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Open TTS settings"
            onClick={() => setIsTtsDialogOpen(true)}
            className={cn(
              'h-10 rounded-full px-3 text-sm font-semibold shadow-sm transition-colors',
              ttsButtonClassName,
            )}
          >
            <Volume2 className="h-4 w-4" />
            <span>TTS</span>
            <span
              aria-hidden="true"
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                hasElevenLabsError
                  ? 'bg-amber-500'
                  : isElevenLabsActive
                    ? 'bg-emerald-500'
                    : 'bg-[#b89f8a] dark:bg-[#6f6558]',
              )}
            />
          </Button>
          <Toggle
            pressed={isDark}
            onPressedChange={handleThemeChange}
            aria-label="Toggle dark mode"
            variant="outline"
            className="theme-toggle h-10 rounded-full px-3 text-sm font-semibold"
          >
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span>{isDark ? 'Dark' : 'Light'}</span>
          </Toggle>
        </div>
        <Dialog open={isTtsDialogOpen} onOpenChange={setIsTtsDialogOpen}>
          <DialogContent className="rounded-[1.75rem] border-black/10 bg-[rgba(255,251,245,0.98)] sm:max-w-md dark:border-white/10 dark:bg-[rgba(29,34,46,0.98)]">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-2xl font-black text-[#22170f] dark:text-[#f8f1e6]">
                ElevenLabs TTS
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-[#5b4636] dark:text-[#d4c5b3]">
                Add a key to use ElevenLabs voice playback on this device. The key stays in local
                storage and is never shown back to you here.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div
                className={cn(
                  'rounded-[1.2rem] border px-4 py-3 text-sm font-semibold',
                  hasElevenLabsError
                    ? 'border-amber-500/30 bg-amber-100/75 text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100'
                    : hasElevenLabsApiKey
                      ? 'border-emerald-500/25 bg-emerald-100/70 text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100'
                      : 'border-black/10 bg-white/70 text-[#5b4636] dark:border-white/10 dark:bg-white/5 dark:text-[#d4c5b3]',
                )}
              >
                {ttsStatusLabel}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={apiKeyInputId}
                  className="text-sm font-extrabold uppercase tracking-[0.22em] text-[#7d3d20] dark:text-[#f7d27a]"
                >
                  New API key
                </Label>
                <Input
                  id={apiKeyInputId}
                  type="password"
                  value={apiKeyInput}
                  onChange={(event) => setApiKeyInput(event.target.value)}
                  placeholder="Paste ElevenLabs API key"
                  autoComplete="off"
                  className="h-12 rounded-[1rem] border-black/10 bg-white/80 text-base dark:border-white/10 dark:bg-white/5"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-between sm:space-x-0">
              <div className="flex justify-start">
                {hasElevenLabsApiKey && (
                  <Button type="button" variant="ghost" onClick={handleRemoveTtsKey}>
                    Remove key
                  </Button>
                )}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setIsTtsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveTtsKey} disabled={!apiKeyInput.trim()}>
                  Save key
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {children}
      </div>
    </div>
  );
}
