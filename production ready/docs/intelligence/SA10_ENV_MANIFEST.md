# SA-10: Environment Manifest

Generated: 2026-06-01

## Runtime Environment

Verbatim is static and does not read server-side environment variables at runtime.

| Name | Required | Default | Source | Notes |
|---|---:|---|---|---|
| `VERBATIM_PROVIDER_KEYS_CONFIGURED_IN_UI` | No | `true` | `.env.example:12` | Documentation-only placeholder explaining provider keys are configured in the UI. |
| `VERBATIM_PUBLIC_SITE_URL` | No | `https://example.com` | `.env.example:17` | Documentation-only placeholder for final deployment URL. |

## User-Entered Runtime Settings

| Setting | Required | Storage | Evidence |
|---|---:|---|---|
| Provider choice | No | localStorage | `assets/js/app/state.js:9` |
| Groq/OpenAI-compatible key | Required for provider-backed features | localStorage only if saved | `assets/js/app/state.js:10`, `README.md:64` |
| Gemini key | Required for Gemini attachment analysis | localStorage only if saved | `README.md:65` |
| Audio/chat model choices | No | localStorage | `assets/js/app/state.js:11`, `assets/js/app/state.js:12` |
| Translation target | No | localStorage | `assets/js/app/state.js:26` |
| Assistant state | No | localStorage/sessionStorage | `assets/js/app/state.js:27` through `assets/js/app/state.js:39` |

## Secret Handling

Never put real provider keys in `.env.example`, docs, source, GitHub Actions, Netlify settings, or screenshots. This project intentionally keeps provider keys user-owned and client-side.
