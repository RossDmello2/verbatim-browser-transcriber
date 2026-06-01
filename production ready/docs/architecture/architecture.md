# SA-1: Architecture Report
Generated: 2026-05-16T21:09:03

## System Purpose
Verbatim is a self-contained static browser transcription workspace for live capture, file transcription, translation, assistant tools, and export support. The package identity is stated in `README.md:1` and `README.md:3`; the HTML metadata describes the same browser-based transcription workspace at `index.html:6`.

## Architectural Pattern
The application is a static single-page browser app. `index.html:17` creates `#mainContent`, `index.html:22` loads `assets/js/main.js` as a module, `assets/js/main.js:1`-`assets/js/main.js:2` import the runtime detector and app builder, and `assets/js/main.js:3`-`assets/js/main.js:7` choose unsupported-browser rendering or `buildApp()`. The dominant runtime is one large closure: `buildApp()` starts at `assets/js/app/build-app.js:14` and is exported at `assets/js/app/build-app.js:9891`.

## Module Map
```text
index.html:22
  -> assets/js/main.js:1-2
       -> assets/js/runtime/capabilities.js:1-68
       -> assets/js/app/build-app.js:12-9891
            -> assets/js/runtime/capabilities.js:12
```
The feature files under `assets/js/features/` are ownership maps, not imported behavior modules. Examples: `assets/js/features/capture.js:9`, `assets/js/features/assistant.js:9`, `assets/js/features/translation.js:9`, and `assets/js/features/workspace.js:9` export arrays of conceptual scope names. `assets/js/app/events.js:2`-`assets/js/app/events.js:3` explicitly states that event listeners still live near feature logic inside `build-app.js`.

## Request Lifecycle - Primary Paths
### Boot And Capability Gate
`assets/js/runtime/capabilities.js:1` captures `SpeechRecognition`, while `assets/js/runtime/capabilities.js:17`-`assets/js/runtime/capabilities.js:23` detect SpeechRecognition, MediaRecorder, display capture, AudioContext, and getUserMedia. `runtimeCapabilities.canBoot` is true if speech recognition, mic-quality recording, or audio context exists at `assets/js/runtime/capabilities.js:52`. `assets/js/main.js:3`-`assets/js/main.js:4` render the unsupported browser path; `assets/js/main.js:5`-`assets/js/main.js:7` call `buildApp()` for the normal path.
### Normal App Initialization
`buildApp()` injects the UI through `mainContent.innerHTML` at `assets/js/app/build-app.js:15`, initializes the shared state object at `assets/js/app/build-app.js:1039`, restores workspace state at `assets/js/app/build-app.js:9591`-`assets/js/app/build-app.js:9637`, records diagnostics at `assets/js/app/build-app.js:9639`-`assets/js/app/build-app.js:9641`, binds global keyboard shortcuts at `assets/js/app/build-app.js:9644`, and completes UI setup through `assets/js/app/build-app.js:9850`-`assets/js/app/build-app.js:9885`.
### Recording Path
Live recording starts at `assets/js/app/build-app.js:9430`; it rejects file mode, external-help mode, unsupported live mode, and missing SpeechRecognition before calling `recognition.start()` at `assets/js/app/build-app.js:9493`. Recognition results are handled at `assets/js/app/build-app.js:2645`-`assets/js/app/build-app.js:2693`; final segments are added by `addSegment()` at `assets/js/app/build-app.js:4076`-`assets/js/app/build-app.js:4105`. Quality recording starts at `assets/js/app/build-app.js:9271`, records via MediaRecorder, then transcribes the recorded blob at `assets/js/app/build-app.js:9315`-`assets/js/app/build-app.js:9334`.
### File Transcription Path
File selection is handled at `assets/js/app/build-app.js:8763`-`assets/js/app/build-app.js:8803`. The transcribe button is bound at `assets/js/app/build-app.js:8823`, and `processUploadedFile()` starts at `assets/js/app/build-app.js:3318`. That path hashes the file, checks transcript cache, decodes/analyzes media, normalizes/resamples/chunks audio, sends transcription requests, retries weak multilingual output, saves cache, and renders results across `assets/js/app/build-app.js:3330`-`assets/js/app/build-app.js:3444`.
### AI Output And Assistant Paths
AI output buttons bind to `callChatModel()` at `assets/js/app/build-app.js:9043`-`assets/js/app/build-app.js:9046`; `callChatModel()` validates transcript/key state, truncates long transcripts, sends provider chat messages, stores output, and handles context errors at `assets/js/app/build-app.js:6534`-`assets/js/app/build-app.js:6601`. The assistant submit flow is `submitAssistantDraft()` at `assets/js/app/build-app.js:8156`, with `askAssistant()` routing provider/model/attachment behavior at `assets/js/app/build-app.js:8001`-`assets/js/app/build-app.js:8080`.

## Full Data Flow Diagram
```text
[Browser / User] -> index.html:22 -> assets/js/main.js:1-7
  -> unsupported browser message OR buildApp assets/js/app/build-app.js:14
  -> UI/state from localStorage/sessionStorage
  -> realtime SpeechRecognition / quality MediaRecorder / file upload
  -> Groq/OpenAI audio endpoints assets/js/app/build-app.js:5143-5147
  -> transcript segments -> translation/correction/export/workspace
  -> Groq/OpenAI chat endpoints assets/js/app/build-app.js:5149-5153
  -> Gemini generate/upload endpoints assets/js/app/build-app.js:5155-5160
  -> localStorage workspace/cache/key vaults + sessionStorage diagnostics/history
```

## State Ownership Map
| State | Owner | Mutated By | Read By |
|---|---|---|---|
| App mode/capture/sidebar/workspace view | `state` at `assets/js/app/build-app.js:1039` | `setMode`, `setCaptureSource`, sidebar functions | UI sync and recording |
| Provider/key/model selections | `state.apiProvider`, `state.apiKey`, `state.providerKeys` at `assets/js/app/build-app.js:1083`-`1091` | provider/key listeners at `assets/js/app/build-app.js:8518`-`8629` | endpoint builders and provider request layer |
| Transcript/segments | `state.segments` at `assets/js/app/build-app.js:1048` | `addSegment()` at `assets/js/app/build-app.js:4076` and file display at `assets/js/app/build-app.js:3464` | export, translation, correction, workspace save |
| Translation state | `state.translation` at `assets/js/app/build-app.js:1116`-`1119` | queue/flush/cache functions at `assets/js/app/build-app.js:5682`-`5834` | translated transcript UI and workspace payload |
| Assistant state | `state.assistant` at `assets/js/app/build-app.js:1127`-`1161` | assistant functions at `assets/js/app/build-app.js:6888`-`8080` | assistant renderers and persistence |

## Configuration Flow
There is no `.env` or server-side config object. Runtime configuration comes from browser storage and UI controls: provider/key/model storage is read at `assets/js/app/build-app.js:1083`-`assets/js/app/build-app.js:1091`, endpoint builders select Groq/OpenAI/Gemini URLs at `assets/js/app/build-app.js:5143`-`assets/js/app/build-app.js:5160`, and provider key persistence writes `vt_provider_keys` at `assets/js/app/build-app.js:5163`-`assets/js/app/build-app.js:5165`. `.vscode/settings.json:2` contains only Live Server port `5502`.

## Background Processes
| Process | Evidence |
|---|---|
| Workspace autosave debounce | `assets/js/app/build-app.js:6423`-`6427` |
| Recording timer interval | `assets/js/app/build-app.js:3896`-`3906` |
| Recognition restart timeout | `assets/js/app/build-app.js:3968`-`3983` |
| No-speech timeout | `assets/js/app/build-app.js:3988`-`4003` |
| Auto-copy countdown interval | `assets/js/app/build-app.js:4011`-`4028` |
| Translation debounce timer | `assets/js/app/build-app.js:5706`-`5707` |
| Canvas/window UI effects | `assets/js/app/build-app.js:9840`-`9854` |

## Architectural Risks
- High coupling: most behavior is inside one closure from `assets/js/app/build-app.js:14` to `assets/js/app/build-app.js:9891`, while feature modules are scope maps only (`assets/js/features/capture.js:9`).
- Client-side secret storage: README warns keys are stored in browser localStorage at `README.md:36`-`README.md:40`; runtime reads/writes API keys at `assets/js/app/build-app.js:1084`, `assets/js/app/build-app.js:5165`, and `assets/js/app/build-app.js:8549`.
- Browser capability sensitivity: capture requires secure context and browser APIs, with failure conditions in `assets/js/app/build-app.js:2586`-`assets/js/app/build-app.js:2629`.
- No backend trust boundary: all API calls are direct from browser to providers, with endpoint builders at `assets/js/app/build-app.js:5143`-`assets/js/app/build-app.js:5160`.

## Function Surface Sample
| Location | Function |
|---|---|
| assets/js/app/build-app.js:14 | function buildApp() { |
| assets/js/app/build-app.js:1026 | function safeLocalStorageSet(key, value) { |
| assets/js/app/build-app.js:1584 | function syncApiKeyToggleButton() { |
| assets/js/app/build-app.js:1592 | function syncGeminiKeyToggleButton() { |
| assets/js/app/build-app.js:1600 | function isTouchPrimary() { |
| assets/js/app/build-app.js:1604 | function getCaptureSourceLabel(source = state.captureSource) { |
| assets/js/app/build-app.js:1613 | function canUseLiveMode() { |
| assets/js/app/build-app.js:1617 | function canUseQualityMode(source = state.captureSource) { |
| assets/js/app/build-app.js:1622 | function getIdleHint() { |
| assets/js/app/build-app.js:1626 | function getActiveHint() { |
| assets/js/app/build-app.js:1630 | function isCompactSidebarViewport() { |
| assets/js/app/build-app.js:1634 | function setTopbarMobileDrawerOpen(open) { |
| assets/js/app/build-app.js:1641 | function buildWorkspaceViews() { |
| assets/js/app/build-app.js:1773 | function syncWorkspaceViewUi() { |
| assets/js/app/build-app.js:1788 | function syncSlidingPill(containerSelector, activeSelector, pillSelector) { |
| assets/js/app/build-app.js:1801 | function syncInteractiveChrome() { |
| assets/js/app/build-app.js:1806 | function animateWorkspaceViewStage() { |
| assets/js/app/build-app.js:1816 | function formatCounterLabel(value, unit) { |
| assets/js/app/build-app.js:1820 | function animateCount(el, nextValue, formatter) { |
| assets/js/app/build-app.js:1849 | function lucideIconMarkup(name) { |
| assets/js/app/build-app.js:1863 | function applyWorkspaceNavIcons() { |
| assets/js/app/build-app.js:1871 | function syncRecordTranslationSplit() { |
| assets/js/app/build-app.js:1896 | function setWorkspaceView(view, { persist = true, closeMobile = true, animate = true } = {}) { |
| assets/js/app/build-app.js:1922 | function navigateToWorkspaceView(view) { |
| assets/js/app/build-app.js:1945 | function setApiPanelOpen(isOpen) { |
| assets/js/app/build-app.js:1951 | function openHelpModal() { |
| assets/js/app/build-app.js:1958 | function closeHelpModal() { |
| assets/js/app/build-app.js:1968 | function syncSidebarUi() { |
| assets/js/app/build-app.js:2012 | function setSidebarCollapsed(collapsed) { |
| assets/js/app/build-app.js:2018 | function setSidebarMobileOpen(open) { |
| assets/js/app/build-app.js:2024 | function setSidebarWidth(width) { |
| assets/js/app/build-app.js:2030 | function getReadyStatusForCurrentState(mode = state.mode, source = state.captureSource) { |
| assets/js/app/build-app.js:2039 | function getActiveStatusForCurrentState(mode = state.mode, source = state.captureSource) { |
| assets/js/app/build-app.js:2046 | function getLiveRecognitionLang() { |
| assets/js/app/build-app.js:2053 | function markLiveHealth(delta = 0, reason = '', mode = state.liveHealth.mode \|\| 'live') { |
| assets/js/app/build-app.js:2068 | function normalizeLiveTranscriptCandidate(text = '', conf = 0, language = '') { |
| assets/js/app/build-app.js:2085 | function scoreRecognitionAlternative(alt, language) { |
| assets/js/app/build-app.js:2095 | function pickRecognitionCandidate(resultList, language) { |
| assets/js/app/build-app.js:2110 | function schedulePendingRealtimeCommit(text, conf, meta = {}) { |
| assets/js/app/build-app.js:2135 | function flushPendingRealtimeSegment(force = false) { |
| assets/js/app/build-app.js:2150 | async function startRealtimeAudioBuffer() { |
| assets/js/app/build-app.js:2171 | function stopRealtimeAudioBuffer(discard = false) { |
| assets/js/app/build-app.js:2196 | function stopTracks(stream) { |
| assets/js/app/build-app.js:2200 | function stopActiveCaptureTracks() { |
| assets/js/app/build-app.js:2209 | function pickRecorderMimeType() { |
| assets/js/app/build-app.js:2220 | function setCaptureHelpOpen(nextOpen) { |
| assets/js/app/build-app.js:2227 | function setShortcutsOpen(nextOpen) { |
| assets/js/app/build-app.js:2234 | function setAiOutputOpen(nextOpen) { |
| assets/js/app/build-app.js:2241 | function setMemoryToolsOpen(nextOpen) { |
| assets/js/app/build-app.js:2248 | function normalizeMemoryPacks(packs = []) { |
