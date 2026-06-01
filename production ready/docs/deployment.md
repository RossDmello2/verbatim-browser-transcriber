# Deployment Guide

Verbatim is a static browser app. The deployment artifact is the app folder itself; there is no backend build, server process, database migration, worker, queue, cron job, or server-side secret store in the current project.

## Recommended Static Host Shape

Use `production ready/` as the app root unless the repository is deliberately flattened.

| Setting | Value |
|---|---|
| Base directory | `production ready` |
| Install command | `npm ci` if the host runs checks; otherwise none required for static serving |
| Build command | None required |
| Publish directory | `.` |
| Runtime secrets | None |
| Required protocol | HTTPS or `localhost` |

Do not configure Groq, OpenAI, Gemini, or other provider keys as hosting environment variables. The app is client-side and expects users to enter their own keys in the UI.

## Netlify

`netlify.toml` lives in this folder and sets:

- `publish = "."`
- `X-Content-Type-Options = "nosniff"`
- `X-Frame-Options = "DENY"`
- `Referrer-Policy = "strict-origin-when-cross-origin"`
- long-lived immutable caching for `/assets/*`

For a repository where this folder remains nested, set the Netlify base directory to `production ready` so Netlify reads this `netlify.toml` from the package root.

## GitHub Pages

GitHub Pages can serve static files, but this repository currently keeps the maintained app under `production ready/`. The maintained package preview is available at `https://rossdmello2.github.io/verbatim-browser-transcriber/production%20ready/`. Do not use the repository root Pages URL as package proof unless the root files are deliberately aligned with the maintained package.

## Vercel

Vercel can serve static files, but there is no serverless function, backend API, database, or build output directory in the current package. If using Vercel, configure the project root as `production ready` and avoid adding provider secrets to Vercel environment variables.

## Post-Deploy Smoke Check

After deployment:

1. Open the deployed URL over HTTPS.
2. Confirm the workspace renders and the browser console has no blocking errors.
3. Confirm `assets/js/main.js`, `assets/js/runtime/capabilities.js`, and `assets/js/app/build-app.js` return HTTP 200.
4. Check API Configuration shows empty key fields.
5. Do not test real provider keys on a public/shared browser profile.

## Caveats

- Browser speech, microphone, tab audio, and screen capture behavior depends on the user's browser and permissions.
- Direct provider calls depend on provider CORS behavior, API policy, rate limits, billing, and key permissions.
- The optional Expo shell is not a static web deployment requirement.
