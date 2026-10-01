import { Github, X } from 'lucide-react';
import { useState } from 'react';

const FOOTER_DISMISSED_STORAGE_KEY = 'memobot:footer-dismissed';

function loadDismissed(): boolean {
  try {
    return window.localStorage.getItem(FOOTER_DISMISSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function Footer() {
  const [dismissed, setDismissed] = useState(loadDismissed);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(FOOTER_DISMISSED_STORAGE_KEY, 'true');
    } catch {
      // localStorage unavailable; dismiss for this session only.
    }
  };

  if (dismissed) return null;

  return (
    <footer className="pointer-events-none fixed bottom-3 left-0 right-0 z-20 px-4">
      <div className="pointer-events-auto mx-auto flex max-w-max items-center justify-center gap-2 rounded-full border border-black/10 bg-[rgba(255,251,245,0.84)] px-4 py-2 text-[#6a503b] shadow-[0_12px_30px_rgba(98,61,31,0.15)] backdrop-blur dark:border-white/10 dark:bg-[rgba(29,34,46,0.84)] dark:text-[#d8cfc0] dark:shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
        <span className="text-sm">Memo Bot is open source. Learn more on</span>
        <a
          href="https://www.github.com/mdjastrzebski/memo-bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#7d3d20] transition-colors hover:text-black dark:text-[#f4c15d] dark:hover:text-white"
        >
          <Github className="w-4 h-4" />
          <span className="text-sm">GitHub!</span>
        </a>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="-mr-1 ml-1 rounded-full p-0.5 opacity-50 transition-opacity hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </footer>
  );
}
