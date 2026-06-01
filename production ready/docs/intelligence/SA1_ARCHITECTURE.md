# SA-1: Architecture

Generated: 2026-06-01

## System Summary

Verbatim is a client-only transcription workspace. The production path remains:

```text
index.html
  -> assets/js/main.js
  -> runtime capability gate
  -> buildApp()
  -> browser media APIs and direct provider HTTPS APIs
  -> localStorage/sessionStorage
```

## Runtime Flow

| Step | Evidence | Notes |
|---|---|---|
| Document loads CSS bundles | `index.html:22` through `index.html:26` | CSS is still plain static assets. |
| Document loads module boot | `index.html:56` | No bundler or framework build is required. |
| Boot imports capability/runtime modules | `assets/js/main.js:1`, `assets/js/main.js:2` | Browser capability support is checked before app build. |
| Capability detector checks browser APIs | `assets/js/runtime/capabilities.js:17` through `assets/js/runtime/capabilities.js:23` | Speech recognition, MediaRecorder, display capture, audio context, getUserMedia. |
| Main app is injected | `assets/js/app/build-app.js:16` | `buildApp()` owns the active workspace. |

## Ownership Boundaries

| Area | Files | Boundary |
|---|---|---|
| Boot/runtime gate | `assets/js/main.js`, `assets/js/runtime/capabilities.js` | Browser support detection and unsupported-browser rendering. |
| Main app | `assets/js/app/build-app.js` | Active behavior and UI. |
| Testable helpers | `assets/js/runtime/request-timeout.js`, `assets/js/runtime/workspace-validation.js` | Extracted logic with unit tests. |
| Feature maps | `assets/js/features/*.js` | Contributor ownership guides, not full implementation. |
| Mobile shell | `apps/mobile/**` | Thin Expo DOM host only. |

## Architecture Decision

No backend, database, server auth, or server route layer should be added without explicit approval. That decision is grounded in `AGENTS.md:5`, `AGENTS.md:7`, `README.md:118`, and `docs/operations/PRODUCT_SHAPE_DECISION.md`.

## Contributor Extension Path

Future contributors should:

1. Read `docs/architecture/features.md`.
2. Identify the closest feature domain.
3. Preserve `index.html -> assets/js/main.js -> buildApp()` unless a migration is approved.
4. Extract only small testable helpers when needed.
5. Add unit or Playwright coverage for changed behavior.
