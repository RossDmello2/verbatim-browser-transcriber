# Product Shape Decision

Date: 2026-06-01

## Decision

Keep Verbatim as a static browser-first application and add a separate thin Expo mobile shell under `apps/mobile/`.

## Rationale

| Evidence | Source |
|---|---|
| The protected production runtime is `index.html`, `assets/css/**`, and `assets/js/**`. | `AGENTS.md:5` |
| The browser entrypoint loads `assets/js/main.js` from `index.html`. | `index.html:22` |
| The boot module checks runtime capability support before calling `buildApp()`. | `assets/js/main.js:1` |
| The main UI/runtime implementation is concentrated in `assets/js/app/build-app.js`. | `assets/js/app/build-app.js:16` |
| Runtime helpers cover capability detection, provider timeouts, and workspace import validation. | `assets/js/runtime/capabilities.js:4`, `assets/js/runtime/request-timeout.js:31`, `assets/js/runtime/workspace-validation.js:83` |
| The app depends on browser APIs such as `SpeechRecognition`, `MediaRecorder`, `getDisplayMedia`, `AudioContext`, `localStorage`, and `sessionStorage`. | `assets/js/runtime/capabilities.js:1`, `assets/js/runtime/capabilities.js:17`, `assets/js/runtime/capabilities.js:23`, `assets/js/app/build-app.js:1031` |
| There is no backend API, database, server auth layer, or server route surface. | `docs/architecture/overview.md:20`, `README.md:118` |
| Direct provider calls are client-side Groq/OpenAI-compatible and Gemini HTTPS requests. | `assets/js/app/build-app.js:5164`, `assets/js/app/build-app.js:5168`, `README.md:122` |
| The mobile package imports the root CSS and `assets/js/main.js` through the Expo DOM host. | `apps/mobile/components/verbatim-dom.tsx:5`, `apps/mobile/components/verbatim-dom.tsx:24` |

## Mobile Boundary

`apps/mobile/components/verbatim-dom.tsx` imports the root CSS and `assets/js/main.js`. The mobile package owns only Expo Router bootstrapping and DOM/WebView hosting.

Not included in this pass:

- Native audio recorder bridge.
- Native file picker bridge.
- SecureStore migration.
- App Store or Play Store release packaging.
- Native parity for desktop-only tab/screen capture.

## Deployment Shape

- Primary deploy target: static hosting, including Netlify through `netlify.toml`.
- Optional mobile run target: Expo development shell through `npm --prefix apps/mobile run start`.

## Surfaces Accepted

- Static browser UI: accepted as the primary product surface.
- Thin Expo shell: accepted as an optional wrapper around the existing browser runtime.
- Direct provider HTTPS calls: accepted as the current no-backend trust boundary.
- Contributor feature guides: accepted to make future feature additions easier without a risky rewrite.

## Surfaces Rejected

- Backend proxy: rejected unless a future issue explicitly approves server-side secret handling and deployment.
- Database/auth server: rejected because no account system or persistent multi-user backend exists.
- React/React Native rewrite: rejected because it would duplicate the working static runtime and increase regression risk.
- Marketing landing page: rejected because the product should open directly to the usable workspace.

## Verification Gates

- `npm test`
- `npm run test:web:smoke`
- `npm --prefix apps/mobile run check`
- For Expo behavior changes: `npm --prefix apps/mobile run start`, followed by device or simulator verification when available.
