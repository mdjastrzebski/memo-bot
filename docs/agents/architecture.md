# Architecture

The app is organized around a central game status state.

## Game Flow

1. `status: 'initial'`
   Input screen where the user enters words or selects a preset list.

2. `status: 'learning'`
   Question screen where the user spells prompted words. Incorrect words are re-queued sooner based on the logic in `src/stores/game-store.ts`.

3. `status: 'finished'`
   Results screen with the summary of performance.

## Key Directories

- `src/stores/`
  Contains the Zustand game store and core queue/scoring logic.
- `src/screens/`
  High-level views mapped to the game states.
- `src/components/ui/`
  Reusable shadcn/ui-based components.
- `src/utils/`
  Helpers for scoring, data, speech synthesis, and language support.
