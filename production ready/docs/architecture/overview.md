# Architecture Overview

Updated: 2026-05-17

## What Is This System?

Verbatim is a static browser transcription workspace. It records or imports audio/video where the browser allows it, builds transcript segments, translates text, runs AI output tasks, supports assistant conversations, manages memory/glossary state, and exports transcripts or workspace backups.

The primary runtime is still:

```text
index.html
  -> assets/js/main.js
  -> assets/js/runtime/capabilities.js
  -> assets/js/app/build-app.js
  -> Groq/OpenAI/Gemini HTTPS APIs
  -> localStorage/sessionStorage
```

There is no backend, server route layer, database, or server-side auth system. Provider API keys are user-owned values entered in the UI.

## Current Product Shape

- Primary product: static HTML/CSS/ES-module browser app.
- Optional mobile package: `apps/mobile/`, an Expo Router shell that loads the same web runtime through `components/verbatim-dom.tsx`.
- Deployment target: static hosting, including the existing Netlify config.

Desktop Chrome or Edge remains the full-support environment for live speech, tab audio, and screen capture. Mobile support depends on the browser APIs exposed by the Expo DOM/WebView host.

## Important Boundaries

- Workspace import is an untrusted input boundary. `assets/js/runtime/workspace-validation.js` validates JSON before persistence or restore.
- Provider requests are external network boundaries. `assets/js/runtime/request-timeout.js` wraps OpenAI-compatible and Gemini fetch calls with typed timeout behavior.
- Provider key persistence is explicit. Keys are stored only when saved in API Configuration, and the UI includes **Clear saved keys**.
- The thin Expo shell must not become a separate source of product logic unless a future native-parity project is approved.

## Test Coverage

Current repeatable checks:

- `npm test`: static checks plus Node unit tests.
- `npm run test:web:smoke`: Playwright app boot, navigation, workspace import rejection/success, and provider timeout UI.
- `npm --prefix apps/mobile run check`: Expo shell TypeScript check.
- `npx expo export --platform web --output-dir dist-smoke`: Expo web bundle smoke, with generated output removed afterward.

Remaining untested areas include live provider success calls, real microphone/screen-capture permissions, long-running translation queue staleness, and physical-device Expo Go behavior.

## Run Paths

Static app:

```powershell
python -m http.server 8080
```

Open `http://localhost:8080`.

Mobile shell:

```powershell
npm --prefix apps/mobile run start
```

Expo Go or simulator verification requires a device/simulator outside this shell verification environment.
