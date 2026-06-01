# SA-2: Backend Report
Generated: 2026-05-16T21:09:03

## Complete Route Inventory
Server-side HTTP routes are NOT PRESENT. Evidence: `index.html:22` loads a browser module script, `assets/js/main.js:1`-`assets/js/main.js:7` only imports modules and calls `buildApp()`, and `README.md:13`-`README.md:28` instructs running a generic static file server. There is no FastAPI/Flask/Express/Django route file in the source inventory.
| Method | Path | Handler | Auth Required | DB Ops | External Calls | Bugs Found |
|---|---|---|---|---|---|---|
| NOT PRESENT | NOT PRESENT | NOT PRESENT | NOT PRESENT | NOT PRESENT | NOT PRESENT | Static browser app only |

## Client-Side Request Handler Inventory
| Handler | Trigger/Location | Endpoint | Validation | Failure Handling |
|---|---|---|---|---|
| testApiKey | `assets/js/app/build-app.js:3046` | audio transcription | key presence at `assets/js/app/build-app.js:3047` | catch updates status at `assets/js/app/build-app.js:3068` |
| testGeminiKey | `assets/js/app/build-app.js:3077` | Gemini generateContent | Gemini key presence at `assets/js/app/build-app.js:3078` | catch toast at `assets/js/app/build-app.js:3104` |
| transcribeBlob | `assets/js/app/build-app.js:3109` | Groq/OpenAI audio | FormData at `assets/js/app/build-app.js:3118`-`3124` | delegates provider errors |
| transcribeChunks | `assets/js/app/build-app.js:3130` | delegates transcribeBlob | abort check at `assets/js/app/build-app.js:3136` | partial cache at `assets/js/app/build-app.js:3151` |
| processUploadedFile | `assets/js/app/build-app.js:3318` | audio endpoints | uploaded file/key checks at `assets/js/app/build-app.js:3319` | catch/finally at `assets/js/app/build-app.js:3446`-`3461` |
| flushTranslationQueue | `assets/js/app/build-app.js:5725` | chat completions | key/cache/pending checks at `assets/js/app/build-app.js:5737`-`5761` | degrades at `assets/js/app/build-app.js:5815`-`5834` |
| requestWithProvider | `assets/js/app/build-app.js:6454` | caller URL | key vault at `assets/js/app/build-app.js:6465` | retry/backoff at `assets/js/app/build-app.js:6503`-`6515` |
| callChatModel | `assets/js/app/build-app.js:6534` | chat completions | transcript/key checks at `assets/js/app/build-app.js:6535`-`6538` | context branch at `assets/js/app/build-app.js:6587`-`6597` |
| askTranscriptQuestion | `assets/js/app/build-app.js:6604` | chat completions | transcript/prompt/key checks at `assets/js/app/build-app.js:6605`-`6609` | context branch at `assets/js/app/build-app.js:6665`-`6673` |
| requestTranscriptCorrection | `assets/js/app/build-app.js:6176` | chat completions | gated by `shouldRouteSegmentToCorrection` at `assets/js/app/build-app.js:6161` | caller handles |
| uploadGeminiFileWithKey | `assets/js/app/build-app.js:7835` | Gemini upload | file/key caller-provided | throws at `assets/js/app/build-app.js:7853`-`7873` |
| requestGeminiAssistantReply | `assets/js/app/build-app.js:7950` | Gemini generateContent | key presence at `assets/js/app/build-app.js:7951` | expired-file retry at `assets/js/app/build-app.js:7993`-`7998` |
| askAssistant | `assets/js/app/build-app.js:8001` | Gemini or chat completions | attachment/key checks at `assets/js/app/build-app.js:8013`-`8023` | catch/finally at `assets/js/app/build-app.js:8072`-`8080` |

## Middleware Analysis
Server middleware is NOT PRESENT. The closest cross-cutting request layer is `requestWithProvider()`, which adds `Authorization: Bearer` or `x-goog-api-key` headers at `assets/js/app/build-app.js:6472`-`assets/js/app/build-app.js:6474`, retries 429/5xx/network failures at `assets/js/app/build-app.js:6503`-`assets/js/app/build-app.js:6515`, rotates stored keys through the outer key loop at `assets/js/app/build-app.js:6468`, and parses JSON/text responses at `assets/js/app/build-app.js:6497`-`assets/js/app/build-app.js:6498`.

## Service Layer Analysis
- Provider service: endpoint builders and provider key vaults live at `assets/js/app/build-app.js:5135`-`assets/js/app/build-app.js:5165`.
- File transcription service: media selection, hash/cache, decode, analysis, chunking, transcription, retry, and render are in `assets/js/app/build-app.js:3318`-`assets/js/app/build-app.js:3461`.
- Translation service: queueing, cache, provider chat call, parsing, degradation, and stats are in `assets/js/app/build-app.js:5682`-`assets/js/app/build-app.js:5834`.
- Assistant service: model catalog/routing, attachments, Gemini upload/generation, and OpenAI-compatible chat routing span `assets/js/app/build-app.js:4718`-`assets/js/app/build-app.js:8080`.

## Error Handling Report
| Location | Exception/Error/Toast Evidence |
|---|---|
| assets/js/app/build-app.js:1027 | try { |
| assets/js/app/build-app.js:1029 | } catch (e) { |
| assets/js/app/build-app.js:1031 | console.warn('localStorage quota exceeded for key:', key); |
| assets/js/app/build-app.js:1033 | toast('Storage full - oldest session data may not be saved.', 'warning'); |
| assets/js/app/build-app.js:1089 | try { return normalizeProviderKeyStore(JSON.parse(localStorage.getItem('vt_provider_keys') \|\| '{}')); } |
| assets/js/app/build-app.js:1090 | catch (e) { return normalizeProviderKeyStore({}); } |
| assets/js/app/build-app.js:1097 | try { |
| assets/js/app/build-app.js:1100 | } catch (e) { |
| assets/js/app/build-app.js:1108 | try { return JSON.parse(localStorage.getItem('vt_gemini_usage') \|\| '{}') \|\| {}; } |
| assets/js/app/build-app.js:1109 | catch (e) { return {}; } |
| assets/js/app/build-app.js:1124 | try { return JSON.parse(sessionStorage.getItem('vt_diag') \|\| '{}'); } |
| assets/js/app/build-app.js:1125 | catch (e) { return {}; } |
| assets/js/app/build-app.js:1140 | try { |
| assets/js/app/build-app.js:1143 | } catch (e) { |
| assets/js/app/build-app.js:1148 | try { |
| assets/js/app/build-app.js:1151 | } catch (e) { |
| assets/js/app/build-app.js:1156 | try { |
| assets/js/app/build-app.js:1158 | } catch (e) { |
| assets/js/app/build-app.js:1177 | try { return JSON.parse(sessionStorage.getItem('vt_correction_cache') \|\| '{}') \|\| {}; } |
| assets/js/app/build-app.js:1178 | catch (e) { return {}; } |
| assets/js/app/build-app.js:1789 | try { |
| assets/js/app/build-app.js:1796 | } catch (err) { |
| assets/js/app/build-app.js:1797 | console.warn('Sliding pill sync failed', err); |
| assets/js/app/build-app.js:1923 | try { |
| assets/js/app/build-app.js:1939 | } catch (err) { |
| assets/js/app/build-app.js:1940 | console.warn('Workspace navigation transition failed', err); |
| assets/js/app/build-app.js:2175 | try { stream?.getTracks?.().forEach(track => track.stop()); } catch (e) { } |
| assets/js/app/build-app.js:2197 | try { stream?.getTracks?.().forEach(track => track.stop()); } catch (e) { } |
| assets/js/app/build-app.js:2213 | try { |
| assets/js/app/build-app.js:2215 | } catch (e) { } |
| assets/js/app/build-app.js:2314 | toast('Enter a memory pack name first', 'warning'); |
| assets/js/app/build-app.js:2326 | toast('Memory pack created', 'success'); |
| assets/js/app/build-app.js:2340 | toast('Primary memory pack cleared', 'info'); |
| assets/js/app/build-app.js:2350 | toast('Memory pack deleted', 'info'); |
| assets/js/app/build-app.js:2446 | toast(normalized ? 'Memory imported' : 'Memory cleared', normalized ? 'success' : 'info'); |
| assets/js/app/build-app.js:2576 | if (!options.silent) toast('Live mode only works with the microphone. Switched to Quality.', 'warning'); |
| assets/js/app/build-app.js:2591 | toast('Recording needs HTTPS, localhost, or 127.0.0.1. file pages may fail.', 'warning', 4200); |
| assets/js/app/build-app.js:2596 | if (!ensureSecureContextForCapture()) throw new Error('Capture requires HTTPS, localhost, or 127.0.0.1.'); |
| assets/js/app/build-app.js:2600 | throw new Error('Open Capture Help for the recommended setup on this device.'); |
| assets/js/app/build-app.js:2603 | if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone capture is not available in this browser.'); |
| assets/js/app/build-app.js:2615 | throw new Error('Meeting audio capture from tabs or apps is limited here. Use Capture Help for the best fallback.'); |
| assets/js/app/build-app.js:2623 | throw new Error(source === 'browser-tab' ? 'No tab audio was shared. Pick the correct tab and enable Share audio.' : 'No shared audio track was provided. Enable |
| assets/js/app/build-app.js:2699 | toast('Microphone permission denied', 'error'); |
| assets/js/app/build-app.js:2717 | toast('Recognition error: ' + e.error, 'error'); |
| assets/js/app/build-app.js:2766 | console.warn('Assistant speech recognition error:', e.error); |
| assets/js/app/build-app.js:2770 | toast('Assistant voice input unavailable', 'warning'); |
| assets/js/app/build-app.js:3041 | toast(`Detected ${normalized.toUpperCase()} while ${selected.toUpperCase()} was selected. Recovery will prefer detected language context.`, 'info', 4200); |
| assets/js/app/build-app.js:3047 | if (!getProviderKeys().length) { toast('Enter an API key first', 'warning'); return; } |
| assets/js/app/build-app.js:3048 | try { |
| assets/js/app/build-app.js:3067 | toast('API key valid', 'success'); |
| assets/js/app/build-app.js:3068 | } catch (e) { |
| assets/js/app/build-app.js:3072 | toast('Connection failed: ' + e.message, 'error'); |
| assets/js/app/build-app.js:3078 | if (!getProviderKeys('gemini').length) { toast('Enter a Gemini key first', 'warning'); return; } |
| assets/js/app/build-app.js:3079 | try { |
| assets/js/app/build-app.js:3096 | if (!resp.ok) throw new Error(payload?.error?.message \|\| payload?.message \|\| raw \|\| `Gemini test failed (${resp.status})`); |
| assets/js/app/build-app.js:3103 | toast('Gemini key valid', 'success'); |
| assets/js/app/build-app.js:3104 | } catch (e) { |
| assets/js/app/build-app.js:3105 | toast('Gemini connection failed: ' + e.message, 'error'); |
| assets/js/app/build-app.js:3136 | if (state.abortController?.signal.aborted) throw new Error('Cancelled'); |
| assets/js/app/build-app.js:3199 | try { |
| assets/js/app/build-app.js:3208 | try { |
| assets/js/app/build-app.js:3210 | } catch (err) { |
| assets/js/app/build-app.js:3212 | throw new Error('This media format could not be decoded locally. Use MP3, WAV, M4A, MP4, or WebM, or upload a clip under 24MB for direct media transcription.'); |
| assets/js/app/build-app.js:3329 | try { |
| assets/js/app/build-app.js:3362 | toast('Loaded cached transcript', 'success'); |
| assets/js/app/build-app.js:3370 | try { |
| assets/js/app/build-app.js:3401 | } catch (decodeError) { |
| assets/js/app/build-app.js:3427 | toast('Adaptive retry improved transcript quality', 'success', 3200); |
| assets/js/app/build-app.js:3444 | toast(`Transcribed - ${finalResult.text.split(/\s+/).length} words`, 'success'); |
| assets/js/app/build-app.js:3446 | } catch (err) { |
| assets/js/app/build-app.js:3448 | toast('Transcription cancelled', 'info'); |
| assets/js/app/build-app.js:3450 | toast('Error: ' + err.message, 'error'); |
| assets/js/app/build-app.js:3451 | console.error(err); |
| assets/js/app/build-app.js:3514 | try { |
| assets/js/app/build-app.js:3538 | toast('Live speech recovered with high-accuracy transcription', 'success', 3400); |
| assets/js/app/build-app.js:3540 | } catch (err) { |
| assets/js/app/build-app.js:3542 | toast(`Fallback transcription error: ${err.message \|\| 'request failed'}`, 'warning', 3600); |
| assets/js/app/build-app.js:3546 | try { |
| assets/js/app/build-app.js:3548 | } catch (e) { } |
| assets/js/app/build-app.js:3615 | toast('No transcript to export. Record or transcribe first.'); |
| assets/js/app/build-app.js:3623 | toast(format === 'srt' \|\| format === 'vtt' |
| assets/js/app/build-app.js:3647 | toast(`Downloaded as ${format.toUpperCase()}`, 'success'); |
| assets/js/app/build-app.js:3862 | toast(err.message \|\| 'Microphone access denied', 'error'); |
| assets/js/app/build-app.js:3973 | try { |
| assets/js/app/build-app.js:3980 | } catch (e) { } |

## Input Validation Report
| Input | Validation | Bypass Risk |
|---|---|---|
| API keys | required checks at `assets/js/app/build-app.js:3047`, `6465`, `6537`, `7884` | stored in browser localStorage |
| Uploaded media | size/type checks at `assets/js/app/build-app.js:8763`-`8775` | extension/MIME can be spoofed; decode path still validates by decoding |
| Workspace JSON | parsed and null-checked at `assets/js/app/build-app.js:8968`-`8972` | weak schema validation |
| Translation target | UI selected value persisted at `assets/js/app/build-app.js:8902`-`8914` | previous translation results cleared on target change |
| Assistant attachments | kind/support checks at `assets/js/app/build-app.js:4964`-`5009` | file content can enter provider prompts |

## Business Logic Bugs
1. Quality recording checks `state.apiKey` instead of `getProviderKeys()`, so a vault-only key state can be blocked: `assets/js/app/build-app.js:9444`-`assets/js/app/build-app.js:9448` versus key aggregation at `assets/js/app/build-app.js:5135`-`assets/js/app/build-app.js:5140`. Severity: MEDIUM.
2. Gemini usage is recorded before `testGeminiKey()` knows whether the request succeeds: `assets/js/app/build-app.js:3077`-`assets/js/app/build-app.js:3081`. Severity: LOW/MEDIUM.
3. Quality recording computes decoded/processed/chunked audio but then calls `transcribeBlobThroughPipeline(blob)`, causing duplicate decode/preprocess work: `assets/js/app/build-app.js:9315`-`assets/js/app/build-app.js:9331` and `assets/js/app/build-app.js:3206`-`assets/js/app/build-app.js:3227`. Severity: MEDIUM.
4. Translation clears `pendingQueue` before request completion and drops pending IDs when no key exists: `assets/js/app/build-app.js:5737`-`assets/js/app/build-app.js:5750`. Severity: MEDIUM.
5. Provider requests lack a hard timeout unless the caller passes an abort signal: fetch call at `assets/js/app/build-app.js:6478`, chat calls at `assets/js/app/build-app.js:6560` and `assets/js/app/build-app.js:8049`. Severity: MEDIUM.

## Async/Concurrency Issues
- Translation race: `flushTranslationQueue()` returns while `state.translation.isProcessing` is true at `assets/js/app/build-app.js:5728`-`assets/js/app/build-app.js:5730`, but the `finally` block at `assets/js/app/build-app.js:5831`-`assets/js/app/build-app.js:5834` does not schedule another flush for items queued during processing.
- Assistant overlap: `askAssistant()` sets `state.assistant.isSending = true` at `assets/js/app/build-app.js:8026` but has no early return for an already-sending state at `assets/js/app/build-app.js:8001`-`assets/js/app/build-app.js:8027`.
- Timers and recorders are stopped in several cleanup paths, but correctness depends on event ordering across SpeechRecognition, MediaRecorder, and UI clicks (`assets/js/app/build-app.js:9511`-`assets/js/app/build-app.js:9549`).

## Routing Logic Map
```text
mode=realtime -> SpeechRecognition + mic -> recognition.start()
mode=quality -> acquireCaptureStream(mic/tab/screen) -> MediaRecorder -> provider transcription
mode=file -> uploaded file -> decode/chunk/cache -> provider transcription
provider=groq -> api.groq.com/openai/v1 audio/chat endpoints
provider=openai -> api.openai.com/v1 audio/chat endpoints
assistant=max -> route by attachment/long-output/context-heavy/quick/default rules
gemini attachment -> upload file -> generateContent
```

## Request/Provider Evidence Lines
| Location | Request Evidence |
|---|---|
| assets/js/app/build-app.js:2975 | return getAudioEndpoint('transcriptions'); |
| assets/js/app/build-app.js:3051 | const result = await providerRequest({ |
| assets/js/app/build-app.js:3081 | const resp = await fetch(getGeminiGenerateEndpoint(getConfiguredGeminiAnalysisModel()), { |
| assets/js/app/build-app.js:3111 | const endpoint = getAudioEndpoint(options.translate ? 'translations' : 'transcriptions'); |
| assets/js/app/build-app.js:3112 | return providerRequest({ |
| assets/js/app/build-app.js:4688 | function getGeminiAnalysisModelCatalog() { |
| assets/js/app/build-app.js:4808 | const catalog = getGeminiAnalysisModelCatalog(); |
| assets/js/app/build-app.js:4815 | const catalog = getGeminiAnalysisModelCatalog(); |
| assets/js/app/build-app.js:4878 | function getGeminiUsageEntry(model = getConfiguredGeminiAnalysisModel()) { |
| assets/js/app/build-app.js:4900 | const entry = getGeminiUsageEntry(model); |
| assets/js/app/build-app.js:4925 | const quota = getGeminiAnalysisModelCatalog().find(item => item.value === model) \|\| { rpm: 15, rpd: 1000, label: model }; |
| assets/js/app/build-app.js:4926 | const entry = getGeminiUsageEntry(model); |
| assets/js/app/build-app.js:5043 | const catalog = getGeminiAnalysisModelCatalog(); |
| assets/js/app/build-app.js:5143 | function getAudioEndpoint(kind = 'transcriptions', provider = state.apiProvider) { |
| assets/js/app/build-app.js:5149 | function getChatEndpoint(provider = state.apiProvider) { |
| assets/js/app/build-app.js:5155 | function getGeminiGenerateEndpoint(model) { |
| assets/js/app/build-app.js:5159 | function getGeminiUploadEndpoint() { |
| assets/js/app/build-app.js:5778 | const response = await providerRequest({ |
| assets/js/app/build-app.js:5779 | url: getChatEndpoint(), |
| assets/js/app/build-app.js:6049 | const response = await providerRequest({ |
| assets/js/app/build-app.js:6050 | url: getChatEndpoint(), |
| assets/js/app/build-app.js:6181 | const response = await providerRequest({ |
| assets/js/app/build-app.js:6182 | url: getChatEndpoint(), |
| assets/js/app/build-app.js:6454 | async function requestWithProvider({ |
| assets/js/app/build-app.js:6478 | const resp = await fetch(url, { method: 'POST', headers, body, signal }); |
| assets/js/app/build-app.js:6522 | async function providerRequest({ url, buildBody, responseType = 'json', signal, purpose = 'request', maxRetries = 2 }) { |
| assets/js/app/build-app.js:6523 | return requestWithProvider({ |
| assets/js/app/build-app.js:6560 | const result = await providerRequest({ |
| assets/js/app/build-app.js:6561 | url: getChatEndpoint(), |
| assets/js/app/build-app.js:6629 | const result = await providerRequest({ |
| assets/js/app/build-app.js:6630 | url: getChatEndpoint(), |
| assets/js/app/build-app.js:7837 | const startResp = await fetch(getGeminiUploadEndpoint(), { |
| assets/js/app/build-app.js:7857 | const uploadResp = await fetch(uploadUrl, { |
| assets/js/app/build-app.js:7960 | const resp = await fetch(getGeminiGenerateEndpoint(model), { |
| assets/js/app/build-app.js:8049 | const result = await requestWithProvider({ |
| assets/js/app/build-app.js:8051 | url: getChatEndpoint(provider), |
| assets/js/app/build-app.js:9133 | const result = await providerRequest({ |
| assets/js/app/build-app.js:9134 | url: getChatEndpoint(), |
