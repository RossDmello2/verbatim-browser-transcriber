# Knowledge Graph
Generated: 2026-05-16T21:13:29

> Production update, 2026-05-17: this graph began as a historical intelligence artifact. The risk rows below have been updated for the production completion pass; use `docs/architecture/overview.md` and `docs/operations/VERIFICATION_MATRIX.md` as the current source of truth.

## Route Index
| Route | File | Handler | Service | DB Tables |
|---|---|---|---|---|
| NOT PRESENT | N/A | N/A | Static browser app | NOT PRESENT |
| audio transcription/translation pseudo-route | `assets/js/app/build-app.js:3109` | `transcribeBlob` | Groq/OpenAI audio | NOT PRESENT |
| chat completion pseudo-route | `assets/js/app/build-app.js:6534` | `callChatModel` | Groq/OpenAI chat | NOT PRESENT |
| Gemini generate pseudo-route | `assets/js/app/build-app.js:7950` | `requestGeminiAssistantReply` | Gemini generateContent | NOT PRESENT |
| Gemini upload pseudo-route | `assets/js/app/build-app.js:7835` | `uploadGeminiFileWithKey` | Gemini Files API | NOT PRESENT |

## Function Index
| Location | Function | Called By | Calls |
|---|---|---|---|
| assets/js/app/build-app.js:14 | function buildApp() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1026 | function safeLocalStorageSet(key, value) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1584 | function syncApiKeyToggleButton() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1592 | function syncGeminiKeyToggleButton() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1600 | function isTouchPrimary() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1604 | function getCaptureSourceLabel(source = state.captureSource) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1613 | function canUseLiveMode() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1617 | function canUseQualityMode(source = state.captureSource) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1622 | function getIdleHint() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1626 | function getActiveHint() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1630 | function isCompactSidebarViewport() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1634 | function setTopbarMobileDrawerOpen(open) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1641 | function buildWorkspaceViews() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1773 | function syncWorkspaceViewUi() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1788 | function syncSlidingPill(containerSelector, activeSelector, pillSelector) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1801 | function syncInteractiveChrome() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1806 | function animateWorkspaceViewStage() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1816 | function formatCounterLabel(value, unit) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1820 | function animateCount(el, nextValue, formatter) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1849 | function lucideIconMarkup(name) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1863 | function applyWorkspaceNavIcons() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1871 | function syncRecordTranslationSplit() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1896 | function setWorkspaceView(view, { persist = true, closeMobile = true, animate = true } = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1922 | function navigateToWorkspaceView(view) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1945 | function setApiPanelOpen(isOpen) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1951 | function openHelpModal() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1958 | function closeHelpModal() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:1968 | function syncSidebarUi() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2012 | function setSidebarCollapsed(collapsed) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2018 | function setSidebarMobileOpen(open) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2024 | function setSidebarWidth(width) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2030 | function getReadyStatusForCurrentState(mode = state.mode, source = state.captureSource) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2039 | function getActiveStatusForCurrentState(mode = state.mode, source = state.captureSource) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2046 | function getLiveRecognitionLang() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2053 | function markLiveHealth(delta = 0, reason = '', mode = state.liveHealth.mode \|\| 'live') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2068 | function normalizeLiveTranscriptCandidate(text = '', conf = 0, language = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2085 | function scoreRecognitionAlternative(alt, language) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2095 | function pickRecognitionCandidate(resultList, language) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2110 | function schedulePendingRealtimeCommit(text, conf, meta = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2135 | function flushPendingRealtimeSegment(force = false) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2150 | async function startRealtimeAudioBuffer() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2171 | function stopRealtimeAudioBuffer(discard = false) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2196 | function stopTracks(stream) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2200 | function stopActiveCaptureTracks() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2209 | function pickRecorderMimeType() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2220 | function setCaptureHelpOpen(nextOpen) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2227 | function setShortcutsOpen(nextOpen) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2234 | function setAiOutputOpen(nextOpen) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2241 | function setMemoryToolsOpen(nextOpen) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2248 | function normalizeMemoryPacks(packs = []) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2267 | function getActiveMemoryPack() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2271 | function syncActiveMemoryPackState() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2283 | function persistMemoryPacksStore() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2291 | function ensureMemoryPackStore() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2300 | function setActiveMemoryPack(packId) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2311 | function createMemoryPack(name) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2329 | function deleteActiveMemoryPack() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2353 | function getOutputStyleInstruction(style = state.outputStyle) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2366 | function normalizeImportedMemory(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2372 | function formatRelativeMemoryTime(iso = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2385 | function getImportedMemoryContext({ maxChars = 9000 } = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2400 | function getTaskMemoryGuidance(taskName = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2416 | function renderMemoryUi() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2432 | function persistMemoryStore() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2437 | function setImportedMemory(rawText, { announce = true } = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2450 | function getCaptureCapabilitySummary() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2469 | function renderCaptureHelp() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2490 | function getCaptureStatusLabel() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2499 | function setCaptureOrbActive(isActive) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2516 | function updateCaptureOrbStatus() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2521 | function syncCaptureTranscriptHost() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2526 | function syncCaptureTranscript() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2530 | function updateCaptureInterim(_text) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2535 | function renderCaptureUi() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2566 | function setCaptureSource(source, options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2586 | function ensureSecureContextForCapture() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2595 | async function acquireCaptureStream(source = state.captureSource) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2779 | function analyzeAudio(buffer) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2821 | async function processAudioBuffer(buffer, analysis, normalize) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2861 | async function resampleTo16k(buffer) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2874 | function audioBufferToWav(buffer) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2886 | function writeStr(offset, str) { for (let i = 0; i < str.length; i++) dv.setUint8(offset + i, str.charCodeAt(i)); } | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2911 | function chunkWavBlob(buffer, maxBytes) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2974 | function getApiEndpoint() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2978 | function getWhisperLang() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:2984 | function getSpeechRecognitionLocale(langCode) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3012 | function getUploadedFileLanguageMode() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3016 | function shouldTranslateUploadedFile() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3020 | function syncUploadedFileLanguageModeUi() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3026 | function normalizeLanguageCode(code = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3030 | function syncDetectedLanguage(language = '', { announceMismatch = false } = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3046 | async function testApiKey() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3077 | async function testGeminiKey() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3109 | async function transcribeBlob(blob, options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3130 | async function transcribeChunks(chunks, options, onProgress, cacheKey = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3158 | function mergeResults(results) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3196 | async function decodeMediaToAudioBuffer(blob) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3206 | async function transcribeBlobThroughPipeline(blob, options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3229 | function averageSegmentConfidence(result = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3239 | function transcriptLanguageSpread(result = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3250 | function shouldRetryUploadedFileTranscription(result, analysis, options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3261 | function preferRetriedTranscript(primary, retried) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3271 | function textSimilarity(a, b) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3284 | async function finalizeUploadedFileResult(result, options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3318 | async function processUploadedFile() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3464 | function displayFileResult(result) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3492 | function shouldTriggerRealtimeFallback() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3501 | function getAdaptiveTranscriptionLanguageHint() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3510 | async function runRealtimeFallback(reason = 'Live recognition degraded') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3558 | function formatTimestamp(seconds) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3565 | function formatTimestampFull(seconds) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3573 | function formatTimestampVTT(seconds) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3581 | function getSubtitleTextForSegment(seg) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3589 | function getExportTranscriptText() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3595 | function getSubtitleDownloadName(ext = 'srt') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3601 | function getDocumentDownloadName(ext = 'txt') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3607 | function canExportFormat(format = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3621 | function downloadTranscriptFormat(format = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3651 | function normalizeUiText(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3661 | function setProgress(pct, label) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3673 | function showAnalysis(a) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3700 | function ensureCanvasSize() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3713 | function analyzeLiveLevel(data) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3727 | function drawOrbFrame(level = 0, isLive = false, waveform = null) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3842 | function startAudioVisualizer(stream) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3855 | function startAudioFromMic() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3866 | function stopAudio() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3878 | function drawWave() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3896 | function startTimer() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3901 | function stopTimer() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3908 | function updateTimer() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3916 | function fmtTime(ms) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3922 | function commitPendingRealtimeInterim() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3968 | function scheduleRestart(delay = 50) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:3988 | function setNoSpeechTimer() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4006 | function clearNoSpeechTimer() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4011 | function startAutoCopyCountdown() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4031 | function clearAutoCopyCountdown() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4038 | function triggerAutoCopy() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4053 | function applySmartPunct(text, gapMs) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4076 | function addSegment(text, conf, timeStr, lang, meta = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4107 | function parseTimeStr(ts) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4112 | function appendToTranscript(text) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4127 | function clearTranscript() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4166 | function updateStats() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4180 | function syncStatusBar() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4227 | function escHtml(s) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4234 | function switchView(v) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4258 | function setStatus(main, sub) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4270 | function toast(msg, type = 'info', duration = 2400) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4285 | function copyToClipboard(text, onSuccess) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4293 | function legacyCopy(text, onSuccess) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4307 | function saveUndo(text) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4312 | function addToHistory(text) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4324 | function renderHistory() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4357 | function generateSRT() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4366 | function generateVTT() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4377 | function generateJSON() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4416 | function generateMarkdown() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4426 | function generateCSV() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4447 | function generateWorkspaceJSON() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4451 | function downloadBlob(blob, filename) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4460 | function downloadFile(content, filename, mime) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4464 | function refreshTopDownloadAction() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4483 | function refreshExportCards() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4498 | function escapeXml(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4507 | function getDocxParagraphXml(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4513 | function buildDocxXmlDocument(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4528 | function buildStoredZip(files) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4607 | function generateDocxBlob() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4632 | function updateTranscribeBtn() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4643 | function formatFileSize(bytes) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4648 | function safeJsonParse(text, fallback = null) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4652 | function normalizeProviderKeyStore(rawStore) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4664 | function defaultAudioModel(provider) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4668 | function defaultChatModel(provider) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4672 | function defaultCorrectionModel(provider) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4676 | function remapDeprecatedGroqModel(model = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4684 | function defaultAssistantModelId() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4688 | function getGeminiAnalysisModelCatalog() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4714 | function defaultGeminiAnalysisModel() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4718 | function getAssistantModelCatalog() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4795 | function getAssistantProviderLabel(provider) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4802 | function getAssistantModelOption(id = state.assistant.model) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4807 | function getConfiguredGeminiAnalysisModel() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4813 | function getConfiguredGeminiAnalysisOption() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4829 | function findAssistantCatalogOption(id) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4833 | function isLongOutputAssistantRequest(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4840 | function isContextHeavyAssistantRequest(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4844 | function isQuickAssistantRequest(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4848 | function resolveMaxAssistantModel(attachments = null, text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4874 | function persistGeminiUsage() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4878 | function getGeminiUsageEntry(model = getConfiguredGeminiAnalysisModel()) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4899 | function recordGeminiUsage(model = getConfiguredGeminiAnalysisModel()) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4908 | function resetGeminiUsage(model = getConfiguredGeminiAnalysisModel()) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4923 | function renderGeminiUsageMeter() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4942 | function getActiveAssistantModelOption() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4946 | function getActiveAssistantProvider() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4950 | function getActiveAssistantModel() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4954 | function assistantAttachmentAccept(option = getActiveAssistantModelOption()) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4964 | function attachmentKindFromMimeType(mimeType = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4971 | function inferAttachmentMimeType(file) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4986 | function canAssistantModelUseAttachment(option, attachment) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:4996 | function getAssistantOptionForRequest(attachment = null, text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5011 | function setAssistantModel(value, options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5024 | function populateAssistantModelControls() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5042 | function populateGeminiModelControls() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5058 | function getChatModelCatalog(provider) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5076 | function getActiveChatModel() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5080 | function syncChatModelSelectors() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5090 | function populateChatModelControls() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5108 | function setChatModel(value, options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5118 | function getApiModel() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5122 | function getEffectiveAudioModel(options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5135 | function getProviderKeys(provider = state.apiProvider) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5143 | function getAudioEndpoint(kind = 'transcriptions', provider = state.apiProvider) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5149 | function getChatEndpoint(provider = state.apiProvider) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5155 | function getGeminiGenerateEndpoint(model) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5159 | function getGeminiUploadEndpoint() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5163 | function persistProviderStore() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5168 | function updateProviderVaultMeta(provider, element) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5174 | function updateVaultMeta() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5179 | function setCacheStatus(message) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5183 | function escapeHtml(v) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5187 | function parseGlossary() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5199 | function applyGlossaryToText(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5209 | function cleanTranscriptLocal(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5216 | function redactSensitiveText(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5223 | function normalizeSegment(seg = {}, idx = 0) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5251 | function persistCorrectionCache() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5257 | function translationLanguageCatalog() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5282 | function translationTargetLabelFor(code = 'en') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5286 | function createEmptyTranslationStats() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5296 | function normalizeTranslationStats(stats = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5306 | function normalizeTranslationEntry(entry = {}, segment = null) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5329 | function normalizeTranslationState(raw = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5350 | function persistTranslationSettings() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5355 | function translationCacheKey(sourceText, targetLanguage, provider, model) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5359 | function hashPlainText(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5369 | function readTranslationCache(sourceText, targetLanguage, provider, model) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5375 | function saveTranslationCache(sourceText, targetLanguage, provider, model, payload) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5393 | function getTranslationResultForSegment(segmentOrId) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5399 | function clearTranslationQueue() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5405 | function resetTranslationSession({ keepSettings = true } = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5420 | function syncTranslationResultsWithSegments() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5434 | function recomputeTranslationStats() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5465 | function translatedTextForSegment(seg) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5473 | function renderTranslatedSegments() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5510 | function renderTranslationUi() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5559 | function buildTranslationSystemPrompt() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5572 | function extractJsonPayload(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5590 | function parseTranslationResponse(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5615 | function setTranslationResultForSegment(segment, payload, meta = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5633 | function applyTranslationBatch(items, requestItems, meta = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5663 | function markSegmentsPending(segmentIds = []) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5682 | function queueTranslationForSegmentIds(segmentIds = [], options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5710 | function queueTranslationBackfill(options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5725 | async function flushTranslationQueue() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5837 | function confidenceClass(conf) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5843 | function getCorrectionModel() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5849 | function isLikelyGarbledText(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5860 | function containsDevanagari(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5864 | function containsLatin(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5868 | function isPunctuationOnlySegment(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5874 | function countMeaningfulWords(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5878 | function looksLikeIndicLanguage(code = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5882 | function looksLikeScriptMismatch(text = '', language = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5891 | function countRepeatedTokens(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5901 | function assessTranscriptSegmentQuality(segment = {}, context = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5942 | function mergeSegmentTexts(a = '', b = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5951 | function normalizeResultSegmentsForDisplay(result = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:5994 | function getLanguageSpreadFromSegments(segments = []) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6004 | function buildTranscriptTextFromSegments(segments = []) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6011 | function shouldRunMultilingualRepair(result = {}, segments = [], options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6023 | function buildMultilingualRepairPrompt(batch = [], allSegments = [], meta = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6037 | function parseMultilingualRepairResponse(text = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6047 | async function requestMultilingualRepairBatch(batch = [], allSegments = []) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6098 | async function repairMultilingualResultSegments(result = {}, segments = [], options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6152 | function getCorrectionCacheKey(segment) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6161 | function shouldRouteSegmentToCorrection(segment) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6176 | async function requestTranscriptCorrection(segment, tier = 'fast') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6214 | async function runSelectiveCorrectionForSegment(segmentId) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6271 | function queueSelectiveCorrectionForSegment(segmentId) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6288 | function syncSegmentTimes() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6301 | function renderSegments() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6402 | function rebuildTranscriptFromSegments(keepCursor = false) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6416 | function writeWorkspaceToStorage() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6423 | function scheduleWorkspaceSave() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6429 | function buildTranscriptCacheKey(hash, options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6441 | function transcriptCacheKey(key) { return `vt_tc::${key}`; } | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6442 | function partialKey(key) { return `${transcriptCacheKey(key)}::partial`; } | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6443 | function readTranscriptCache(key) { return safeJsonParse(localStorage.getItem(transcriptCacheKey(key)) \|\| '', null); } | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6444 | function saveTranscriptCache(key, payload) { localStorage.setItem(transcriptCacheKey(key), JSON.stringify(payload)); } | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6445 | function readPartialProgress(key) { return safeJsonParse(localStorage.getItem(partialKey(key)) \|\| '', null); } | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6446 | function savePartialProgress(key, payload) { localStorage.setItem(partialKey(key), JSON.stringify(payload)); } | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6447 | function clearPartialProgress(key) { localStorage.removeItem(partialKey(key)); } | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6449 | async function hashArrayBuffer(arrayBuf) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6454 | async function requestWithProvider({ | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6522 | async function providerRequest({ url, buildBody, responseType = 'json', signal, purpose = 'request', maxRetries = 2 }) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6534 | async function callChatModel(task, rawText, { button } = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6604 | async function askTranscriptQuestion(question, { button } = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6680 | function getImportedMemoryContext({ maxChars = 9000 } = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6697 | function renderMemoryUi() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6727 | function persistMemoryStore() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6731 | function setImportedMemory(rawText, { announce = true } = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6812 | function getAssistantRuntimeSummary() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6839 | function normalizeAssistantAttachmentMeta(raw) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6861 | function normalizeAssistantAttachmentList(raw) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6871 | function canReuseGeminiFileReference(attachment) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6878 | function cloneAssistantMessage(msg) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6888 | function createAssistantMessage(role, content, extras = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6902 | function createAssistantConversation(seedMessages = null, seedTitle = 'New chat') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6916 | function deriveAssistantConversationTitle(messages = []) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6923 | function normalizeAssistantConversation(conv, index = 0) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6939 | function getCurrentAssistantConversation() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6943 | function persistAssistantConversations() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6954 | function syncAssistantMessagesFromCurrentConversation() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6960 | function ensureAssistantConversationStore() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6980 | function persistAssistantThread() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:6993 | function persistAssistantUi() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7003 | function sanitizeAssistantUiState(ui) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7014 | function getAssistantRobotBadgeMarkup() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7040 | function setAssistantDraft(value) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7045 | function getAssistantWelcomeMessage() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7052 | function ensureAssistantThread() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7056 | function assistantEscapedHtml(text) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7060 | function parseAssistantThinking(rawText) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7080 | function renderAssistantTextBlockHtml(text) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7085 | function renderAssistantCodeBlockHtml(code, language = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7101 | function renderAssistantStructuredHtml(text) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7119 | function renderAssistantResponseHtml(rawText) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7140 | function normalizeAssistantResponsePayload(text) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7147 | function extractFinalAiOutputText(text) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7153 | function normalizeAssistantText(text) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7166 | function describeAssistantAttachment(meta) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7173 | function describeAssistantAttachmentList(raw) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7187 | function getDefaultAssistantPromptForAttachment(attachment) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7201 | function clearAssistantAttachment(options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7207 | function renderAssistantComposer() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7279 | async function handleAssistantFileSelection(fileList) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7311 | function getLastAssistantReply() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7319 | function formatAssistantConversationTime(ts) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7333 | function renderAssistantHistoryList() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7359 | function selectAssistantConversation(conversationId) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7373 | function createNewAssistantConversation() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7389 | function deleteAssistantConversation(conversationId) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7406 | function renderAssistantMessages() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7453 | function smoothScrollChat() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7463 | function step(timestamp) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7473 | function showTypingIndicator() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7490 | function hideTypingIndicator() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7494 | function animateAssistantMessageEdges(msgs) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7513 | function setAssistantOpen(isOpen) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7552 | function toggleAssistantMaximized(force) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7562 | function pushAssistantMessage(role, content, extras = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7570 | function getAssistantPromptContext() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7580 | function getAssistantGenerationConfig() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7590 | function getAttachmentAnalysisInstruction(attachments = null) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7602 | function buildAssistantPromptMessages(currentAttachment = null) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7650 | function buildGeminiAssistantContents(currentAttachment = null) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7687 | function buildAssistantAttachmentMeta(file, provider = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7699 | function readFileAsDataUrl(file) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7708 | function readFileAsText(file) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7717 | function loadImageElementFromFile(file) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7733 | async function normalizeAssistantImageFile(file) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7760 | async function prepareAssistantAttachmentForProvider(attachment, provider) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7801 | function startAssistantVoiceInput() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7827 | function stopAssistantVoiceInput() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7835 | async function uploadGeminiFileWithKey(file, apiKey, signal) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7881 | async function prepareGeminiAttachment(attachment, signal, options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7932 | function extractGeminiText(result) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7943 | function isGeminiExpiredFileError(error) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:7950 | async function requestGeminiAssistantReply(model, preparedAttachment, signal, options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:8001 | async function askAssistant(question) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:8083 | function toggleRecordingFromUi() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:8127 | function updateRobot(cx, cy) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:8156 | function submitAssistantDraft() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:8763 | function handleFileSelect(file) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:8989 | function buildPromptPackTask() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9109 | function syncAiOutputExpandUi() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9117 | function syncAiOutputTranslateUi() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9123 | async function translateAiOutputToTarget({ button } = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9206 | function updateDiagnostics(patch = {}, logLine = '') { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9257 | function setStatus(main, sub) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9263 | function clearNoSpeechTimer() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9271 | function startQualityRecording() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9373 | function stopQualityRecording() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9387 | function setMode(mode, options = {}) { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9430 | function startRecording() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9498 | function stopRecording() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9532 | function forceStop() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9553 | function getWorkspacePayload() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9591 | function restoreWorkspaceIfAny() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9760 | function resizeCanvas() { | See surrounding closure | Local closure calls |
| assets/js/app/build-app.js:9765 | function initUiEffects() { | See surrounding closure | Local closure calls |

## Data Model Index
| Model | Location | Fields/Shape | Queried By |
|---|---|---|---|
| state | `assets/js/app/build-app.js:1039`-`1178` | central in-memory object | all runtime functions |
| segments[] | `assets/js/app/build-app.js:5223`-`5248` | normalized transcript segment | translation, correction, export, workspace |
| translation.segmentResults | `assets/js/app/build-app.js:5306`-`5347` | segment id keyed translation entries | translation render/cache |
| providerKeys | `assets/js/app/build-app.js:4652`-`4661` | groq/openai/gemini arrays | provider request layer |
| memoryPacks[] | `assets/js/app/build-app.js:2248`-`2288` | id/name/raw/importedAt | AI output and assistant context |
| assistant.conversations[] | `assets/js/app/build-app.js:6888`-`7000` | messages/attachments/ui | assistant render/persistence |
| workspace payload | `assets/js/app/build-app.js:9553`-`9588` | backup/restore JSON | workspace import/export/autosave |
| transcript cache | `assets/js/app/build-app.js:6429`-`6447` | `vt_tc::*` keys | file transcription |
| translation cache | `assets/js/app/build-app.js:5355`-`5390` | `vt_tr::*` keys | live translation |

## Config/Env Index
| Var/Key | Where Loaded/Used | Source | Required | Example |
|---|---|---|---|---|
| No env vars | N/A | N/A | N/A | Static app uses UI/localStorage |
| `vt_provider` | `assets/js/app/build-app.js:1083`, `8521` | localStorage | optional | groq |
| `vt_api_key` | `assets/js/app/build-app.js:1084`, `8549` | localStorage | optional but required for provider calls | [REDACTED] |
| `vt_provider_keys` | `assets/js/app/build-app.js:1088`, `5165` | localStorage | optional | {"groq":[],"openai":[],"gemini":[]} |
| `vt_workspace_v3` | `assets/js/app/build-app.js:1205`, `6419`, `9592` | localStorage | optional | workspace JSON |
| `vt_ai_output` | `assets/js/app/build-app.js:1121`, `6582` | sessionStorage | optional | AI text |
| `.vscode/settings.json` | `.vscode/settings.json:2` | editor config | optional | live server port 5502 |

## External Service Index
| Service | Location | Credential Source | Failure Behavior | Retry Policy |
|---|---|---|---|---|
| Groq | `assets/js/app/build-app.js:5143`-`5152` | Bearer key from localStorage | retry 429/5xx/network via wrapper | OpenAI-compatible audio/chat |
| OpenAI | `assets/js/app/build-app.js:5143`-`5152` | Bearer key from localStorage | same wrapper | audio/chat fallback |
| Gemini | `assets/js/app/build-app.js:5155`-`5160` | `x-goog-api-key` | no generic backoff; expired-file re-upload once | assistant multimodal |
| Browser Media APIs | `assets/js/runtime/capabilities.js:17`-`23` | browser permissions | UI fallback/toasts | speech/record/capture |

## Known Bug Index
| ID | Severity | Category | Location | Reproduction/Fix | Fix Approach |
|---|---|---|---|---|---|
| R1 | HIGH | Secrets | `README.md:38`-`40`, `assets/js/app/build-app.js:1083`-`1089`, `5163`-`5165` | Browser localStorage stores provider API keys. | Prefer ephemeral session keys, WebCrypto-wrapped storage with passphrase, or backend/proxy with scoped tokens. |
| R2 | MITIGATED | Data Integrity | `assets/js/runtime/workspace-validation.js`, `assets/js/app/build-app.js` import/restore path | Workspace import now validates version, size, unsafe keys, and high-risk collection sizes before restore. | Keep validator tests current when workspace schema changes. |
| R3 | MITIGATED | Reliability | `assets/js/runtime/request-timeout.js`, provider fetch paths in `assets/js/app/build-app.js` | Provider calls now use a shared timeout helper with typed timeout errors. | Keep timeout smoke coverage when provider code changes. |
| R4 | MEDIUM | Concurrency | `assets/js/app/build-app.js:5682`-`5834` | Translation batches can apply stale/deferred results. | Snapshot target/model/provider/segment hashes and ignore stale completions. |
| R5 | MITIGATED/PARTIAL | Testing | `tests/unit/*.test.mjs`, `tests/web/verbatim.spec.js` | Automated tests now cover validation, timeout helpers, boot, import, navigation, and timeout UI. | Add future coverage for translation staleness and real provider success paths. |
| R6 | MITIGATED/PARTIAL | Tooling | `package.json`, `package-lock.json`, `apps/mobile/package.json`, CI | Root package and CI checks exist; mobile audit still reports Expo dependency advisories. | Track Expo-compatible dependency updates. |
| R7 | LOW | Observability | `assets/js/app/build-app.js:9206`-`9224` | Diagnostics are local/session-only. | Add redacted diagnostics export and structured error events. |
| R8 | LOW | Frontend/Privacy | `assets/css/00-fonts.css:1`, `index.html:8`-`9` | Google Fonts is loaded from an external host. | Keep as documented dependency, self-host fonts, or rely on local font fallbacks for offline/privacy-sensitive use. |
| R9 | LOW/MEDIUM | Accessibility | `index.html:5` | Viewport disables user scaling. | Allow scaling and verify mobile layouts. |

## Test Index
| Test File | What It Tests | What It Does Not Test | Fixture Accuracy |
|---|---|---|---|
| NOT PRESENT | No test files found | All runtime paths untested | N/A |
