import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-black/10 backdrop-blur-sm py-2">
      <div className="container mx-auto px-4 flex flex-row items-center justify-center gap-2 text-white/50">
        <span className="text-sm">Memo Bot is open source. Learn more on</span>
        <a
          href="https://www.github.com/mdjastrzebski/memo-bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-white transition-colors text-white/70"
        >
          <Github className="w-4 h-4" />
          <span className="text-sm">GitHub!</span>
        </a>
      </div>
    </footer>
  );
}
