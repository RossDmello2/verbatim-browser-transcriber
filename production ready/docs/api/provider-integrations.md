# SA-5: Integrations Report
Generated: 2026-05-16T21:13:29

> Production update, 2026-05-17: provider fetch paths now use a shared timeout helper in `assets/js/runtime/request-timeout.js`. The environment now includes `.env.example`, `package.json`, and `package-lock.json`; API keys remain user-entered browser/WebView values, not server env vars.

## External Service Catalog
| Service | Purpose | Evidence | Auth Method | Failure Behavior |
|---|---|---|---|---|
| Groq OpenAI-compatible API | Audio transcription/translation and chat completions | `assets/js/app/build-app.js:5143`-`5152` | Bearer API key from browser storage | Shared retry wrapper |
| OpenAI API | Secondary audio/chat provider | `assets/js/app/build-app.js:5143`-`5152` fallback branches | Bearer API key from browser storage | Shared retry wrapper |
| Google Gemini API | Assistant multimodal file/image/PDF analysis and Gemini key test | `assets/js/app/build-app.js:5155`-`5160` | `x-goog-api-key` | Gemini assistant retries expired file references once |
| Browser media APIs | Speech/capture/recording/local files | `assets/js/runtime/capabilities.js:17`-`23`, `assets/js/app/build-app.js:2595`-`2629` | Browser permissions | UI fallback/toast errors |
| Google Fonts | Font preconnect/load | `index.html:8`-`9`, `assets/css/00-fonts.css:1` | None | No app fallback |
| OpenRouter models endpoint | Documentation/example in docs/reference/models.md, not runtime | `docs/reference/models.md:359` | None in docs snippet | Not runtime code |

## Current Official API Verification
The parent orchestration verified the live official docs during this run. Groq documents the OpenAI-compatible base URL and speech-to-text audio endpoints; OpenAI documents `/v1/audio/transcriptions` and `/v1/chat/completions`; Gemini documents `generateContent`, `x-goog-api-key`, and the Files API upload endpoint. These external facts support the local endpoint mapping in `assets/js/app/build-app.js:5143`-`assets/js/app/build-app.js:5160`.
| Source | URL |
|---|---|
| Groq OpenAI compatibility | https://console.groq.com/docs/openai |
| Groq speech-to-text endpoints | https://console.groq.com/docs/speech-to-text |
| Groq API reference | https://console.groq.com/docs/api-reference |
| OpenAI audio API reference | https://platform.openai.com/docs/api-reference/audio |
| OpenAI chat completions API reference | https://platform.openai.com/docs/api-reference/chat/create |
| Gemini API docs | https://ai.google.dev/gemini-api/docs |
| Gemini API reference | https://ai.google.dev/api |
| Gemini Files API | https://ai.google.dev/api/files |

## External Call Inventory
| Call | File:Line | Auth | Timeout/Retry/Failure Behavior |
|---|---|---|---|
| Groq/OpenAI audio transcription or translation | `assets/js/app/build-app.js`, endpoint family at `getAudioEndpoint()` | Bearer key from saved provider keys | Shared timeout helper; retry wrapper handles 429/5xx/network |
| Groq/OpenAI chat completions | `assets/js/app/build-app.js`, endpoint family at `getChatEndpoint()` | Bearer key | Shared timeout helper; non-streaming response parsed after completion |
| Gemini key test generateContent | `assets/js/app/build-app.js` | `x-goog-api-key` | Shared timeout helper; parses provider error text |
| Gemini upload start | `assets/js/app/build-app.js` | `x-goog-api-key`, resumable upload headers | Shared timeout helper; throws parsed error |
| Gemini upload finalize | `assets/js/app/build-app.js` | dynamic upload URL plus upload command headers | Shared timeout helper; no retry loop |
| Gemini assistant generateContent | `assets/js/app/build-app.js` | `x-goog-api-key` | Shared timeout helper; loops across stored keys; retries once on expired file reference |

## LLM Integration Details
- Default audio models are `whisper-large-v3-turbo` for Groq and `whisper-1` for OpenAI at `assets/js/app/build-app.js:4664`-`assets/js/app/build-app.js:4666`.
- Default chat models are `openai/gpt-oss-120b` for Groq and `gpt-4o-mini` for OpenAI at `assets/js/app/build-app.js:4668`-`assets/js/app/build-app.js:4670`.
- Correction models are `openai/gpt-oss-20b` for Groq and `gpt-4o-mini` for OpenAI at `assets/js/app/build-app.js:4672`-`assets/js/app/build-app.js:4674`; heavy Groq correction uses `llama-3.3-70b-versatile` at `assets/js/app/build-app.js:6176`-`6179`.
- Groq audio translation forces `whisper-large-v3` at `assets/js/app/build-app.js:5128`-`assets/js/app/build-app.js:5132`.
- Gemini analysis models and local quota metadata are defined at `assets/js/app/build-app.js:4688`-`assets/js/app/build-app.js:4715`.
- Live translation system prompt is built at `assets/js/app/build-app.js:5559`-`assets/js/app/build-app.js:5569`; the user message sends JSON segment items at `assets/js/app/build-app.js:5786`-`assets/js/app/build-app.js:5801`.
- Transcript correction system prompt requires corrected transcript text only and preserving meaning/names/numbers at `assets/js/app/build-app.js:6188`-`assets/js/app/build-app.js:6197`.
- AI output tasks send task system text, output-style system text, optional memory, and transcript user content at `assets/js/app/build-app.js:6560`-`assets/js/app/build-app.js:6577`.
- Assistant generation config is `temperature: 0.3`, `maxTokens: 8192` at `assets/js/app/build-app.js:7580`-`assets/js/app/build-app.js:7587`; attachment instructions are built at `assets/js/app/build-app.js:7590`-`assets/js/app/build-app.js:7600`.
- Response parsing is non-streaming: provider wrapper returns full JSON/text at `assets/js/app/build-app.js:6497`-`assets/js/app/build-app.js:6498`; Gemini text extraction happens at `assets/js/app/build-app.js:7932`-`assets/js/app/build-app.js:7940`.

## Webhook Handlers
Webhooks are NOT PRESENT. There are no server routes, no webhook signature validation code, and no webhook receiver endpoints; `index.html:22` loads a static module, while `assets/js/main.js:1`-`assets/js/main.js:7` only boots browser code.

## File Storage Analysis
| Storage System | File Types/Data | Evidence | Upload Validation | Cleanup/Failure |
|---|---|---|---|---|
| Local uploaded media | `state.uploadedFile` | `assets/js/app/build-app.js:8763`-`8809` | 500MB size and media type/extension allowlist | Object URLs revoked on replacement/removal |
| Downloads | transient object URL | `assets/js/app/build-app.js:4451`-`4457` | generated app data only | URL revoked after click |
| Assistant attachments | in-memory metadata/FileReader/object URL | `assets/js/app/build-app.js:7690`-`7730`, `8195`-`8243` | kind/size/model support checks | cached in memory only |
| Gemini Files API | remote provider file URI | `assets/js/app/build-app.js:7835`-`7878`, `7910`-`7923` | Gemini key required | expired references trigger re-upload once |

## Auth/OAuth Integrations
OAuth, SAML, OIDC, social login, and app sessions are NOT PRESENT. Authentication is direct provider API-key auth from browser storage: Bearer headers for Groq/OpenAI-compatible calls at `assets/js/app/build-app.js:6472`-`6474`, and `x-goog-api-key` for Gemini at `assets/js/app/build-app.js:7960`-`7965`.

## Environment Variable Completeness
`.env.example`, `package.json`, and lockfiles exist for documentation and verification. No runtime env-var loader exists in the static app. User-entered keys are read from browser/WebView storage only after the user saves them in the UI.

## Hardcoded Credentials Found
No hardcoded provider credential value was identified. Key-related source lines are placeholders/UI/storage only, including `assets/js/app/build-app.js:38`, `assets/js/app/build-app.js:47`, `assets/js/app/build-app.js:137`, `assets/js/app/build-app.js:141`, and `assets/js/app/build-app.js:8547`-`assets/js/app/build-app.js:8568`. No secret values are printed in this report.

## URL Inventory
| File:Line | URL |
|---|---|
| assets/css/00-fonts.css:1 | https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&display=swap |
| assets/css/40-overrides.css:4168 | http://www.w3.org/2000/svg |
| assets/js/app/build-app.js:142 | https://console.groq.com/keys |
| assets/js/app/build-app.js:143 | https://platform.openai.com/api-keys |
| assets/js/app/build-app.js:144 | https://aistudio.google.com/app/apikey |
| assets/js/app/build-app.js:1573 | https://console.groq.com/keys |
| assets/js/app/build-app.js:1574 | https://platform.openai.com/api-keys |
| assets/js/app/build-app.js:1575 | https://aistudio.google.com/app/apikey |
| assets/js/app/build-app.js:4515 | http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas |
| assets/js/app/build-app.js:4515 | http://schemas.openxmlformats.org/markup-compatibility/2006 |
| assets/js/app/build-app.js:4515 | http://schemas.openxmlformats.org/officeDocument/2006/relationships |
| assets/js/app/build-app.js:4515 | http://schemas.openxmlformats.org/officeDocument/2006/math |
| assets/js/app/build-app.js:4515 | http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing |
| assets/js/app/build-app.js:4515 | http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing |
| assets/js/app/build-app.js:4515 | http://schemas.openxmlformats.org/wordprocessingml/2006/main |
| assets/js/app/build-app.js:4515 | http://schemas.microsoft.com/office/word/2010/wordml |
| assets/js/app/build-app.js:4515 | http://schemas.microsoft.com/office/word/2010/wordprocessingGroup |
| assets/js/app/build-app.js:4515 | http://schemas.microsoft.com/office/word/2010/wordprocessingInk |
| assets/js/app/build-app.js:4515 | http://schemas.microsoft.com/office/word/2006/wordml |
| assets/js/app/build-app.js:4515 | http://schemas.microsoft.com/office/word/2010/wordprocessingShape |
| assets/js/app/build-app.js:4612 | http://schemas.openxmlformats.org/package/2006/content-types |
| assets/js/app/build-app.js:4621 | http://schemas.openxmlformats.org/package/2006/relationships |
| assets/js/app/build-app.js:4622 | http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument |
| assets/js/app/build-app.js:5145 | https://api.groq.com/openai/v1/audio/${kind}` |
| assets/js/app/build-app.js:5146 | https://api.openai.com/v1/audio/${kind}`; |
| assets/js/app/build-app.js:5151 | https://api.groq.com/openai/v1/chat/completions |
| assets/js/app/build-app.js:5152 | https://api.openai.com/v1/chat/completions |
| assets/js/app/build-app.js:5156 | https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model |
| assets/js/app/build-app.js:5160 | https://generativelanguage.googleapis.com/upload/v1beta/files |
| index.html:8 | https://fonts.googleapis.com |
| index.html:9 | https://fonts.gstatic.com |
| docs/reference/models.md:359 | https://openrouter.ai/api/v1/models |
| docs/reference/models.md:397 | https://openrouter.ai/api/v1/models |
| docs/reference/models.md:409 | https://openrouter.ai/api/v1/models |
| README.md:27 | http://localhost:8080 |
