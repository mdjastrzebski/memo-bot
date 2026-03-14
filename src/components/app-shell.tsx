import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../lib/utils';
import { Toggle } from './ui/toggle';

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  const [isDark, setIsDark] = useState(false);

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
        <div className="fixed right-4 top-4 z-30 flex justify-end sm:right-6 lg:right-10">
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
        {children}
      </div>
    </div>
  );
}
