# Live Translate

This document explains the current Live Translate feature in Verbatim as it actually works in the codebase. It is written so a non-expert person or another local LLM can rebuild the same feature in a different web app.

The important idea is that Live Translate is not a single API call. It is a pipeline:

1. The browser listens to your microphone.
2. The browser speech recognizer produces interim and final text.
3. The app stores finalized speech as transcript segments.
4. Each finalized segment is sent through a translation queue.
5. The translation queue calls a chat model and returns translated text plus sentiment.
6. In parallel, the app records raw audio so it can recover weak live recognition with Groq Whisper.

## 1. Feature Overview

The user first chooses a source language in `langSelect`, a target language in `translationTargetSelect`, and then enables `liveTranslateToggle`.

When Live mode is running:

- live speech becomes interim transcript text first
- final speech becomes saved transcript segments
- each final segment is queued for translation
- translated text appears in the translation pane
- a full translated transcript is also rebuilt from all translated segments

The translation UI is centered around:

- `translationStatusText` and `translationStatusDot` for state
- `translatedSegmentsView` for per-segment translated cards
- `translatedTranscript` for the combined translated transcript
- `translationTargetLabel` for the current target language label

This feature is segment-based, not full-session streaming translation. The app translates each finalized speech segment after it is committed.

## 2. Required Runtime Pieces

Live Translate depends on browser APIs and an API provider.

Required browser capabilities:

- `SpeechRecognition` or `webkitSpeechRecognition`
- `MediaRecorder`
- `navigator.mediaDevices.getUserMedia`
- `fetch`
- `localStorage`
- `sessionStorage`

Runtime requirements:

- the page must run in a secure context such as `localhost`, `127.0.0.1`, or HTTPS
- Chrome or Edge gives the best support
- an API key must be configured for the selected provider
- Groq or OpenAI-compatible endpoints are used for speech fallback and translation

Storage behavior:

- API keys are stored in browser `localStorage`
- transcript caches are stored in `localStorage`
- translation caches are stored in `localStorage`
- workspace state is saved locally
- translation settings are saved locally

## 3. UI Controls and State

### Controls

- `langSelect`: chooses the source speech language
- `translationTargetSelect`: chooses the translation target language
- `liveTranslateToggle`: turns Live Translate on or off
- `translatedTranscript`: shows the combined translated transcript
- `translatedSegmentsView`: shows each translated segment as a card
- `translationStatusText`: shows the current translation state
- `translationStatusDot`: shows the current translation state visually
- `detectedLangBadge`: shows the detected source language when available

### Main state fields

- `state.segments`: the list of finalized transcript segments
- `state.translation`: translation state, queue, cache-backed results, and stats
- `state.detectedLanguage`: last detected language from speech/transcription
- `state.liveAudioBuffer`: raw microphone audio captured in parallel for recovery
- `state.liveHealth`: live recognition quality and fallback health
- `state.apiProvider`: selected provider, usually `groq`
- `state.audioModel`: selected audio model
- `state.chatModel`: selected chat model used for translation

### Important helper functions

- `getWhisperLang()`: converts the selected source language to the Whisper language code
- `getLiveRecognitionLang()`: converts `langSelect` into a browser speech locale
- `getEffectiveAudioModel()`: chooses the right audio model for transcription or translation
- `addSegment()`: creates a normalized transcript segment
- `queueTranslationForSegmentIds()`: schedules translation for one or more segments
- `flushTranslationQueue()`: sends pending translations to the provider
- `runRealtimeFallback()`: uses buffered audio and Groq Whisper when live recognition degrades

## 4. Exact Data Flow

The runtime flow is:

1. User starts recording in Live mode.
2. The app starts browser speech recognition using the locale derived from `langSelect`.
3. The app also starts `startRealtimeAudioBuffer()` so it can keep raw microphone audio in parallel.
4. `recognition.onresult` receives interim and final speech results.
5. Interim text is shown immediately in the transcript UI.
6. Final text is normalized with punctuation and committed.
7. `addSegment()` creates a normalized transcript segment and appends it to `state.segments`.
8. `addSegment()` automatically calls `queueTranslationForSegmentIds([seg.id])`.
9. The queue batches pending segment IDs and waits briefly before sending them.
10. `flushTranslationQueue()` checks translation cache first.
11. Uncached items are sent to `getChatEndpoint()` with a translation prompt.
12. The response is parsed into objects like `{ id, translatedText, sentiment, tone }`.
13. Segment translation results are stored in `state.translation.segmentResults`.
14. The translated pane and translated full transcript are re-rendered.

### Live speech capture

In `recognition.onresult`, the browser emits interim text and final text. Interim text is only for the live on-screen experience. Final text is the text that becomes a permanent transcript segment.

The app also keeps a parallel buffered recording with `MediaRecorder`. This is not the main live transcription path. It exists so the app can recover from weak speech recognition by reprocessing the recent audio through Whisper.

### Segment creation

`addSegment()` normalizes the text, confidence, time, language, speaker label, and metadata into one segment object. That segment is stored in `state.segments`.

When a new segment is created, the app immediately queues it for translation.

### Translation rendering

`renderTranslationUi()` rebuilds:

- the status text and dot
- the translated transcript text area
- the translated segment cards
- the target language label
- the sentiment counters

## 5. Groq Whisper Behavior

This app uses Groq Whisper, but not in the same way for every feature.

### Default model selection

`getEffectiveAudioModel()` contains the model switching rules.

- Groq transcription defaults to `whisper-large-v3-turbo`
- if translation is requested on Groq audio endpoints, the app forces `whisper-large-v3`

### Audio endpoint routing

`transcribeBlob()` sends audio to:

- `/audio/transcriptions` for transcription
- `/audio/translations` for translate-to-English audio flow

That audio translation endpoint is mainly for file or audio-upload flows, not for Live Translate.

### What Live Translate actually does

Live Translate does not directly translate microphone audio with Whisper.

Instead:

- browser speech recognition produces the first live transcript
- the translation system translates finalized transcript segments through the chat API
- Groq Whisper is used mainly as a recovery path when live recognition becomes weak

### Recovery path

`runRealtimeFallback()`:

1. stops the buffered microphone recorder
2. gets the recorded audio blob
3. sends it through `transcribeBlobThroughPipeline()`
4. replays the recovered transcript into the segment system
5. restores the live recorder afterward

This is the key reason the app keeps a parallel audio buffer even during Live mode.

## 6. Audio Capture and Transcription

Here is the plain-English version.

When the user starts Live mode, the app asks for microphone access with `getUserMedia()`. That gives the app access to the audio coming from the mic.

At the same time, the browser speech engine listens to the mic and produces text in near real time. It sends two kinds of text:

- interim text, which can change as the recognizer becomes more confident
- final text, which is the text the app actually saves

The app keeps both because interim text feels immediate, while final text is what should be stored and translated.

The extra `MediaRecorder` buffer exists because browser speech recognition is not always reliable. The app records small chunks of audio in parallel, roughly every 900 ms, so it can replay the recent speech through Groq Whisper if live recognition quality drops.

If recovery is needed, the buffered audio is combined into a blob, then passed into the Whisper pipeline. That pipeline can decode, preprocess, resample, and chunk the audio before sending it to the provider.

Language selection matters in two places:

- `getLiveRecognitionLang()` turns the source language choice into a browser speech locale
- `getWhisperLang()` turns the same choice into a Whisper language hint

If the app detects that the actual spoken language differs from the chosen one, it can prefer the detected language during recovery.

## 7. Translation Queue and Batching

Translation is not done per keystroke or per audio sample. It is done per finalized transcript segment.

The queue works like this:

- `queueTranslationForSegmentIds()` receives segment IDs
- it marks those segments as pending
- it adds them to `state.translation.pendingQueue`
- it waits a short debounce window before running
- `flushTranslationQueue()` sends the request

Before calling the model, the app checks a cache key built from:

- source text
- target language
- provider
- model

If a cached translation exists, the app reuses it immediately.

If translation fails, the app falls back gracefully:

- the source text stays visible
- the segment status becomes `degraded`
- the UI keeps working instead of breaking

After translation finishes, the app recomputes sentiment stats from the translated segment results.

## 8. Prompt and Response Contract

The translation prompt is intentionally strict.

The system prompt tells the model to:

- translate faithfully
- preserve names, numbers, product names, acronyms, and domain terms
- not summarize
- not embellish
- return machine-readable output

The expected output fields are:

- `id`
- `translatedText`
- `sentiment`
- `tone`

The sentiment value must be one of:

- `positive`
- `neutral`
- `negative`

The `tone` field should be a very short phrase.

Response parsing is tolerant:

- JSON is preferred
- arrays are accepted
- wrapper keys like `items`, `translations`, or `results` are accepted
- plain text fallback is also supported if the model does not return perfect JSON

The returned `id` values must map back to the original segment IDs.

## 9. How To Rebuild This Elsewhere

If you rebuild this in another web app, the minimum viable version should include:

- microphone capture
- browser speech recognition or an equivalent live text source
- a segment store
- a translation queue
- a translation renderer
- a recovery path for weak recognition

Recommended architecture split:

1. Capture layer
2. Speech transcription layer
3. Segment store
4. Translation queue
5. UI renderer

What can be simplified:

- sentiment stats can be removed in a first version
- speaker labels can be omitted
- translation caching can be reduced to simple in-memory caching
- the live fallback path can be added after the basic flow works

What should stay the same for parity:

- segment-based translation
- source language selection
- target language selection
- cached translation reuse
- graceful fallback when translation fails
- parallel audio buffering for recovery

Known risks:

- browser support varies a lot
- secure context is mandatory for capture
- recognition can stop or become noisy
- API rate limits can interrupt translation
- batching logic can produce stale results if segment IDs are not kept in sync

## 10. Test Scenarios

Use these scenarios to verify a rebuild:

- Live mode with speech recognition only and translation enabled
- Live mode where recognition weakens and Groq Whisper fallback recovers the transcript
- changing source language updates both live recognition locale and Whisper hint
- changing target language clears stale translation results and rebuilds translations
- disabling Live Translate stops new translation work
- cached translations are reused for repeated source text
- missing API key shows translation-disabled or degraded behavior
- Groq uses `whisper-large-v3-turbo` by default and `whisper-large-v3` for audio translation flows
- translated transcript view matches the translated segment list

## 11. File Scope Notes

This document is based mainly on `assets/js/app/build-app.js`, with supporting behavior from `assets/js/runtime/capabilities.js` and `assets/js/features/capture.js`.

That is enough to understand the current Live Translate implementation and re-create the same behavior in another project.
