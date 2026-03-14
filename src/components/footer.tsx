import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="pointer-events-none fixed bottom-3 left-0 right-0 z-20 px-4">
      <div className="pointer-events-auto mx-auto flex max-w-max items-center justify-center gap-2 rounded-full border border-black/10 bg-[rgba(255,251,245,0.84)] px-4 py-2 text-[#6a503b] shadow-[0_12px_30px_rgba(98,61,31,0.15)] backdrop-blur">
        <span className="text-sm">Memo Bot is open source. Learn more on</span>
        <a
          href="https://www.github.com/mdjastrzebski/memo-bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#7d3d20] transition-colors hover:text-black"
        >
          <Github className="w-4 h-4" />
          <span className="text-sm">GitHub!</span>
        </a>
      </div>
    </footer>
  );
}
