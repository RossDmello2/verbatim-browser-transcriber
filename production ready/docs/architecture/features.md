# Feature Architecture Guide

Updated: 2026-06-01

Verbatim is a static browser app. Future contributors should preserve the current runtime entrypoints and grow feature areas incrementally instead of converting the app to a framework or backend service.

## Source of Truth

| Area | Current Source | Role |
|---|---|---|
| Browser entrypoint | `index.html` | Loads CSS bundles and `assets/js/main.js`. |
| Boot gate | `assets/js/main.js` | Checks runtime capability support before calling `buildApp()`. |
| Main implementation | `assets/js/app/build-app.js` | Owns the active UI, state, provider calls, event handlers, persistence, and export behavior. |
| Runtime helpers | `assets/js/runtime/*.js` | Small testable helpers for capabilities, provider timeouts, and workspace validation. |
| Feature maps | `assets/js/features/*.js` | Ownership guides for future extraction and review boundaries. |
| App state guide | `assets/js/app/state.js` | Storage-key and domain guide for workspace, provider, translation, assistant, and memory state. |

The `features/` directory is not yet a fully extracted implementation layer. It exists so contributors can locate ownership boundaries before making surgical changes.

## Feature Domains

| Domain | Guide File | Current Ownership |
|---|---|---|
| Capture | `assets/js/features/capture.js` | Browser speech recognition, MediaRecorder quality capture, display/tab capture fallbacks, capture help text. |
| File transcription | `assets/js/features/file-transcription.js` | Uploaded media validation, transcription chunks, provider retries, transcript rendering. |
| Providers | `assets/js/features/providers.js` | Groq/OpenAI-compatible and Gemini endpoint selection, model defaults, provider-key storage controls. |
| Translation | `assets/js/features/translation.js` | Translation state, cache keys, target language, segment queue, translated transcript rendering. |
| Transcript | `assets/js/features/transcript.js` | Transcript segments, cleanup, redaction, speaker labels, copy history, text area state. |
| Workspace | `assets/js/features/workspace.js` | Autosave, workspace import/export, backup payloads, restore validation, cache clearing. |
| Memory | `assets/js/features/memory.js` | Memory packs, glossary, output style, imported user context, advanced transcript tools. |
| Assistant | `assets/js/features/assistant.js` | Verba assistant chat, attachments, conversation history, model selection, voice input. |
| Diagnostics | `assets/js/features/diagnostics.js` | Runtime/provider/capture snapshots and status panels. |
| Export | `assets/js/features/export.js` | TXT, Markdown, DOCX, SRT, VTT, JSON, CSV, and workspace download behavior. |
| UI shell | `assets/js/features/ui-shell.js` | Navigation, sidebar, mobile drawers, API panel, responsive interaction state. |

## Contribution Rules

- Keep production boot paths stable unless the issue explicitly requests a runtime migration.
- Prefer extracting one small helper at a time from `build-app.js` into `assets/js/runtime/` when it can be tested independently.
- Update the matching `assets/js/features/*.js` guide when a feature boundary changes.
- Add or update unit tests for extracted pure helpers.
- Add or update Playwright smoke coverage when a change touches navigation, workspace import/export, provider UI, assistant UI, or responsive layout.
- Keep provider secrets, transcripts, recordings, workspace exports, and diagnostics out of source, tests, fixtures, screenshots, and logs.

## When Adding a New Feature

1. Identify the closest existing domain in the table above.
2. Add the UI inside the existing workspace flow rather than creating a landing page.
3. Store state through the existing `vt_*` key convention only when persistence is required.
4. Validate imported or user-selected files before reading them into state.
5. Keep provider network calls behind timeout and error reporting behavior.
6. Document the feature in `README.md`, the relevant architecture doc, and `CHANGELOG.md` when user-facing behavior changes.
7. Run `npm test`, `npm run test:web:smoke`, and `npm --prefix apps/mobile run check`.
