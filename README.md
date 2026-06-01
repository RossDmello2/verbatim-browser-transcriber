# Verbatim

[![CI](https://github.com/RossDmello2/Verba-Transcriber/actions/workflows/ci.yml/badge.svg)](https://github.com/RossDmello2/Verba-Transcriber/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Static App](https://img.shields.io/badge/app-static%20HTML%2FCSS%2FJS-green.svg)](production%20ready/index.html)

**Static browser speech-to-text workspace for live/file transcription, translation, BYOK assistant workflows, and transcript export.**

Verbatim is an open-source browser transcription workspace for voice-to-text capture, audio/video file transcription, translation, bring-your-own-key (BYOK) assistant workflows, diagnostics, and subtitle-ready exports using a static HTML/CSS/JavaScript app.

The maintained package lives in [`production ready/`](production%20ready/). That folder is the app root: it contains the source files, tests, screenshots, Netlify config, docs, and optional Expo mobile shell.

## Preview

![Verbatim social preview showing a conceptual browser transcription workflow](production%20ready/docs/assets/brand/social-preview.png)

The banner above is conceptual artwork with deterministic text overlay. The screenshots below are captured from the real local app with demo/default data.

Live package preview: [GitHub Pages demo](https://rossdmello2.github.io/Verba-Transcriber/production%20ready/). Provider-backed calls still require user-owned API keys.

| Recording workspace | Transcript workflow | Mobile layout |
|---|---|---|
| ![Verbatim recording workspace](production%20ready/docs/assets/screenshots/home.png) | ![Verbatim transcript workflow with demo text](production%20ready/docs/assets/screenshots/main-workflow.png) | ![Verbatim mobile recording layout](production%20ready/docs/assets/screenshots/mobile.png) |

## Quick Start

```powershell
git clone https://github.com/RossDmello2/Verba-Transcriber.git
cd Verba-Transcriber
cd "production ready"
npm ci
python -m http.server 8080
```

Open `http://localhost:8080` in Chrome or Edge.

## Verification

Run from `production ready/`:

```powershell
npm test
npm run test:web:smoke
npm --prefix apps/mobile run check
npm audit --audit-level=moderate
npm --prefix apps/mobile audit --audit-level=moderate
```

Current status: **READY WITH GAPS**. Root install, static checks, unit tests, Playwright browser smoke, mobile typecheck, and root audit pass. The Expo shell dependency audit currently reports 13 moderate transitive advisories through Expo dependencies; live provider success calls and physical Expo Go/device verification require owner-controlled keys/devices and are not claimed.

## Documentation

- [Package README](production%20ready/README.md)
- [Documentation index](production%20ready/docs/README.md)
- [Architecture overview](production%20ready/docs/architecture/overview.md)
- [Provider/API integration notes](production%20ready/docs/api/provider-integrations.md)
- [Deployment guide](production%20ready/docs/deployment.md)
- [Naming and SEO strategy](production%20ready/docs/intelligence/NAMING_SEO_STRATEGY.md)
- [Troubleshooting](production%20ready/TROUBLESHOOTING.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## Deployment

Verbatim deploys as static files. For Netlify, set the base directory to `production ready` so `production ready/netlify.toml` is used, with publish directory `.`. Do not configure provider API keys in hosting environment variables; users enter their own keys in the app UI.

## Repository Shape

This repository also contains older root-level project files from the original Verba Transcriber history. The maintained open-source package for this publication is under `production ready/`. Root community files and workflows are included so GitHub can display the project correctly while preserving the existing repository history.

Recommended future repo slug: `verbatim-browser-transcriber`. The actual repository has not been renamed because renames affect clone URLs, GitHub Pages URLs, and downstream links.

## License

MIT. See [LICENSE](LICENSE).
