# SA-4: Data Layer

Generated: 2026-06-01

## Data Storage

Verbatim has no database. Browser storage is the data layer.

## State Keys

| Storage | Evidence | Notes |
|---|---|---|
| Workspace and provider keys | `assets/js/app/state.js:6` through `assets/js/app/state.js:31` | `vt_*` localStorage keys. |
| Session-only AI output and diagnostics | `assets/js/app/state.js:34` through `assets/js/app/state.js:39` | `vt_*` sessionStorage keys. |
| LocalStorage read/write wrapper | `assets/js/app/build-app.js:1031` | Handles quota warning. |
| Workspace restore | `assets/js/app/build-app.js:9648` through `assets/js/app/build-app.js:9701` | Validates before restore. |

## Import Boundary

Workspace import is untrusted input. `assets/js/runtime/workspace-validation.js:83` validates payload shape, version, unsafe keys, string sizes, segment counts, memory pack counts, and translation result counts. `assets/js/runtime/workspace-validation.js:115` parses raw JSON with a size limit.

## Security Notes

- Browser storage can contain provider keys only when users save them.
- Exported workspace JSON can contain transcripts, memory packs, assistant state, and diagnostics.
- The app and docs warn contributors not to commit exports, recordings, transcripts, or keys.
