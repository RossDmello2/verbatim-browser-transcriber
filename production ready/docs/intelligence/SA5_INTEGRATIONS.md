# SA-5: Integrations

Generated: 2026-06-01

## External Services

| Service | Purpose | Evidence |
|---|---|---|
| Groq OpenAI-compatible API | Audio transcription/translation and chat completions. | `README.md:163`, `assets/js/app/build-app.js:5164` |
| OpenAI API | Secondary audio/chat provider. | `README.md:164`, `assets/js/app/build-app.js:5164` |
| Google Gemini API | Assistant image/PDF/text analysis and key testing. | `README.md:165`, `assets/js/app/build-app.js:5168` |
| Google Fonts | Static font load. | `index.html:19`, `index.html:20`, `assets/css/00-fonts.css:1` |
| Browser media APIs | Speech, microphone, display capture, recording, audio processing. | `assets/js/runtime/capabilities.js:17` through `assets/js/runtime/capabilities.js:23` |

## Provider Boundary

Provider requests use user-entered keys. The project does not ship a server-side secret store or proxy. Request timeout behavior is centralized in `assets/js/runtime/request-timeout.js:31` and covered by `tests/unit/request-timeout.test.mjs:10`.

## CORS/Provider Risk

Because provider calls are made directly from the browser, provider CORS support, rate limits, billing, and API policy changes can affect runtime behavior. README and security docs keep this explicit rather than hiding it behind unsupported server assumptions.
