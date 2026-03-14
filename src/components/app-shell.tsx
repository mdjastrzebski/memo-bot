import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="app-shell min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[9%] h-28 w-28 rounded-full border border-black/10 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.7),rgba(255,255,255,0))]" />
        <div className="absolute right-[12%] top-[14%] h-20 w-20 rotate-12 border border-black/10 bg-[#f6c453]/60" />
        <div className="absolute bottom-[14%] left-[10%] h-24 w-24 rounded-[30%] border border-black/10 bg-[#de5a37]/15" />
        <div className="absolute bottom-[16%] right-[8%] h-40 w-40 rounded-full border border-black/10 bg-[radial-gradient(circle_at_center,rgba(222,90,55,0.18),rgba(222,90,55,0))]" />
      </div>

      <div
        className={cn(
          'relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-center',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
