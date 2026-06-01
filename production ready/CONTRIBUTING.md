# Contributing to Verbatim

Thanks for considering a contribution.

## Setup

Run commands from this package root:

```powershell
npm ci
python -m http.server 8080
```

Open `http://localhost:8080` in Chrome or Edge.

## Before Opening a Pull Request

```powershell
npm test
npm run test:web:smoke
npm --prefix apps/mobile run check
```

Use demo data only. Do not commit provider keys, transcripts, recordings, browser profile data, exported workspaces, local databases, dependency folders, build output, or local tool state.

## Project Boundaries

- Keep the production runtime in `index.html`, `assets/css/**`, and `assets/js/**`.
- Treat `assets/js/features/**` as feature ownership guides unless a future issue explicitly extracts runtime logic into those modules.
- Do not add a backend, server-side key proxy, database, auth service, or build framework unless the issue explicitly approves that product-shape change.
- The Expo package in `apps/mobile/` is a thin shell around the existing web runtime, not a native rewrite.

## Code Style

- Runtime code is plain browser JavaScript using ES modules.
- Use 4-space indentation in JavaScript, matching the current source.
- Keep semicolons in JavaScript.
- Use `kebab-case` for new docs and script file names.
- Use `camelCase` for JavaScript functions and variables.
- Use `UPPER_SNAKE_CASE` for JavaScript constants.

## Commit Style

Use focused commits. Conventional Commit prefixes are preferred: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, and `perf:`.
