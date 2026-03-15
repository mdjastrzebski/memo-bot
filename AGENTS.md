# Memo Bot

Memo Bot is a web app for children's spelling practice with a quiz flow and simple spaced repetition.

## Essentials

- Package manager: `bun`
- Build: `bun run build` (`tsc --noEmit -p tsconfig.build.json && vite build`)
- Typecheck: `bun run typecheck`
- Validate before finishing substantial code changes: `bun run validate`

## Project Docs

- [Architecture](docs/agents/architecture.md)
- [Development Conventions](docs/agents/conventions.md)
- [Testing](docs/agents/testing.md)

## PRs

After preparing code changes, run `bun run validate` to ensure that all tests pass, typecheck is successful, and code is formatted correctly. If you want to automatically fix formatting issues, run `bun run validate:fix`.

When finished created a `PR.txt` file based on `.github/pull_request_template.md` with a CONCISE description of the changes and the motivation behind them.
