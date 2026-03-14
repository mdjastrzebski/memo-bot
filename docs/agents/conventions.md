# Development Conventions

## State

- Use the global Zustand store (`useGameState`) for app-wide game state such as the word queue and settings.
- Use local component state for transient UI state such as input values.

## UI

- Use Tailwind CSS for styling.
- Place reusable UI elements in `src/components/`.
- Prefer functional React components.
