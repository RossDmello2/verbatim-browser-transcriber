# SA-0: Discovery Report
Generated: 2026-05-16T20:55:22

> Production update, 2026-05-17: this discovery report is historical. The current package now has Node metadata, Playwright smoke tests, unit tests, CI updates, and an Expo mobile shell. See `README.md`, `docs/architecture/README.md`, and `docs/operations/PRODUCTIONIZATION_SUMMARY.md` for the current state.

## Project Identity
This checkout is a self-contained static browser application package for Verbatim. The browser entry page is `index.html:1`, it loads `assets/js/main.js:7`, and the actual app runtime is built by `buildApp()` in `assets/js/app/build-app.js:14`. The README says the package is intended for local static hosting and zip submission (`README.md:1`, `README.md:5`).

## Full Directory Tree
Source inventory below excludes `.git`, dependency/build/cache directories, and generated `docs/architecture, docs/api, docs/security, and docs/operations` reports.
```text
.qoder
.qoder/agents
.qoder/skills
.vscode
.vscode/settings.json
README.md
assets
assets/css
assets/css/00-fonts.css
assets/css/10-core.css
assets/css/20-assistant.css
assets/css/30-workspace.css
assets/css/40-overrides.css
assets/js
assets/js/app
assets/js/app/build-app.js
assets/js/app/dom.js
assets/js/app/events.js
assets/js/app/state.js
assets/js/features
assets/js/features/assistant.js
assets/js/features/capture.js
assets/js/features/diagnostics.js
assets/js/features/export.js
assets/js/features/file-transcription.js
assets/js/features/memory.js
assets/js/features/providers.js
assets/js/features/transcript.js
assets/js/features/translation.js
assets/js/features/ui-shell.js
assets/js/features/workspace.js
assets/js/main.js
assets/js/runtime
assets/js/runtime/capabilities.js
docs
index.html
docs/guides/live-translate.md
docs/reference/models.md
plan.md
```

## Technology Stack
| Layer | Detected | Evidence File |
|---|---:|---|
| Python project | NO | - |
| Node/JS project | YES | assets/js/app/build-app.js, assets/js/app/dom.js, assets/js/app/events.js, assets/js/app/state.js, assets/js/features/assistant.js |
| TypeScript | NO | - |
| React | NO | - |
| Next.js | NO | - |
| Vue | NO | - |
| FastAPI | NO | - |
| Django | NO | - |
| Flask | NO | - |
| Express | NO | - |
| Go | NO | - |
| Rust | NO | - |
| Java/Spring | NO | - |
| Docker | NO | - |
| Kubernetes | NO | - |
| PostgreSQL | NO | - |
| MongoDB | NO | - |
| Redis | NO | - |
| Qdrant | YES | assets/js/app/build-app.js |
| SQLite | NO | - |
| n8n | YES | assets/js/app/build-app.js |
| LangChain/LangGraph | NO | - |
| OpenAI SDK/API | YES | docs/guides/live-translate.md, docs/reference/models.md, assets/js/app/build-app.js |
| Anthropic SDK/API | YES | docs/reference/models.md, assets/css/40-overrides.css, assets/js/app/build-app.js |
| Groq SDK/API | YES | docs/guides/live-translate.md, assets/js/app/build-app.js |
| Ollama | NO | - |
| Stripe/payments | NO | - |
| Auth/JWT | YES | assets/js/app/build-app.js |
| WebSockets | NO | - |
| GraphQL | NO | - |
| gRPC | NO | - |

## Entry Points
### `index.html`
HTML shell with CSS links and a module script for `assets/js/main.js`; `index.html:18` provides `#mainContent` where the app is injected.
```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="description" content="Verbatim is a browser-based transcription workspace with live capture, file transcription, translation, assistant tools, and export support.">
  <title>Verbatim - Production Package</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="./assets/css/00-fonts.css">
  <link rel="stylesheet" href="./assets/css/10-core.css">
  <link rel="stylesheet" href="./assets/css/20-assistant.css">
  <link rel="stylesheet" href="./assets/css/30-workspace.css">
  <link rel="stylesheet" href="./assets/css/40-overrides.css">
</head>
<body>
  <div class="toast-container" id="toastContainer"></div>
  <div class="page" id="page">
    <div id="mainContent"></div>
  </div>

  <script type="module" src="./assets/js/main.js"></script>
</body>
</html>
```
### `assets/js/main.js`
Module boot gate; imports runtime capabilities and `buildApp`, rendering an unsupported-browser message if `runtimeCapabilities.canBoot` is false (`assets/js/main.js:1`, `assets/js/main.js:3`).
```
﻿import { runtimeCapabilities, renderUnsupportedBrowser } from './runtime/capabilities.js';
import { buildApp } from './app/build-app.js';
if (!runtimeCapabilities.canBoot) {
    renderUnsupportedBrowser();
} else {
    buildApp();
}
```
### `assets/js/app/build-app.js`
Primary app builder; imports runtime capability exports (`assets/js/app/build-app.js:12`) and defines `buildApp()` at `assets/js/app/build-app.js:14`.
```
﻿/*
 * Preserved application core for the production submission package.
 * The live behavior still runs from this file so feature parity stays intact.
 * For a beginner-friendly map of responsibilities, start with:
 * - ../runtime/capabilities.js
 * - ./state.js
 * - ./dom.js
 * - ./events.js
 * - ../features/*.js
 */

import { SR, mainContent, runtimeCapabilities } from '../runtime/capabilities.js';

function buildApp() {
    mainContent.innerHTML = `
    <div class="topbar-right-actions">
      <div class="api-header api-config-btn" id="apiHeader">
        <span class="api-header-title">API Configuration</span>
        <span class="api-status-label" id="apiStatusLabel">Not configured</span>
        <span class="api-status-dot api-config-dot" id="apiStatusDot"></span>
        <svg class="api-chevron api-config-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>

    <!-- API Config Panel -->
    <div class="api-panel" id="apiPanel">
      <div class="api-body">
        <div class="api-row api-field-row">
          <span class="api-label api-field-label">Provider</span>
          <select id="apiProvider" class="api-select api-provider-select">
            <option value="groq">Groq - whisper-large-v3-turbo (free)</option>
            <option value="openai">OpenAI - whisper-1</option>
          </select>
        </div>
        <div class="api-row api-field-row">
          <span class="api-label api-field-label">API Key</span>
          <div class="api-key-row">
            <input type="password" class="api-key-input" id="apiKeyInput" placeholder="Paste your API key here..." autocomplete="off" spellcheck="false">
            <button class="api-btn-sm api-key-btn" id="apiKeyToggle" title="Show API key">Show</button>
            <button class="api-btn-sm api-key-btn save" id="apiKeySave">Save</button>
            <button class="api-btn-sm api-key-btn test" id="apiKeyTest">Test</button>
          </div>
        </div>
        <div class="api-row api-field-row">
          <span class="api-label api-field-label">Gemini key</span>
          <div class="api-key-row">
            <input type="password" class="api-key-input" id="geminiKeyInput" placeholder="Optional for assistant image and PDF analysis" autocomplete="off" spellcheck="false">
            <button class="api-btn-sm api-key-btn" id="geminiKeyToggle" title="Show Gemini API key">Show</button>
            <button class="api-btn-sm api-key-btn save" id="geminiKeySave">Save</button>
            <button class="api-btn-sm api-key-btn test" id="geminiKeyTest">Test</button>
```
### `assets/js/runtime/capabilities.js`
Runtime capability detector for browser family, platform family, speech/audio/capture API support, and unsupported-browser rendering.
```
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const mainContent = document.getElementById('mainContent');

function detectRuntimeCapabilities() {
    const ua = navigator.userAgent || '';
    const vendor = navigator.vendor || '';
    const platform = navigator.platform || '';
    const maxTouch = Number(navigator.maxTouchPoints || 0);
    const isIOS = /iPad|iPhone|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouch > 1);
    const isAndroid = /Android/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|Edg|OPR|SamsungBrowser|Firefox|FxiOS/i.test(ua) && /Apple/i.test(vendor || '');
    const isEdge = /Edg/i.test(ua);
    const isChrome = /Chrome|CriOS/i.test(ua) && !isEdge;
    const isFirefox = /Firefox|FxiOS/i.test(ua);
    const coarsePointer = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const isMobile = isIOS || isAndroid || coarsePointer;
    const hasSpeechRecognition = !!SR;
    const hasMediaRecorder = typeof window.MediaRecorder !== 'undefined';
    const hasDisplayMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');
    const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext || window.OfflineAudioContext);
    const hasGetUserMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
    const supportsMicQuality = hasMediaRecorder && hasGetUserMedia;
    const supportsTabOrScreenCapture = hasDisplayMedia && hasMediaRecorder && !isMobile && !isIOS && !isSafari;

    let browserFamily = 'Unknown';
    if (isSafari) browserFamily = 'Safari';
    else if (isEdge) browserFamily = 'Edge';
    else if (isChrome) browserFamily = 'Chrome';
    else if (isFirefox) browserFamily = 'Firefox';

    let platformFamily = 'Desktop';
    if (isIOS) platformFamily = 'iOS';
    else if (isAndroid) platformFamily = 'Android';
    else if (/Win/i.test(platform)) platformFamily = 'Windows';
    else if (/Mac/i.test(platform)) platformFamily = 'macOS';
    else if (/Linux/i.test(platform)) platformFamily = 'Linux';

    return {
        browserFamily,
        platformFamily,
        isSafari,
        isIOS,
        isMobile,
        isSecureContext: !!window.isSecureContext,
        hasSpeechRecognition,
        hasMediaRecorder,
        hasDisplayMedia,
        hasAudioContext,
        hasGetUserMedia,
        supportsMicQuality,
```

## Configuration Files
### `.vscode/settings.json`
```
{
    "liveServer.settings.port": 5502
}
```

## Priority Read Targets (Top 10 by LOC)
| Rank | LOC | File |
|---:|---:|---|
| 1 | 9895 | `assets/js/app/build-app.js` |
| 2 | 6801 | `assets/css/40-overrides.css` |
| 3 | 3562 | `assets/css/30-workspace.css` |
| 4 | 2399 | `assets/css/10-core.css` |
| 5 | 1309 | `assets/css/20-assistant.css` |
| 6 | 415 | `docs/reference/models.md` |
| 7 | 330 | `docs/guides/live-translate.md` |
| 8 | 68 | `assets/js/runtime/capabilities.js` |
| 9 | 52 | `assets/js/app/state.js` |
| 10 | 44 | `README.md` |

## File Size and Complexity Ranking (Top 40)
| LOC | File |
|---:|---|
| 9895 | `assets/js/app/build-app.js` |
| 6801 | `assets/css/40-overrides.css` |
| 3562 | `assets/css/30-workspace.css` |
| 2399 | `assets/css/10-core.css` |
| 1309 | `assets/css/20-assistant.css` |
| 415 | `docs/reference/models.md` |
| 330 | `docs/guides/live-translate.md` |
| 68 | `assets/js/runtime/capabilities.js` |
| 52 | `assets/js/app/state.js` |
| 44 | `README.md` |
| 24 | `index.html` |
| 23 | `assets/js/app/dom.js` |
| 19 | `assets/js/features/providers.js` |
| 18 | `assets/js/features/ui-shell.js` |
| 18 | `assets/js/features/transcript.js` |
| 18 | `assets/js/features/export.js` |
| 17 | `assets/js/features/workspace.js` |
| 17 | `assets/js/features/translation.js` |
| 17 | `assets/js/features/memory.js` |
| 17 | `assets/js/features/file-transcription.js` |
| 17 | `assets/js/features/diagnostics.js` |
| 17 | `assets/js/features/capture.js` |
| 17 | `assets/js/features/assistant.js` |
| 14 | `assets/js/app/events.js` |
| 7 | `assets/js/main.js` |
| 3 | `.vscode/settings.json` |
| 1 | `assets/css/00-fonts.css` |
| 0 | `plan.md` |

## Dependency Catalog
Production update: the package now includes root `package.json` / `package-lock.json` for static, unit, and browser smoke checks, plus `apps/mobile/package.json` / `apps/mobile/package-lock.json` for the optional Expo shell. Runtime dependencies remain browser-provided APIs and direct HTTPS API calls visible in source: Web Speech API, `MediaRecorder`, `getUserMedia`, Groq/OpenAI-compatible endpoints, and Gemini endpoints.

## Git Context
### `git status --short --branch`
```text
## main...origin/main
 D ../Barba.md
 D ../IMG_1146.mp3
 D ../guide.md
 M ../index.html
 D ../memory.md
 M ../script.js
 M ../style.css
 D ../update.md
 D ../verba.md
 D ../voice.md
?? ../.kilo/
?? ../.opencode/
?? ../Research.md
?? "../Text to speech/"
?? ../error-matrix.txt
?? ../guide1.md
?? ../memory5.md
?? "../production ready.zip"
?? ./
?? "../speech to speech agent/"
?? ../stt.md
```
### `git log --oneline -20`
```text
c6fd125 Update project files and add docs
d608e35 Update project changes
8460976 Update index, script, style and add audio + update docs
0a2a19a Initial commit for Verba Transcriber
```
### `git branch -a`
```text
* main
  remotes/origin/main
```
The Git repository root is the parent repository context; this `production ready` folder appears as an untracked directory from `git status`, so generated intelligence artifacts should be treated as new files inside this folder.

## Test Infrastructure
Production update: root scripts now expose `npm test`, `npm run test:unit`, `npm run test:web:smoke`, and `npm run check:mobile`. Unit tests cover workspace validation and timeout helpers. Playwright smoke tests cover static app boot, navigation, invalid workspace import rejection, valid workspace import restore, and provider timeout UI.

## Flags for Subsequent Agents
- `assets/js/app/build-app.js` is the dominant runtime file and must be read by subsystem sections rather than treated as a simple app bootstrap file.
- Smaller files under `assets/js/features/` are ownership maps, not separate runtime implementations; verify behavior in `build-app.js` before claiming it.
- This app stores user-entered provider API keys in `localStorage` (`assets/js/app/build-app.js:1084`, `assets/js/app/build-app.js:5165`, `assets/js/app/build-app.js:8549`). SA-5 and SA-6 must assess this client-only risk.
- There is no server-side auth boundary, database, backend route table, or env-var validation layer in this static package.
- CodeRabbit plugin was requested by the user, but the local `coderabbit` CLI was not installed when checked; record this in quality tooling rather than claiming CodeRabbit review results.
