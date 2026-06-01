# SA-7: Master Brief

Generated: 2026-06-01

## What This System Is

Verbatim is an open-source static browser transcription workspace. It supports live capture, file transcription, translation, assistant workflows, memory packs, diagnostics, and export formats without a custom backend.

Canonical public name: Verbatim. Current repository slug: `RossDmello2/Verba-Transcriber`. Private tooling package names: `verbatim-static-workspace` and `verbatim-mobile-shell`.

## How It Works

`index.html:56` loads `assets/js/main.js`. `assets/js/main.js:1` imports runtime capability detection and `assets/js/main.js:2` imports `buildApp`. `assets/js/app/build-app.js:16` builds the workspace UI and owns the browser runtime. Provider calls are direct browser HTTPS calls to Groq/OpenAI-compatible and Gemini APIs.

## Components

| Component | Role |
|---|---|
| `index.html` | Static document, metadata, CSS links, boot module. |
| `assets/js/main.js` | Capability gate and boot. |
| `assets/js/app/build-app.js` | Main runtime. |
| `assets/js/runtime/*` | Tested helper modules. |
| `assets/js/features/*` | Feature ownership maps. |
| `apps/mobile/*` | Thin Expo DOM shell. |
| `tests/unit/*` | Helper-level unit tests. |
| `tests/web/*` | Playwright browser smoke tests. |

## Top Risks

1. Provider keys can be saved in browser/WebView localStorage by user choice.
2. Exported transcripts/workspaces may contain sensitive data.
3. Direct provider calls depend on provider CORS/rate-limit/API policy behavior.
4. Mobile shell support depends on WebView/browser APIs.
5. Nested package root must be resolved before GitHub community files and CI can apply cleanly.
6. Mobile npm audit currently reports 13 moderate transitive advisories through Expo dependencies.

## How To Run Locally

```powershell
npm ci
npm --prefix apps/mobile ci
python -m http.server 8080
```

Open `http://localhost:8080`.

## How To Test

```powershell
npm test
npm run test:web:smoke
npm --prefix apps/mobile run check
```

## How To Deploy

Publish the package root as a static site. Netlify is the current recommended target because `netlify.toml` exists. If using GitHub Pages, Vercel, or Render, first decide whether `production ready/` remains nested or becomes the repository root.

## Future Agents Should Read First

1. `AGENTS.md`
2. `README.md`
3. `docs/README.md`
4. `docs/architecture/features.md`
5. `docs/operations/PRODUCT_SHAPE_DECISION.md`

## Completion Status

The project now has open-source metadata, feature contribution guidance, a docs index, nested mobile Dependabot coverage, deterministic CI install behavior, and refreshed intelligence artifacts. Remaining release blocker: repository-root/public-path decision.

## Verification Snapshot

- `npm ci --ignore-scripts`: PASS.
- `npm --prefix apps/mobile ci`: PASS with 13 moderate npm audit advisories reported by install.
- `npm test`: PASS.
- `npm run test:web:smoke`: PASS, 6 tests.
- `npm --prefix apps/mobile run check`: PASS.
- `npm audit --audit-level=moderate`: PASS.
- `npm --prefix apps/mobile audit --audit-level=moderate`: FAIL, 13 moderate transitive advisories through Expo dependencies.
