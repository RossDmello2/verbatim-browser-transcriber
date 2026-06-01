# SA-0: Discovery

Generated: 2026-06-01

## Root

| Item | Value |
|---|---|
| Project root | `C:\Users\rossd\Dropbox\PC\Downloads\git-hub\claude\production ready` |
| Parent git root | `C:\Users\rossd\Dropbox\PC\Downloads\git-hub\claude` |
| Remote | `https://github.com/RossDmello2/Verba-Transcriber.git` |
| Current branch | `codex/verbatim-open-source-restructure` |
| Package state | Nested package currently appears as untracked from the parent git root. |

## File Inventory

`FILE_LEDGER.csv` was generated from the current tree, excluding `.git`, dependency folders, build outputs, Expo cache, coverage, and test reports.

## Technology Fingerprint

| Signal | Evidence |
|---|---|
| Static HTML entrypoint | `index.html:56` loads `./assets/js/main.js`. |
| Browser ES modules | `assets/js/main.js:1` imports runtime capabilities and `assets/js/main.js:2` imports `buildApp`. |
| Main browser runtime | `assets/js/app/build-app.js:16` defines `buildApp()`. |
| Runtime helper modules | `assets/js/runtime/capabilities.js:4`, `assets/js/runtime/request-timeout.js:31`, `assets/js/runtime/workspace-validation.js:83`. |
| Root npm package | `package.json:33` defines project scripts. |
| Browser smoke tests | `package.json:43` maps `test:web:smoke` to Playwright. |
| Mobile shell package | `apps/mobile/package.json:11` defines Expo scripts. |
| Netlify static deploy | `netlify.toml:2` publishes the package root. |

## Entrypoints

| Entrypoint | Role |
|---|---|
| `index.html` | Static app document, metadata, styles, and module boot. |
| `assets/js/main.js` | Runtime capability gate and app boot. |
| `assets/js/app/build-app.js` | Main UI, state, provider calls, workspace persistence, assistant, exports, diagnostics. |
| `apps/mobile/app/index.tsx` | Expo Router screen that mounts `VerbatimDom`. |
| `apps/mobile/components/verbatim-dom.tsx` | Imports root CSS and `assets/js/main.js` into Expo DOM context. |

## Current Documentation Surfaces

- `README.md` now includes screenshots, quick start, verification commands, deployment notes, and repository-shape caveat.
- `docs/README.md` provides the top-level documentation map.
- `docs/architecture/features.md` documents feature ownership and future extraction rules.
- `docs/operations/*` records product shape, OSS landscape, UI research, verification, and productionization summary.
