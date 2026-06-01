# SA-2: Backend / Server-Side

Generated: 2026-06-01

## Backend Status

No backend runtime is present. There are no server routes, database migrations, server auth handlers, webhook handlers, or backend deployment commands in the package.

## Evidence

| Claim | Evidence |
|---|---|
| README states no HTTP routes are exposed. | `README.md:159` |
| Provider APIs are called directly from the browser. | `README.md:159`, `README.md:163` through `README.md:165` |
| Static server command is only for local hosting. | `package.json:46` |
| Netlify deploy publishes static files. | `netlify.toml:2` |
| Provider endpoints are assembled in browser code. | `assets/js/app/build-app.js:5164`, `assets/js/app/build-app.js:5168` |

## API Boundary

The browser sends user-owned provider keys to third-party provider endpoints:

- Groq/OpenAI-compatible audio transcription and chat APIs.
- Gemini generateContent and file upload APIs.

No project-owned server sees those keys.

## Backend Recommendation

Do not add a backend proxy as part of open-source polish. A proxy would change the trust model, secret-handling model, deployment target, and operating cost. If a future issue approves a backend, it should define explicit scope for server-side key storage, authentication, abuse controls, CORS, logging, and deployment.
