# Voice Transcriber Functional Specification

This file explains the voice and transcription system used by the Verbatim project.

It is intentionally focused on functionality, processing flow, reliability, speed, and output behavior.

It excludes the visual design layer.

This file should be treated as a portable engineering spec, not just a description. Its purpose is to let another project implement the same voice system with clean bindings and predictable behavior.

Primary implementation sources:

- `script.js`
- `update.md`
- `guide.md`

## 0. Portability Goal

If this voice system is implemented inside another project, it should not be rewritten as a loose approximation.

It should be integrated as a reusable subsystem with:

- clear inputs
- clear outputs
- stable internal stages
- provider abstraction
- host-app hooks
- cancellation support
- storage abstraction
- diagnostics and recovery paths

The target result is:

- the host project can plug in its own UI
- the host project can plug in its own storage layer if needed
- the host project can plug in its own providers if needed
- the core voice behavior remains the same

Important engineering principle:

- keep the transcription engine independent from presentation
- treat capture, processing, transcription, translation, caching, and output as separate modules

## 0.1 Non-Negotiable Functional Guarantees

If another project wants the same level of behavior, it should preserve these guarantees:

- live mode must return text immediately when browser speech recognition is available
- quality mode must record first, then transcribe through the speech API
- file mode must support large media and chunking
- file mode must support preserve-original-language and translate-to-English
- transcript cache must be keyed by file hash plus processing options
- translation cache must be keyed by source text plus target/provider/model
- the engine must degrade gracefully when one path fails
- direct-upload fallback must exist for small media that fails local decode
- multilingual repair must remain available for preserve-original mixed-language audio
- segment output must remain the canonical internal output model
- downstream consumers must receive transcript text, segments, detected language, and translation state in a consistent shape

## 1. What The Voice System Does

The voice system is not a single recorder. It is a client-side transcription pipeline with three operating modes:

- `realtime`
  - instant browser speech recognition while the user is speaking
- `quality`
  - records audio first, then sends it to an AI transcription API
- `file`
  - uploads local audio or video files, preprocesses them, and transcribes or translates them

At a high level, the system can:

- transcribe live microphone speech immediately
- record microphone, browser tab audio, or screen/system audio for higher-accuracy transcription
- upload local audio and video files up to 500 MB
- preserve original spoken languages in mixed-language audio
- translate uploaded speech to English
- translate transcript segments live into another target language
- cache transcripts and translations locally
- retry or repair low-quality results
- export final output in multiple forms

## 2. Architecture

This project is client-only.

There is no backend in this repo.

All requests are sent directly from the browser to external AI APIs using `fetch`.

Important consequence:

- capture happens locally in the browser
- preprocessing happens locally in the browser
- keys are stored locally in browser storage
- API calls are made directly from the client

## 2.1 Recommended Module Boundaries For Another Project

To make this bind cleanly into another project, implement it as these modules:

- `capability-detector`
  - detects browser and device support
- `capture-adapter`
  - acquires microphone, tab, or screen audio streams
- `live-transcriber`
  - wraps browser `SpeechRecognition`
- `recorded-transcriber`
  - handles quality-mode recording and post-stop transcription
- `file-transcriber`
  - handles uploaded media, chunking, caching, retries, and repair
- `audio-pipeline`
  - decode, analyze, normalize, resample, WAV conversion
- `provider-adapter`
  - sends speech and chat requests to the configured provider
- `translation-engine`
  - handles live segment translation and translation cache
- `repair-engine`
  - handles multilingual preserve-original repair
- `cache-store`
  - transcript cache, partial progress cache, translation cache
- `workspace-output`
  - emits transcript text, segments, detected language, translated output, and diagnostics
- `diagnostics-bus`
  - records events, retries, fallback use, language mismatches, and cache hits

If this is kept modular, the host project can replace:

- storage implementation
- provider implementation
- UI implementation
- logging implementation

without changing the core voice behavior.

## 2.2 Host Project Contract

A new host project should provide these capabilities to the voice subsystem:

- a way to pass current provider and API keys
- a way to pass selected language
- a way to choose capture mode and capture source
- a way to submit uploaded media files
- a way to receive segment updates
- a way to receive transcript-text updates
- a way to receive translation updates
- a way to receive diagnostics and status events
- a way to cancel in-flight work
- a storage adapter or permission to use browser storage

Recommended host-facing API:

```ts
type VoiceEngineConfig = {
  provider: 'groq' | 'openai';
  apiKey: string;
  audioModel?: string;
  chatModel?: string;
  selectedLanguage?: string | null;
  fileLanguageMode?: 'preserve' | 'translate';
  normalizeAudio?: boolean;
  useTranscriptCache?: boolean;
};

type VoiceEngineEvents = {
  onStatus?: (message: string, detail?: string) => void;
  onSegment?: (segment: Segment) => void;
  onTranscript?: (text: string, segments: Segment[]) => void;
  onTranslation?: (payload: TranslationState) => void;
  onDiagnostics?: (diag: DiagnosticsState) => void;
  onError?: (error: Error) => void;
};
```

Recommended host commands:

```ts
startLive(config)
stopLive()
startQuality(config, source)
stopQuality()
transcribeFile(file, config)
cancelCurrent()
clearCaches()
restoreWorkspace(payload)
exportWorkspace()
```

## 3. Runtime Capability Detection

Before anything starts, the app checks what the browser can do.

It detects:

- `SpeechRecognition` or `webkitSpeechRecognition`
- `MediaRecorder`
- `getUserMedia`
- `getDisplayMedia`
- `AudioContext` or `OfflineAudioContext`
- secure-context status
- mobile and Safari limitations

Core boot gate:

```javascript
const hasSpeechRecognition = !!SR;
const hasMediaRecorder = typeof window.MediaRecorder !== 'undefined';
const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext || window.OfflineAudioContext);
const hasGetUserMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
const supportsMicQuality = hasMediaRecorder && hasGetUserMedia;
const supportsTabOrScreenCapture = hasDisplayMedia && hasMediaRecorder && !isMobile && !isIOS && !isSafari;

canBoot: hasSpeechRecognition || supportsMicQuality || hasAudioContext
```

This is how the app decides whether it can:

- do live recognition
- do recorded capture
- decode uploaded media

## 4. Capture Sources

The system supports these capture sources:

- `mic`
- `browser-tab`
- `screen-audio`
- `external-help`

Behavior by source:

- `mic`
  - used for live mode and quality mode
- `browser-tab`
  - intended for Google Meet or browser media
  - depends on `getDisplayMedia`
- `screen-audio`
  - intended for Zoom, Teams, desktop-app audio
  - depends on `getDisplayMedia`
- `external-help`
  - does not record directly
  - shows capture guidance for unsupported devices or workflows

The app also enforces mode/source compatibility:

- live mode only works with `mic`
- if live mode is selected with another source, the app switches to `quality`

## 5. Providers And Request Endpoints

Speech requests route through the selected provider.

Exact speech endpoints:

```javascript
function getAudioEndpoint(kind = 'transcriptions', provider = state.apiProvider) {
  return provider === 'groq'
    ? `https://api.groq.com/openai/v1/audio/${kind}`
    : `https://api.openai.com/v1/audio/${kind}`;
}
```

This means:

- Groq audio transcription:
  - `https://api.groq.com/openai/v1/audio/transcriptions`
  - `https://api.groq.com/openai/v1/audio/translations`
- OpenAI audio transcription:
  - `https://api.openai.com/v1/audio/transcriptions`
  - `https://api.openai.com/v1/audio/translations`

Provider keys are stored in `vt_provider_keys` in `localStorage`.

The active provider is `state.apiProvider`.

## 6. Models Used For Speech And Translation

Audio model selection:

```javascript
function getApiModel() {
  return (state.audioModel || defaultAudioModel(state.apiProvider)).trim();
}

function getEffectiveAudioModel(options = {}) {
  if (state.apiProvider === 'groq' && options.translate) {
    return 'whisper-large-v3';
  }
  return getApiModel();
}
```

Important behavior:

- Groq normal transcription defaults to `whisper-large-v3-turbo`
- Groq translate-to-English forces `whisper-large-v3`
- OpenAI uses the selected OpenAI speech model path

Live translation and some cleanup tasks use the chat model, not the audio model.

## 7. Live Mode

### 7.1 Purpose

Live mode is the fastest path.

It is designed for:

- instant dictation
- visible interim text
- continuous segment creation while the user speaks

### 7.2 Core mechanism

Live mode uses browser speech recognition:

```javascript
recognition = new SR();
recognition.continuous = true;
recognition.interimResults = true;
recognition.maxAlternatives = 3;
recognition.lang = 'en-IN';
```

When recording starts:

```javascript
recognition.lang = lang || 'en-IN';
recognition.start();
state.isRecording = true;
startAudioFromMic();
startRealtimeAudioBuffer();
```

### 7.3 What happens while speaking

The app:

- receives interim results
- scores candidate text
- applies smart punctuation when appropriate
- queues finalized segments
- updates live reliability state

Segment commit path:

```javascript
function schedulePendingRealtimeCommit(text, conf, meta = {}) {
  state.realtimePendingSegment = { text, conf, meta, queuedAt: Date.now() };
  state.realtimeCommitTimer = setTimeout(() => {
    addSegment(pending.text, pending.conf, pending.meta.time, pending.meta.lang, pending.meta);
  }, REALTIME_FINAL_COMMIT_DELAY_MS);
}
```

So live mode does not just dump raw browser transcript text. It converts spoken text into segment objects.

### 7.4 Live-mode reliability safety net

Live mode also records a backup audio buffer in the background.

This is important because browser speech recognition is fast but not always reliable.

Fallback trigger:

```javascript
function shouldTriggerRealtimeFallback() {
  if (!state.isRecording || state.mode !== 'realtime') return false;
  if (!getProviderKeys().length) return false;
  if (state.realtimeFallbackPromise) return false;
  if (state.liveHealth.score > LIVE_RELIABILITY_THRESHOLD) return false;
  const liveMs = state.liveAudioBuffer.startedAt ? (Date.now() - state.liveAudioBuffer.startedAt) : 0;
  return liveMs >= LIVE_FALLBACK_MIN_BUFFER_MS;
}
```

Fallback execution:

```javascript
const capture = await stopRealtimeAudioBuffer(false);
const result = await transcribeBlobThroughPipeline(capture.blob, {
  language: getAdaptiveTranscriptionLanguageHint(),
  normalize: true
});
addSegment(fallbackText, 0.93, null, result.language || getWhisperLang() || '', {
  source: 'fallback-api',
  provisional: false,
  alternatives: [],
  reliability: Math.max(state.liveHealth.score, 0.8)
});
```

Meaning:

- live mode is fast first
- if quality drops, the app can recover using API transcription on buffered recent audio

## 8. Quality Mode

### 8.1 Purpose

Quality mode is slower than live mode but usually more accurate.

It is designed for:

- microphone capture with higher accuracy
- browser-tab capture
- screen/system-audio capture
- situations where browser speech recognition is not enough

### 8.2 Core mechanism

Quality mode uses `MediaRecorder`.

Start path:

```javascript
const stream = await acquireCaptureStream(state.captureSource);
state.mediaRecorder = new MediaRecorder(stream, options);
state.mediaRecorder.start(1000);
```

The recorder collects chunks while recording.

On stop:

```javascript
const blob = new Blob(state.recordedChunks, { type: outputType });
const arrayBuf = await blob.arrayBuffer();
const decoded = await tempCtx.decodeAudioData(arrayBuf);
const analysis = analyzeAudio(decoded);
const processed = await processAudioBuffer(decoded, analysis, true);
const resampled = await resampleTo16k(processed);
const result = await transcribeBlobThroughPipeline(blob, { language: wLang, normalize: true });
displayFileResult(result);
```

So quality mode behaves like a recorded audio pipeline, not live browser dictation.

### 8.3 Why it is more accurate

Quality mode improves accuracy by:

- recording first instead of relying on live browser recognition
- decoding raw captured media locally
- analyzing the waveform
- applying normalization
- resampling to 16 kHz mono
- sending clean audio to the speech API

## 9. File Mode

### 9.1 Purpose

File mode handles uploaded media.

It supports:

- audio uploads
- video uploads
- preserve-original-language transcription
- translate-to-English transcription

### 9.2 Limits and validation

Important constants:

```javascript
const MAX_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024;
const DIRECT_MEDIA_UPLOAD_MAX_BYTES = 24 * 1024 * 1024;
```

Meaning:

- upload limit is 500 MB
- direct-upload fallback only works if the file is 24 MB or smaller

### 9.3 File mode pipeline

The file pipeline is explicit and staged:

1. read file into memory
2. hash the file
3. build a cache key
4. check transcript cache
5. decode media locally
6. analyze audio
7. preprocess and normalize if enabled
8. resample to 16 kHz
9. convert to WAV
10. split into chunks if needed
11. transcribe or translate chunk by chunk
12. merge results
13. optionally retry
14. optionally run multilingual repair
15. cache final result
16. display transcript and segments

Key implementation:

```javascript
const arrayBuf = await state.uploadedFile.arrayBuffer();
state.fileHash = await hashArrayBuffer(arrayBuf);

state.cacheKey = buildTranscriptCacheKey(state.fileHash, {
  translate,
  normalize: doNormalize,
  language: wLang,
  model: effectiveAudioModel
});

const decoded = await decodeMediaToAudioBuffer(state.uploadedFile);
const analysis = analyzeAudio(decoded);
const processed = await processAudioBuffer(decoded, analysis, doNormalize);
const resampled = await resampleTo16k(processed);
const chunks = chunkWavBlob(resampled, maxChunkBytes);
result = await transcribeChunks(chunks, { language: wLang, translate }, onProgress, state.cacheKey);
```

## 10. Audio Preprocessing

This is one of the main reasons the system can produce cleaner output than a naive upload flow.

### 10.1 Audio analysis

The app measures:

- peak amplitude
- RMS
- clipping
- silence ranges

Core analyzer:

```javascript
function analyzeAudio(buffer) {
  const data = buffer.getChannelData(0);
  let peak = 0, sumSq = 0, clipping = 0;
  const silenceRanges = [];
  ...
}
```

### 10.2 Audio cleanup and normalization

When normalization is enabled, the app applies:

- high-pass filter at 80 Hz
- dynamics compression
- gain normalization based on measured peak

Core code:

```javascript
const hp = offCtx.createBiquadFilter();
hp.type = 'highpass';
hp.frequency.value = 80;

const comp = offCtx.createDynamicsCompressor();
comp.threshold.value = -24;
comp.knee.value = 12;
comp.ratio.value = 4;
comp.attack.value = 0.003;
comp.release.value = 0.25;

const gain = offCtx.createGain();
const targetPeak = 0.89;
gain.gain.value = analysis.peak > 0.001 ? Math.min(targetPeak / analysis.peak, 10) : 1;
```

### 10.3 Resampling

The system resamples to 16 kHz mono:

```javascript
async function resampleTo16k(buffer) {
  const targetRate = 16000;
  ...
}
```

This keeps the audio in a format suitable for speech APIs and reduces waste.

## 11. Chunking And Large File Handling

Large processed files are chunked so they fit provider request limits.

Chunking behavior:

```javascript
function chunkWavBlob(buffer, maxBytes) {
  const maxSamplesPerChunk = Math.floor((maxBytes - 44) / 2);
  ...
}
```

Important quality feature:

- chunk splitting tries to use silence points instead of arbitrary hard cuts

This helps:

- reduce sentence splits
- improve recognition continuity
- preserve context within chunks

Chunk transcription behavior:

```javascript
const prompt = results.length > 0
  ? (results[results.length - 1].text || '').slice(-240)
  : '';

const result = await transcribeBlob(chunks[i].blob, {
  ...options,
  prompt,
  signal: state.abortController?.signal
});
```

This means the previous chunk’s tail text is used as a prompt hint for the next chunk.

That improves continuity across chunk boundaries.

### 11.1 Merging chunk results

When chunk results are merged:

- overlapping duplicate segment starts are detected
- similar duplicate edge text can be removed
- language counts are combined
- text is concatenated

This reduces repeated text around chunk boundaries.

## 12. Direct Upload Fallback

If local decode fails, the system does not always fail immediately.

Fallback behavior:

```javascript
if (blob.size > DIRECT_MEDIA_UPLOAD_MAX_BYTES) {
  throw new Error('This media format could not be decoded locally...');
}

return transcribeBlob(blob, {
  language: options.language === undefined ? getWhisperLang() : options.language,
  translate: !!options.translate,
  signal: state.abortController?.signal,
  filename: options.filename || blob.name || 'media-upload'
});
```

Meaning:

- if local decoding fails and the file is 24 MB or less, the original media can still be sent directly to the provider
- if the file is bigger than 24 MB and local decode fails, the request fails

This gives the app a graceful recovery path for smaller difficult media files.

## 13. Language Handling

### 13.1 User-selected language

The UI language selector stores both:

- a locale-like value such as `en-IN`
- a Whisper language code from `data-wlang`

Language lookup:

```javascript
function getWhisperLang() {
  const sel = langSelect.selectedOptions[0];
  if (!sel || langSelect.value === 'auto') return null;
  return sel.dataset.wlang || null;
}
```

### 13.2 File language modes

Uploaded files support two modes:

- `preserve`
- `translate`

Mode helpers:

```javascript
function getUploadedFileLanguageMode() {
  return document.querySelector('input[name="fileLanguageMode"]:checked')?.value === 'translate'
    ? 'translate'
    : 'preserve';
}

function shouldTranslateUploadedFile() {
  return getUploadedFileLanguageMode() === 'translate';
}
```

### 13.3 Detected language feedback

The app also stores detected language and compares it against the selected language.

Mismatch behavior:

```javascript
if (announceMismatch && selected && normalizeLanguageCode(selected) !== normalizeLanguageCode(normalized)) {
  toast(`Detected ${normalized.toUpperCase()} while ${selected.toUpperCase()} was selected...`);
  updateDiagnostics({ selectedLanguage: selected, detectedLanguage: normalized }, 'Selected language differs from detected speech');
}
```

This improves reliability by:

- warning the user about language mismatch
- feeding better context into retries and repair logic

## 14. How It Ensures Accuracy

The project does not rely on one single accuracy trick. It layers multiple mechanisms.

### 14.1 Better source audio

Accuracy improves because the app:

- captures raw media instead of only relying on visible text
- supports dedicated recorded-quality mode
- supports browser-tab and screen/system-audio capture when available

### 14.2 Local preprocessing

Before API transcription, the app can:

- remove low-end rumble with high-pass filtering
- compress dynamic range
- normalize gain
- resample to the target rate

### 14.3 Chunk continuity

The app:

- splits on silence when possible
- passes previous chunk tail text as prompt context
- removes duplicate chunk overlap at merge time

### 14.4 Adaptive retry

If uploaded-file output looks weak, the app can retry with a more forgiving path.

Current behavior:

```javascript
if (shouldRetryUploadedFileTranscription(result, analysis, { language: wLang }) && !translate) {
  const retried = await transcribeBlobThroughPipeline(state.uploadedFile, {
    language: null,
    normalize: true,
    translate: false,
    filename: state.uploadedFile.name
  });
  if (preferRetriedTranscript(result, retried)) {
    finalResult = retried;
  }
}
```

This helps with:

- difficult audio
- mixed-language audio
- cases where the manually selected language is hurting quality

### 14.5 Multilingual repair

This is one of the project’s strongest quality systems.

For preserve-original-language output, the app checks whether the transcript looks suspicious.

Trigger conditions include:

- mixed language spread
- script mismatch
- multiple garbled or low-confidence segments
- duplicate neighbor segments

Repair gate:

```javascript
function shouldRunMultilingualRepair(result = {}, segments = [], options = {}) {
  if (options.translate) return false;
  if (!segments.length) return false;
  if (!getProviderKeys().length) return false;
  ...
  return mixed || scriptMismatchCount > 0 || suspicious.length >= 2 || suspiciousRatio >= 0.18;
}
```

Repair prompt rules:

- keep Marathi and Hindi in Devanagari when recoverable
- keep English technical terms in English
- do not translate everything to English
- preserve timing alignment
- return structured JSON patches

This repair stage is what helps the app keep mixed-language transcripts closer to the original speech instead of flattening them into bad English drift.

### 14.6 Segment quality scoring

Each file-derived segment is scored using flags such as:

- punctuation only
- garbled text
- script mismatch
- very short
- repeated tokens
- low confidence
- duplicate neighbor

This is used to decide when repair is needed.

## 15. How It Delivers Output Quickly

The app balances speed with quality in several ways.

### 15.1 Live mode for immediate text

If the user needs instant words on screen, live mode provides immediate interim and final segment output without waiting for recorded upload.

### 15.2 Chunk-by-chunk processing

Large files are not treated as a single giant request.

They are chunked and processed sequentially with progress reporting.

### 15.3 Transcript cache

The app caches completed transcription results locally.

Cache key:

```javascript
function buildTranscriptCacheKey(hash, options = {}) {
  return [
    'mlr2',
    hash,
    state.apiProvider || 'unknown',
    options.translate ? 'translate' : 'transcribe',
    options.language || 'auto',
    options.model || getApiModel(),
    options.normalize ? 'norm' : 'raw'
  ].join('::');
}
```

This means if the same file is processed again with the same settings, the app can reuse the cached transcript immediately.

### 15.4 Partial progress resume

During chunked transcription:

```javascript
if (cacheKey) savePartialProgress(cacheKey, { results, nextIndex: i + 1 });
```

So if processing is interrupted, the app can resume from the next unfinished chunk instead of starting from zero.

### 15.5 Translation cache

Live segment translation is also cached locally per source text and target language.

Behavior:

```javascript
const cached = readTranslationCache(item.text, state.translation.targetLanguage, provider, model);
if (cached) {
  setTranslationResultForSegment(segment, { ...cached, status: 'ready' }, { provider, model });
}
```

This improves speed whenever:

- the same segment text reappears
- a workspace is reopened
- translation is recomputed with unchanged content

## 16. How It Provides Output

The system does not only return one raw transcript string.

It produces several output layers.

### 16.1 Segment model

Every segment is normalized into a rich structure:

```javascript
{
  id,
  text,
  conf,
  time,
  lang,
  created,
  startSec,
  endSec,
  speaker,
  locked,
  source,
  provisional,
  alternatives,
  reliability,
  correctionStatus,
  rawText,
  rawLanguage,
  qualityScore,
  qualityFlags
}
```

This is important because output is then used for:

- main transcript
- timestamped transcript view
- translated transcript
- subtitles
- JSON export
- CSV export
- speaker labeling
- correction and repair

### 16.2 Main transcript output

The app rebuilds the visible transcript from segments:

```javascript
const text = state.segments.map(seg => {
  const speaker = state.speakerMode && seg.speaker ? `${seg.speaker}: ` : '';
  return `${speaker}${seg.text}`.trim();
}).filter(Boolean).join('\n\n');
```

### 16.3 Translation output

If live translation is enabled, the app creates:

- translated transcript text
- translated segment cards
- sentiment metadata
- tone metadata

### 16.4 Export output

The same core segment data feeds:

- TXT
- SRT
- VTT
- JSON
- Markdown
- CSV
- workspace JSON

When file mode is set to translate-to-English, exports prefer the translated text where appropriate.

## 16.5 Canonical Output Contract

For portability, another project should treat these outputs as the stable contract from the engine.

### Transcript result contract

```ts
type TranscriptionResult = {
  text: string;
  segments: Segment[];
  language: string;
  duration?: number;
  provider: 'groq' | 'openai';
  task: 'transcribe' | 'translate-en';
  source: 'live' | 'quality' | 'file' | 'fallback-api';
  cacheKey?: string;
  cacheHit?: boolean;
  multilingualRepairApplied?: boolean;
};
```

### Segment contract

```ts
type Segment = {
  id: string;
  text: string;
  conf: number;
  time: string;
  lang: string;
  created: number;
  startSec: number;
  endSec: number | null;
  speaker: string;
  locked: boolean;
  source: string;
  provisional: boolean;
  alternatives: string[];
  reliability: number;
  correctionStatus: string;
  originalText?: string;
  correctedAt?: string;
  rawText?: string;
  rawLanguage?: string;
  qualityScore?: number;
  qualityFlags?: string[];
};
```

### Translation contract

```ts
type TranslationEntry = {
  segmentId: string;
  sourceText: string;
  translatedText: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  tone: string;
  status: 'pending' | 'ready' | 'error' | 'degraded';
  targetLanguage: string;
  provider: string;
  model: string;
  error?: string;
  updatedAt: string;
};
```

### Diagnostics contract

```ts
type DiagnosticsState = {
  provider?: string;
  audioModel?: string;
  audioTask?: string;
  captureMode?: string;
  captureSource?: string;
  detectedLanguage?: string;
  cacheHit?: boolean;
  cacheKey?: string;
  retries?: number;
  multilingualRepairApplied?: boolean;
  translationEnabled?: boolean;
  translationTarget?: string;
  updatedAt?: string;
};
```

If a new project uses this contract, the engine can be swapped under different UIs without breaking downstream logic.

## 17. Live Translation System

This is separate from file translate-to-English.

It works on finalized transcript segments after they are created.

### 17.1 What it does

For each segment, the system can:

- translate into the selected target language
- classify sentiment as positive, neutral, or negative
- attach an optional short tone label

### 17.2 Queueing behavior

Backfill logic:

```javascript
const staleIds = (state.segments || []).filter(seg => {
  const result = getTranslationResultForSegment(seg);
  if (!result) return true;
  if (result.sourceText !== seg.text) return true;
  if (result.targetLanguage !== state.translation.targetLanguage) return true;
  return result.status === 'error';
}).map(seg => seg.id);
```

Requests are debounced and batched:

```javascript
translationFlushTimer = setTimeout(() => flushTranslationQueue(), TRANSLATION_DEBOUNCE_MS);
```

### 17.3 Translation request shape

The app sends structured chat prompts to the active chat model.

It asks for:

- `id`
- `translatedText`
- `sentiment`
- `tone`

This is how translated output stays mapped back to the correct source segments.

### 17.4 Graceful degradation

If translation fails, the app degrades to source text instead of going blank:

```javascript
setTranslationResultForSegment(segment, {
  translatedText: existingTranslation || segment.text,
  sentiment: existingSentiment || 'neutral',
  tone: existingTone || 'source text',
  status: 'degraded',
  error: err.message || 'Translation degraded to source text'
});
```

This is an important delivery guarantee.

## 18. Reliability And Diagnostics

The project tracks runtime diagnostics and exposes them in the UI and session storage.

It records things like:

- provider
- audio model
- audio task
- capture mode
- capture source
- live recognition availability
- recorder MIME type
- translation state
- multilingual repair state
- detected language
- segment count
- duration
- retries
- cache hit or miss
- file hash

This matters because the system is designed to explain what happened when:

- a transcript used cache
- a retry was triggered
- a language mismatch was detected
- live recognition degraded
- direct-media upload fallback was used

## 19. Why Output Is Delivered Properly

The project tries to ensure output is delivered properly in all directions by combining:

- mode-specific capture logic
- browser capability checks
- provider routing
- local preprocessing
- chunking and merge logic
- local cache reuse
- partial resume state
- live fallback from browser recognition to API transcription
- detected-language mismatch warnings
- multilingual repair
- segment-based output assembly
- degraded translation fallback instead of blank failure

In practice, this means:

- if the browser supports live recognition, users get immediate text
- if live recognition is weak, the app can recover via API transcription
- if the user wants better accuracy, recorded quality mode is available
- if the file is large, it is chunked safely
- if the file is repeated, cache makes output fast
- if mixed-language audio is messy, repair logic tries to restore the right scripts and wording
- if translation fails, the app still shows usable source text

## 19.1 Failure Handling Rules For A Reusable Implementation

If this is being ported into another project, these failure rules should stay explicit:

- if live speech recognition is unavailable:
  - do not silently fail
  - switch users toward quality or file mode
- if quality mode is selected without an API key:
  - block transcription cleanly
  - expose a recoverable configuration error
- if uploaded media cannot be decoded locally:
  - use direct upload if file size is within the fallback threshold
  - otherwise return a precise media-format error
- if translation fails:
  - degrade to source text instead of clearing translated output
- if cache is unavailable or disabled:
  - continue processing without cache rather than failing the pipeline
- if multilingual repair cannot run:
  - preserve the original transcript result and continue
- if cancellation is requested:
  - abort in-flight requests
  - leave partial progress in a resumable state when applicable

Recommended reusable error classes:

```ts
class CapabilityError extends Error {}
class PermissionError extends Error {}
class ProviderConfigError extends Error {}
class MediaDecodeError extends Error {}
class MediaTooLargeError extends Error {}
class TranslationDegradedWarning extends Error {}
class CancelledError extends Error {}
```

## 19.2 Required Configurability

To bind perfectly into another project, do not hardcode everything.

These should remain configurable:

- provider
- API key
- speech model
- chat model
- selected language
- file language mode
- normalize-audio on or off
- transcript cache on or off
- live translation on or off
- translation target language
- chunk size ceiling
- fallback threshold
- debounce timing for translation queue
- storage adapter
- diagnostics sink

Recommended config surface:

```ts
type VoiceProcessingConfig = {
  provider: 'groq' | 'openai';
  apiKey: string;
  audioModel: string;
  chatModel: string;
  language: string | null;
  fileLanguageMode: 'preserve' | 'translate';
  normalizeAudio: boolean;
  useTranscriptCache: boolean;
  liveTranslateEnabled: boolean;
  translationTarget: string;
  maxUploadBytes: number;
  directUploadFallbackBytes: number;
  chunkMaxBytes: number;
  translationDebounceMs: number;
};
```

## 19.3 Binding Requirements For Another Project

If another engineer is integrating this into a different codebase, the host project should not consume the engine as one black-box text string.

It should bind to these stages:

1. mode and source selection
2. start or stop command
3. segment stream updates
4. transcript rebuild updates
5. translation updates
6. status updates
7. diagnostics updates
8. workspace persistence events
9. export requests

This prevents the common failure where:

- live updates are lost
- partial progress cannot be resumed
- translation becomes detached from segments
- export logic uses stale transcript text

## 19.4 Acceptance Checklist For A "Flawless" Port

Another project should not call the integration complete unless all of these are true:

- live mode produces interim text and finalized segments
- quality mode records and then transcribes correctly
- file mode handles both audio and video media
- file mode supports 500 MB validation
- chunked transcription works on large media
- chunk continuity is preserved across boundaries
- cached retranscription returns the same result shape as a fresh run
- direct-upload fallback works for small decode-failure files
- detected language is surfaced
- selected-language mismatch is surfaced
- preserve-original-language mode does not flatten mixed speech into English
- translate-to-English file mode returns English-first output
- live translation updates segment-linked translated output
- translation cache works after refresh
- cancellation works during chunked processing
- degraded translation still leaves usable text
- diagnostics show retries, cache use, fallback use, and language state
- transcript text, segments, translated transcript, and exports all stay in sync

## 19.5 Recommended Test Matrix

To make the subsystem dependable in another project, test at least these cases:

- live mic speech in English
- live mic speech with pauses and restarts
- live mixed-language speech
- live speech with browser recognition hiccups
- quality mic recording
- browser-tab audio capture
- screen/system-audio capture
- small MP3 upload
- long MP3 upload that requires chunking
- MP4 upload with audio track
- corrupted or unsupported file
- decode failure under 24 MB
- decode failure over 24 MB
- preserve-original Marathi/Hindi/English audio
- translate-to-English file mode
- repeated file upload to verify transcript cache
- repeated live translation to verify translation cache
- refresh and resume workspace state

## 19.6 Integration Sequence For Another Project

The cleanest integration order is:

1. implement provider and storage adapters
2. implement capability detection and capture adapters
3. implement segment model and transcript rebuild logic
4. implement live mode
5. implement quality mode
6. implement file-mode decoding, chunking, and cache
7. implement translation engine
8. implement multilingual repair
9. implement diagnostics
10. implement exports and workspace restore

If this order is followed, the host project can adopt the subsystem incrementally without breaking output contracts.

## 20. Functional Summary

The voice transcriber works by combining browser capture, local audio processing, provider-based speech APIs, segment-level transcript modeling, translation queues, caching, and repair logic.

It is fast because it offers:

- instant live mode
- chunked processing
- local transcript cache
- local translation cache
- partial resume support

It is accurate because it uses:

- better capture paths
- local normalization
- 16 kHz mono speech preparation
- silence-aware chunking
- adaptive retry
- language detection feedback
- multilingual repair
- segment quality scoring

It is reliable because it stores enough state to recover and because it degrades gracefully instead of simply failing whenever one path is weak.
