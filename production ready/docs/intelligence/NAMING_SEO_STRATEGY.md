# Naming and SEO Strategy

Generated: 2026-06-01

This report is source-grounded for the current `production ready/` package and public GitHub repository. It recommends identity, naming, topic, README, and visual changes without renaming the repository or changing application runtime code.

## 1. Current Identity Audit

| Area | Current state | Evidence | Assessment |
|---|---|---|---|
| GitHub repository | `RossDmello2/Verba-Transcriber` | GitHub CLI repo view, 2026-06-01 | Searchable enough, but "Verba" and "Verbatim" are inconsistent. |
| Public display name | `Verbatim` | `README.md:1`, `index.html:31` | Strong and memorable, but generic enough to need a category cue. |
| Package name | `verbatim-static-workspace` | `package.json:2` | Accurate private tooling name; not a public npm identity. |
| Current package description | Static browser transcription workspace with live capture, file transcription, translation, assistant tools, and export support. | `package.json:4` | Accurate and source-backed. |
| Runtime shape | Static HTML/CSS/JavaScript browser app | `index.html:56`, `assets/js/main.js:1`, `assets/js/main.js:2` | This should stay central in the README and topics. |
| Visual proof | Real screenshots plus conceptual banner | `docs/assets/screenshots/screenshot-run.json`, `docs/assets/brand/hero.png` | Real screenshots build trust; generated art must remain clearly labeled. |
| Homepage metadata | GitHub Pages nested app path is live | `https://rossdmello2.github.io/Verba-Transcriber/production%20ready/` returned HTTP 200 with the maintained package title | Use the nested package URL, not the repository root URL, for the maintained app preview. |

What is working:

- The display name **Verbatim** is short, relevant, and memorable.
- The README already states the static-app shape, provider-key boundary, test status, screenshots, and gaps.
- The current topic set includes useful domain terms such as `speech-to-text`, `transcription`, `translation`, `web-speech-api`, `groq`, `openai`, and `gemini`.

What is weak:

- The repository slug `Verba-Transcriber` does not exactly match the display name and is less searchable than a category-cued slug.
- The README opening can carry stronger search language earlier: `browser speech-to-text`, `voice-to-text`, `transcript export`, and `bring-your-own-key`.
- The previous homepage URL pointed at the repository root, which serves older root files; the maintained package is available at `/production%20ready/`.
- `html`, `css`, and `local-first` are truthful but lower-intent or ambiguous topics compared with `browser-transcription`, `transcript-editor`, and `bring-your-own-key`.

## 2. Source-Backed Project Identity

Verbatim is a static browser speech-to-text workspace. It loads from `index.html` through browser ES modules, checks runtime capabilities, builds the app in `assets/js/app/build-app.js`, stores state in browser storage, and calls configured provider APIs directly from the browser.

Evidence:

- `package.json:4` describes a static browser transcription workspace.
- `index.html:56` loads the browser module entrypoint.
- `assets/js/main.js:1` imports runtime capability detection.
- `assets/js/main.js:2` imports `buildApp`.
- `assets/js/runtime/capabilities.js:17` detects browser speech recognition support.
- `assets/js/app/state.js:6` through `assets/js/app/state.js:40` defines local and session storage keys.
- `assets/js/app/build-app.js:33` and `assets/js/app/build-app.js:34` expose Groq/OpenAI provider options.
- `assets/js/app/build-app.js:48` through `assets/js/app/build-app.js:58` exposes Gemini key and vault controls.
- `assets/js/app/build-app.js:817` through `assets/js/app/build-app.js:841` defines transcript export cards for TXT, DOCX, SRT, and VTT.
- `apps/mobile/components/verbatim-dom.tsx:21` through `apps/mobile/components/verbatim-dom.tsx:24` shows the Expo shell loads the preserved web runtime.

Strongest differentiators:

- Static app deployment with no custom backend server.
- Browser-first transcription workspace rather than a Python/desktop Whisper stack.
- Bring-your-own-key provider boundary for Groq/OpenAI-compatible and Gemini workflows.
- Transcript workspace features beyond raw transcription: translation, assistant output, memory packs, diagnostics, and export formats.
- Real Playwright/browser smoke tests and screenshot evidence.

Boundaries and limitations:

- Do not claim offline transcription. Provider-backed workflows require external services.
- Do not claim server-side privacy or secure key vaulting. Saved keys live in browser/WebView storage by user choice.
- Do not claim backend routes, auth, database, webhooks, queues, or server-side persistence.
- Do not claim native mobile parity. The Expo package is a DOM shell around the web runtime.
- Do not claim production-ready without gaps while the mobile audit and live-provider/device checks remain unresolved.

## 3. Search Intent Matrix

| Persona | Likely search query | Relevant keywords | What they need to see quickly | Topic candidates |
|---|---|---|---|---|
| Beginner developer | `javascript speech to text web app` | JavaScript, browser app, Web Speech API, speech recognition | Static setup, screenshots, simple local server command | `javascript`, `web-speech-api`, `browser-app` |
| Student or researcher | `transcribe audio export srt vtt` | transcription, subtitles, transcript export, DOCX, SRT, VTT | Export formats, editable transcript workflow, privacy caveats | `transcript-export`, `subtitles`, `transcription` |
| AI builder | `Groq transcription browser app` | Groq, OpenAI-compatible, Gemini, BYOK | Provider boundary, key handling, no backend required | `groq`, `openai`, `gemini`, `bring-your-own-key` |
| Web speech developer | `web speech api transcription app` | Web Speech API, speech recognition, voice-to-text | Browser support caveats, real UI screenshots, smoke tests | `speech-recognition`, `voice-to-text` |
| Professional engineer | `static transcription app architecture` | static web app, local browser storage, tests, security | Architecture diagram, storage model, threat boundaries, CI | `static-web-app`, `browser-transcription` |
| Non-technical evaluator | `browser voice to text transcript export` | voice-to-text, transcript editor, translation | First-screen value statement and screenshots | `voice-to-text`, `transcript-editor`, `translation` |

## 4. Similar Repository Pattern Scan

Inspected pattern families:

- Speech-to-text engines and toolkits: `SYSTRAN/faster-whisper`, `modelscope/FunASR`, `KoljaB/RealtimeSTT`.
- Local/private meeting or dictation apps: `Zackriya-Solutions/meetily`, `amicalhq/amical`, `TypeWhisper/typewhisper-mac`.
- Web transcription and subtitle tools: `pluja/whishper`, `bugbakery/audapolis`, `royshil/obs-localvocal`.
- Web/browser examples and utilities surfaced by GitHub search: `xenova/whisper-web`, `steveseguin/captionninja`, `curtgrimes/webcaptioner`.

Useful naming patterns:

- Brand + category cue: `TypeWhisper`, `Whisperboard`, `Verbatim Browser Transcriber`.
- Category-first description: "speech-to-text workspace", "transcript editor", "browser transcription app".
- Clear technical cue in README opening: static app, local/browser storage, BYOK provider calls.

Overused or risky naming patterns:

- "AI meeting assistant" if diarization, calendar integration, and meeting-note automation are not present.
- "Offline", "fully private", "on-device", or "local AI" if provider-backed transcription is part of the default story.
- "Whisper" branding if the app supports multiple providers and is not a Whisper model implementation.
- Overlong slugs such as `browser-speech-to-text-ai-transcription-translation-export-workspace`.

Topic patterns:

- Mature repos use concrete domain topics: `speech-to-text`, `speech-recognition`, `transcription`, `translation`, `subtitles`.
- Tooling topics work best when paired with use-case topics: `javascript` plus `browser-transcription`, not only language tags.
- "Privacy" and "offline" terms attract attention but are misleading here unless scoped very carefully.

README visual patterns:

- High-trust repos show real UI or output near the top.
- Generated/illustrative visuals are acceptable when they support the brand, but they should not replace real product screenshots.
- Topic-rich first paragraphs matter more than badges for search intent and non-technical clarity.

## 5. Candidate Names

Scores are 1-10. "Slug" is a recommendation only; actual repository rename requires owner approval.

| Candidate | Slug | Clarity | Memorability | Searchability | Honesty | Domain fit | Beginner appeal | Pro credibility | Uniqueness | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Verbatim | `Verba-Transcriber` current | 7 | 9 | 6 | 9 | 8 | 8 | 8 | 5 | Best display name, but current slug has mismatch. |
| Verbatim Browser Transcriber | `verbatim-browser-transcriber` | 10 | 8 | 10 | 10 | 10 | 9 | 9 | 7 | Best future slug: brand plus exact category. |
| Verbatim Transcript Workspace | `verbatim-transcript-workspace` | 9 | 8 | 9 | 10 | 10 | 8 | 9 | 7 | Strong for professional workflow positioning. |
| Verbatim Speech Workspace | `verbatim-speech-workspace` | 8 | 8 | 8 | 9 | 8 | 8 | 8 | 7 | Good, but less explicit about transcription. |
| Verbatim Voice Workspace | `verbatim-voice-workspace` | 7 | 8 | 7 | 8 | 7 | 8 | 7 | 7 | Broader than actual core. |
| BrowserScribe | `browserscribe` | 8 | 8 | 7 | 8 | 8 | 8 | 7 | 6 | Memorable, but loses existing brand. |
| Transcript Studio | `transcript-studio` | 8 | 7 | 8 | 8 | 8 | 8 | 7 | 4 | Too generic; likely conflicts in search. |
| SpeechDesk | `speechdesk` | 7 | 8 | 6 | 7 | 7 | 8 | 7 | 5 | Catchy but vague; sounds like a hosted product. |
| VoiceNote Workspace | `voicenote-workspace` | 7 | 7 | 7 | 7 | 6 | 8 | 6 | 5 | Implies note-taking more than export/transcripts. |
| Static Transcriber | `static-transcriber` | 9 | 5 | 8 | 9 | 8 | 7 | 7 | 6 | Clear but bland and not brandable. |
| Web Transcriber Studio | `web-transcriber-studio` | 9 | 6 | 9 | 9 | 9 | 8 | 8 | 5 | Useful category phrase, less distinctive. |
| BYOK Transcriber | `byok-transcriber` | 8 | 6 | 7 | 9 | 8 | 6 | 8 | 7 | Strong differentiator, but acronym-heavy for beginners. |
| CaptureScribe | `capturescribe` | 7 | 8 | 6 | 7 | 7 | 8 | 7 | 6 | More brand-like, less source-specific. |
| Transcript Foundry | `transcript-foundry` | 6 | 8 | 5 | 7 | 6 | 6 | 7 | 7 | Attractive but too metaphorical for search. |
| Verbatim BYOK | `verbatim-byok` | 7 | 7 | 6 | 9 | 7 | 5 | 8 | 8 | Good for technical users, weak for broad search. |
| Verbatim Live Transcriber | `verbatim-live-transcriber` | 9 | 8 | 9 | 8 | 8 | 9 | 8 | 7 | Good, but may overemphasize live capture over file/export workflows. |
| Verbatim Export Studio | `verbatim-export-studio` | 7 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | Too focused on export, not transcription. |

Rejected names:

- `AI Meeting Assistant`: misleading without meeting automation, diarization, calendar integration, or meeting-note pipeline.
- `Offline Whisper Studio`: false for the current provider-backed browser workflow.
- `Secure Voice Vault`: overclaims security and storage guarantees.
- `Universal Transcriber`: broader than verified browser/provider support.
- `SpeechGPT`: misleading branding and too model-specific.

## 6. Top 3 Recommended Names

### 1. Verbatim Browser Transcriber

- Display name: **Verbatim**
- Future repo slug: `verbatim-browser-transcriber`
- Tagline: Static browser speech-to-text workspace for live/file transcription, translation, BYOK assistant workflows, and transcript export.
- GitHub description: `Verbatim is a static browser speech-to-text workspace for live/file transcription, translation, BYOK AI assistant workflows, and transcript export.`
- Recommended topics: `javascript`, `static-web-app`, `browser-app`, `web-speech-api`, `speech-recognition`, `speech-to-text`, `voice-to-text`, `audio-transcription`, `browser-transcription`, `transcription`, `transcript-editor`, `transcript-export`, `subtitles`, `translation`, `ai-assistant`, `bring-your-own-key`, `openai`, `gemini`, `groq`, `react-native-web`.
- Risk/tradeoff: Best search clarity, but renaming requires explicit owner approval because clone URLs and links change.

### 2. Verbatim Transcript Workspace

- Display name: **Verbatim**
- Future repo slug: `verbatim-transcript-workspace`
- Tagline: Browser-based transcript workspace for capture, provider-backed analysis, translation, and export.
- GitHub description: `Verbatim is a browser transcript workspace for speech capture, file transcription, translation, BYOK provider calls, and export formats.`
- Risk/tradeoff: Professional and accurate, but less likely to catch simple `speech to text` searches.

### 3. Verbatim Live Transcriber

- Display name: **Verbatim**
- Future repo slug: `verbatim-live-transcriber`
- Tagline: Browser transcriber for live speech, files, translation, assistant workflows, and subtitle-ready exports.
- GitHub description: `Verbatim is a browser transcriber for live speech, files, translation, BYOK assistant workflows, and subtitle-ready exports.`
- Risk/tradeoff: Very clickable, but live capture is only one part of the product and browser support varies.

## 7. Final Recommendation

Keep the actual GitHub repository name unchanged until the owner explicitly approves a rename. Recommended future rename:

```text
RossDmello2/verbatim-browser-transcriber
```

Owner approval is required because a rename changes clone URLs, GitHub Pages URLs, existing links, local remotes, and downstream references. If approved later, the safe sequence is:

```powershell
gh repo rename verbatim-browser-transcriber --repo RossDmello2/Verba-Transcriber
git remote set-url origin https://github.com/RossDmello2/verbatim-browser-transcriber.git
```

Current no-rename strategy:

- Keep display name: **Verbatim**.
- Use category-rich tagline in README and GitHub description.
- Use the nested GitHub Pages path as the live package preview.
- Improve topics around search intent rather than language-only metadata.
- Keep real screenshots above generated artwork or directly beside it.

## 8. Visual Strategy

Use real screenshots as product proof:

- `docs/assets/screenshots/home.png`
- `docs/assets/screenshots/main-workflow.png`
- `docs/assets/screenshots/settings.png`
- `docs/assets/screenshots/mobile.png`

Use generated visuals only as supporting identity assets:

- `docs/assets/brand/hero.png`: conceptual workflow art.
- `docs/assets/brand/social-preview.png`: conceptual social preview with deterministic text overlay.

Do not use generated visuals to imply:

- live provider success,
- production metrics,
- fake dashboards,
- fake users,
- fake GitHub popularity,
- fake API responses,
- security certification.

## 9. Claim Hygiene Checklist

| Claim | Classification | Use publicly? |
|---|---|---|
| Static browser speech-to-text workspace | Source-backed | Yes |
| No custom backend required | Source-backed | Yes |
| Browser storage data layer | Source-backed | Yes |
| Direct provider calls from browser | Source-backed | Yes |
| BYOK provider workflows | Source-backed | Yes, define BYOK once |
| Offline transcription | Not source-backed | No |
| Fully private | Overclaim | No |
| Production-ready | Not currently verified | No |
| Native mobile app | Misleading | No |
| Optional Expo shell | Source-backed | Yes |
| GitHub Pages package preview | Runtime-verified via HTTP 200 | Yes, use nested URL only |
