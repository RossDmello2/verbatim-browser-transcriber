# Feature Ownership Maps

Updated: 2026-06-01

The files in `assets/js/features/` are current feature ownership maps, not complete implementation modules. They exist to help contributors understand where new feature work belongs before logic is extracted from `assets/js/app/build-app.js`.

Start with `docs/architecture/features.md` for the full contribution guide.

## Current Feature Maps

| Feature | Map File |
|---|---|
| Capture | `../../assets/js/features/capture.js` |
| File transcription | `../../assets/js/features/file-transcription.js` |
| Providers/models | `../../assets/js/features/providers.js` |
| Translation | `../../assets/js/features/translation.js` |
| Transcript editing | `../../assets/js/features/transcript.js` |
| Workspace import/export | `../../assets/js/features/workspace.js` |
| Memory/glossary | `../../assets/js/features/memory.js` |
| Assistant | `../../assets/js/features/assistant.js` |
| Diagnostics | `../../assets/js/features/diagnostics.js` |
| Export formats | `../../assets/js/features/export.js` |
| UI shell | `../../assets/js/features/ui-shell.js` |

## Extraction Rule

Do not move feature logic just to make the directory look complete. Extract only when the change creates a testable helper, reduces real complexity, or matches an issue's accepted scope. Every extraction should preserve `index.html -> assets/js/main.js -> buildApp()` as the boot path unless a future migration is explicitly approved.
