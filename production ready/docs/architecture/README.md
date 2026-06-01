# Architecture Index

Verbatim is a client-only transcription workspace with an optional thin Expo shell.

## Runtime Map

```text
index.html
  -> assets/js/main.js
  -> assets/js/runtime/capabilities.js
  -> assets/js/app/build-app.js
  -> browser media APIs + direct provider HTTPS APIs
  -> localStorage/sessionStorage
```

`apps/mobile/` does not own core business logic. It uses Expo Router and `components/verbatim-dom.tsx` to load the same CSS and JavaScript inside an Expo DOM/WebView-style surface.

## Current Documents

- `overview.md`: product and runtime summary.
- `architecture.md`: deeper runtime and ownership map.
- `client-api-boundary.md`: direct provider API boundary.
- `data-layer.md`: browser storage model.
- `features.md`: current feature ownership boundaries and contribution rules.
- `frontend.md`: generated UI surface map.
- `discovery.md`: historical discovery report from the first productionization pass.

## Implementation Boundaries

- No backend, database, auth server, or HTTP API is present.
- Provider keys are user-owned and stored only when the user saves them in the UI.
- Workspace import is an untrusted-data boundary and must continue to validate before restore.
- Desktop Chrome or Edge remains the full-support browser for live speech and tab/screen capture.
