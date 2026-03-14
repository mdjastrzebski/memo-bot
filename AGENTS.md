# Memo Bot - Project Context

## Project Overview

**Memo Bot** is a web-based spelling practice application designed for children. It gamifies the learning process by allowing users to input a list of words and then quizzes them. The app employs a simplified spaced repetition system where incorrectly spelled words are rescheduled for sooner review, ensuring mastery before completion.

## Technology Stack

- **Frontend Framework**: React 19 (via Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (built on Radix UI primitives)
- **State Management**: Zustand
- **Icons**: Lucide React
- **Testing**: Vitest
- **Package Manager**: Bun

## Architecture

The application is structured around a central "Game Status" state:

1.  **Input Screen (`status: 'initial'`)**: User inputs words or selects a preset list.
2.  **Question Screen (`status: 'learning'`)**: The main game loop. Users are prompted (via text or speech) to spell a word.
    - Logic handles correct/incorrect streaks.
    - Incorrect words are re-queued based on logic in `game-store.ts`.
3.  **Results Screen (`status: 'finished'`)**: Displays summary of performance.

**Key Directories:**

- `src/stores/`: Contains `game-store.ts` (Zustand store), which holds the core game logic (queue management, scoring).
- `src/screens/`: High-level views corresponding to the game states.
- `src/components/ui/`: Reusable UI components (shadcn/ui).
- `src/utils/`: Helper functions for logic (`score.ts`, `data.ts`), speech synthesis (`speak.ts`), and languages (`languages.ts`).

## Building and Running

The project uses `bun` as the package manager.

- **Start Development Server**: `bun run dev`
- **Build for Production**: `bun run build`
- **Run Tests**: `bun run test`
- **Lint Code**: `bun run lint`
- **Type Check**: `bun run typecheck`
- **Validate All (Lint + Typecheck + Test)**: `bun run validate`

## Development Conventions

- **State**: Use the global Zustand store (`useGameState`) for app-wide state (word queue, settings). Use local `useState` for transient UI state (e.g., current input value).
- **Styling**: Use Tailwind CSS utility classes.
- **Components**: Prefer functional components. Reusable UI elements should go in `src/components/`.
- **Imports**: Absolute imports are likely configured (check `tsconfig.json` paths if needed), but relative imports are currently observed in some files.
- **Code Quality**: Ensure `bun run validate` passes before committing.
