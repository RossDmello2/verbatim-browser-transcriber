# SA-9: Product UI Patterns

Generated: 2026-06-01

## Product Surface Decision

The first screen should remain the workspace, not a landing page. This aligns with the app's repeated-use transcription workflow and the project guidance in `AGENTS.md:5`.

## Current UI Pattern

| Pattern | Evidence |
|---|---|
| Dense operational workspace | `assets/js/app/build-app.js:348` |
| Sidebar navigation by task domain | `assets/js/app/build-app.js:363` |
| Provider configuration panel | `assets/js/app/build-app.js:32` through `assets/js/app/build-app.js:147` |
| Transcript editing and translation side-by-side | `assets/js/app/build-app.js:612` through `assets/js/app/build-app.js:650` |
| Floating assistant shell | `assets/js/app/build-app.js:901` |
| Export cards | `assets/js/app/build-app.js:821` through `assets/js/app/build-app.js:867` |

## UI Changes This Pass

No visible product UI was changed. The only user-facing visual change is that README now surfaces existing screenshots. Runtime metadata changes are in the document head and do not alter the workspace UI.

## Future UI Rules

- Keep controls inside the workspace flow.
- Preserve mobile drawers and touch target checks.
- Add Playwright coverage for navigation, import/export, provider UI, assistant UI, and responsive layout changes.
- Avoid in-app explanatory text that duplicates docs unless it is necessary for task completion or safety.
