# Agent Guidance

## Project Shape

Verbatim is primarily a static browser app. Preserve `index.html`, `assets/css/**`, and `assets/js/**` as the production runtime unless a task explicitly asks for a different product shape.

The Expo package in `apps/mobile/` is a thin shell that loads the existing web runtime through `components/verbatim-dom.tsx`. Do not rewrite the app as React Native unless the user explicitly requests native parity.

Feature ownership guides live in `assets/js/features/**` and `docs/architecture/features.md`. They describe current domains and intended extraction boundaries; most active runtime logic still lives in `assets/js/app/build-app.js`, so do not assume the feature files are complete implementations.

## Safety Rules

- Do not read, print, or commit real `.env` files.
- Treat provider API keys, transcripts, workspace exports, recordings, and diagnostics as sensitive.
- Keep direct provider calls client-side; do not add a backend proxy without explicit approval.
- Preserve sibling files in the parent repository. This package may live inside a dirty parent worktree.

## Verification

Run these before claiming production readiness:

```powershell
npm test
npm run test:web:smoke
npm --prefix apps/mobile run check
```

For Expo changes, also run:

```powershell
npm --prefix apps/mobile run start
```

Device-level Expo Go verification requires a physical device or simulator outside the static browser test path.
