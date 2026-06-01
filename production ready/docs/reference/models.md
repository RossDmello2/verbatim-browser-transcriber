# Runtime Model Reference

Updated: 2026-06-01

This page documents model defaults and model-selection behavior that is present in the local source. It is not a live provider catalog and does not claim current pricing, availability, rate limits, or release dates.

## Source of Truth

Runtime defaults and endpoint selection are defined in `assets/js/app/build-app.js`.

| Area | Default/Behavior | Source Anchor |
|---|---|---|
| Groq audio model | `whisper-large-v3-turbo` | `defaultAudioModel()` |
| OpenAI audio model | `whisper-1` | `defaultAudioModel()` |
| Groq chat model | `openai/gpt-oss-120b` | `defaultChatModel()` |
| OpenAI chat model | `gpt-4o-mini` | `defaultChatModel()` |
| Groq fast correction model | `openai/gpt-oss-20b` | `defaultCorrectionModel()` |
| OpenAI correction model | `gpt-4o-mini` | `defaultCorrectionModel()` |
| Groq heavy correction model | `llama-3.3-70b-versatile` | correction tier routing |
| Groq audio translation | Forces `whisper-large-v3` | audio endpoint/options logic |
| Gemini assistant analysis | User-selectable from the local Gemini model options | Gemini model option definitions |

## Provider Families

| Provider | Used For | Authentication |
|---|---|---|
| Groq | Audio transcription/translation, chat, cleanup, assistant chat through OpenAI-compatible endpoints | Bearer API key |
| OpenAI-compatible/OpenAI | Audio transcription/translation, chat, cleanup fallback | Bearer API key |
| Gemini | Assistant image/PDF/text attachment analysis, Gemini key testing, Gemini assistant chat path | `x-goog-api-key` |

See [../api/provider-integrations.md](../api/provider-integrations.md) for the endpoint inventory.

## Maintenance Rule

Do not paste large generated provider catalogs into this repository. Provider model lists and prices change frequently. When model choices change in source, update this curated page with the exact local default and link to the relevant provider documentation instead of copying stale pricing tables.
