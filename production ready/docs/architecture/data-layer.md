# SA-4: Data Layer Report
Generated: 2026-05-16T21:09:03

## Schema Inventory
There is no server database schema. The data layer is browser state plus `localStorage`/`sessionStorage`. README lists `localStorage` and `sessionStorage` browser dependencies at `README.md:34`, and the runtime initializes its single `state` object at `assets/js/app/build-app.js:1039`.
### Browser State Object
`state` includes mode/capture/sidebar/session flags at `assets/js/app/build-app.js:1040`-`assets/js/app/build-app.js:1059`, audio recorder/file state at `assets/js/app/build-app.js:1060`-`assets/js/app/build-app.js:1080`, provider/key/model state at `assets/js/app/build-app.js:1083`-`assets/js/app/build-app.js:1091`, memory/translation/diagnostics/assistant/history state at `assets/js/app/build-app.js:1092`-`assets/js/app/build-app.js:1178`.
### Workspace Payload
`getWorkspacePayload()` serializes version, savedAt, mode, captureSource, preset, transcript, translatedTranscript, aiOutput, segments, detectedLanguage, speakerMode, glossary, memory, diagnostics, fileHash, duration, provider/models, and translation at `assets/js/app/build-app.js:9553`-`assets/js/app/build-app.js:9588`. Workspace restore reads `vt_workspace_v3` and legacy `vt_workspace_v2` at `assets/js/app/build-app.js:9591`-`assets/js/app/build-app.js:9593`.
### Segments
`normalizeSegment()` defines segment fields: id, text, conf, time, lang, created, startSec, endSec, speaker, locked, source, provisional, alternatives, reliability, correctionStatus, originalText, correctedAt, rawText, rawLanguage, qualityScore, and qualityFlags at `assets/js/app/build-app.js:5223`-`assets/js/app/build-app.js:5248`.
### Translation Entries
Translation entries normalize segmentId, sourceText, translatedText, sentiment, tone, status, targetLanguage, provider, model, error, and updatedAt at `assets/js/app/build-app.js:5306`-`assets/js/app/build-app.js:5326`; translation state normalizes enabled, targetLanguage, provider, model, segmentResults, pendingQueue, processing flag, stats, and lastError at `assets/js/app/build-app.js:5329`-`assets/js/app/build-app.js:5347`.
### Provider Key Store
`normalizeProviderKeyStore()` returns `groq`, `openai`, and `gemini` arrays at `assets/js/app/build-app.js:4652`-`assets/js/app/build-app.js:4661`; persisted vault writes occur at `assets/js/app/build-app.js:5163`-`assets/js/app/build-app.js:5165`.
### Memory Packs
Memory packs normalize `id`, `name`, `raw`, and `importedAt` at `assets/js/app/build-app.js:2248`-`assets/js/app/build-app.js:2255`; memory storage writes occur at `assets/js/app/build-app.js:2283`-`assets/js/app/build-app.js:2288`.
### Assistant Conversations
Assistant messages normalize at `assets/js/app/build-app.js:6888`-`assets/js/app/build-app.js:6899`; conversations normalize at `assets/js/app/build-app.js:6902`-`assets/js/app/build-app.js:6936`; persistence writes conversation/thread/UI state at `assets/js/app/build-app.js:6943`-`assets/js/app/build-app.js:7000`.

## Entity Relationship Map (ASCII)
```text
Browser localStorage/sessionStorage
  -> state
     -> workspace payload vt_workspace_v3/vt_workspace_v2
        -> transcript + translatedTranscript + aiOutput
        -> segments[] -> translation.segmentResults[segmentId]
        -> memoryPacks[] -> activeMemoryPackId
        -> diagnostics + provider/models + translation settings
     -> provider key store vt_provider_keys -> groq[] openai[] gemini[]
     -> assistant conversations -> messages[] -> attachments[]
     -> transcript cache vt_tc::* and partial cache vt_tc::*::partial
     -> translation cache vt_tr::*
```

## Migration History Summary
Server migrations are NOT PRESENT. The only explicit data-version migration is workspace restore fallback from `vt_workspace_v3` to `vt_workspace_v2` at `assets/js/app/build-app.js:1205`-`assets/js/app/build-app.js:1206` and `assets/js/app/build-app.js:9591`-`assets/js/app/build-app.js:9593`.

## Query Audit
| Location | Query Type | Key/Table | Injection Safe | Unbounded | Notes |
|---|---|---|---|---|---|
| `assets/js/app/build-app.js:6416`-`6420` | write | `vt_workspace_v3` | browser JSON serialization | no | workspace autosave/export payload |
| `assets/js/app/build-app.js:6443`-`6447` | read/write/remove | `vt_tc::*`, partial | key built internally | possible storage growth | transcript and partial caches |
| `assets/js/app/build-app.js:5355`-`5390` | read/write | `vt_tr::*` | key hashes source text | possible storage growth | translation cache |
| `assets/js/app/build-app.js:5163`-`5165` | write | `vt_provider_keys` | JSON serialization | no | stores API key vault in browser |
| `assets/js/app/build-app.js:8968`-`8972` | import/write | `vt_workspace_v3` | no schema validation | no | arbitrary parsed JSON accepted |

## Vector Store Analysis
Vector store is NOT PRESENT. Qdrant appears only as default glossary/help text, such as `assets/js/app/build-app.js:1093` and `assets/js/app/build-app.js:718`-`assets/js/app/build-app.js:723`; there is no Qdrant client or vector collection logic.

## Cache Analysis
Caches are browser-local, not Redis/Memcached. Transcript cache keys are built at `assets/js/app/build-app.js:6429`-`assets/js/app/build-app.js:6444`; partial progress is saved during chunk transcription at `assets/js/app/build-app.js:3130`-`assets/js/app/build-app.js:3154`; translation cache keys and values are handled at `assets/js/app/build-app.js:5355`-`assets/js/app/build-app.js:5390`; cache clearing removes `vt_tc::`, `vt_tr::`, and `::partial` keys at `assets/js/app/build-app.js:8981`-`assets/js/app/build-app.js:8985`. There is no TTL; invalidation is manual or key-based.

## Data Integrity Risks
1. API keys are stored in browser localStorage (`README.md:36`-`README.md:40`, `assets/js/app/build-app.js:5163`-`assets/js/app/build-app.js:5165`).
2. Workspace import accepts any parseable JSON and writes it before restore (`assets/js/app/build-app.js:8968`-`assets/js/app/build-app.js:8972`).
3. Many direct `localStorage.setItem()` writes bypass `safeLocalStorageSet()` quota handling, including cache writes at `assets/js/app/build-app.js:5378` and `assets/js/app/build-app.js:6444`.
4. Translation target changes reset `segmentResults` and stats at `assets/js/app/build-app.js:8902`-`assets/js/app/build-app.js:8908`.
5. Uploaded file binary data is not persisted in workspace; only `fileHash` and `audioDurationSec` are saved at `assets/js/app/build-app.js:9572`-`assets/js/app/build-app.js:9574`.

## File/Object Storage
Selected media is held as `state.uploadedFile` at `assets/js/app/build-app.js:8777`, object URLs are created at `assets/js/app/build-app.js:8786`-`assets/js/app/build-app.js:8789`, and revoked on replacement/removal at `assets/js/app/build-app.js:8778` and `assets/js/app/build-app.js:8805`-`assets/js/app/build-app.js:8809`. Downloads use transient object URLs at `assets/js/app/build-app.js:4451`-`assets/js/app/build-app.js:4457`. Gemini remote file upload occurs at `assets/js/app/build-app.js:7835`-`assets/js/app/build-app.js:7878`.

## Storage Evidence Index
| Location | Storage Evidence |
|---|---|
| assets/js/app/build-app.js:141 | Stored only in your browser's localStorage. Never hardcode real keys inside the HTML when sharing this file.<br> |
| assets/js/app/build-app.js:1028 | localStorage.setItem(key, value); |
| assets/js/app/build-app.js:1041 | captureSource: localStorage.getItem('vt_capture_source') \|\| 'mic', |
| assets/js/app/build-app.js:1042 | sidebarWidth: Math.min(360, Math.max(240, Number(localStorage.getItem('vt_sidebar_width') \|\| 280))) \|\| 280, |
| assets/js/app/build-app.js:1043 | sidebarCollapsed: localStorage.getItem('vt_sidebar_collapsed') === '1', |
| assets/js/app/build-app.js:1045 | workspaceView: localStorage.getItem('vt_workspace_view') \|\| 'record', |
| assets/js/app/build-app.js:1083 | apiProvider: localStorage.getItem('vt_provider') \|\| 'groq', |
| assets/js/app/build-app.js:1084 | apiKey: localStorage.getItem('vt_api_key') \|\| '', |
| assets/js/app/build-app.js:1086 | audioModel: localStorage.getItem('vt_audio_model') \|\| '', |
| assets/js/app/build-app.js:1087 | chatModel: localStorage.getItem('vt_chat_model') \|\| '', |
| assets/js/app/build-app.js:1089 | try { return normalizeProviderKeyStore(JSON.parse(localStorage.getItem('vt_provider_keys') \|\| '{}')); } |
| assets/js/app/build-app.js:1092 | preset: localStorage.getItem('vt_preset') \|\| 'dictation', |
| assets/js/app/build-app.js:1093 | glossaryRaw: localStorage.getItem('vt_glossary') \|\| 'hpcl => HPCL\nn8n => n8n\nqdrant => Qdrant', |
| assets/js/app/build-app.js:1094 | memoryRaw: localStorage.getItem('vt_memory_raw') \|\| '', |
| assets/js/app/build-app.js:1095 | memoryImportedAt: localStorage.getItem('vt_memory_imported_at') \|\| '', |
| assets/js/app/build-app.js:1098 | const saved = JSON.parse(localStorage.getItem('vt_memory_packs') \|\| '[]'); |
| assets/js/app/build-app.js:1104 | activeMemoryPackId: localStorage.getItem('vt_memory_pack_active') \|\| '', |
| assets/js/app/build-app.js:1105 | outputStyle: localStorage.getItem('vt_output_style') \|\| 'default', |
| assets/js/app/build-app.js:1106 | geminiAnalysisModel: localStorage.getItem('vt_gemini_analysis_model') \|\| '', |
| assets/js/app/build-app.js:1108 | try { return JSON.parse(localStorage.getItem('vt_gemini_usage') \|\| '{}') \|\| {}; } |
| assets/js/app/build-app.js:1111 | autosaveEnabled: localStorage.getItem('vt_autosave') !== '0', |
| assets/js/app/build-app.js:1112 | speakerMode: localStorage.getItem('vt_speaker_mode') === '1', |
| assets/js/app/build-app.js:1117 | enabled: localStorage.getItem('vt_translation_enabled') === '1', |
| assets/js/app/build-app.js:1118 | targetLanguage: localStorage.getItem('vt_translation_target') \|\| 'en' |
| assets/js/app/build-app.js:1121 | aiOutput: sessionStorage.getItem('vt_ai_output') \|\| '', |
| assets/js/app/build-app.js:1124 | try { return JSON.parse(sessionStorage.getItem('vt_diag') \|\| '{}'); } |
| assets/js/app/build-app.js:1135 | model: localStorage.getItem('vt_assistant_model') \|\| '', |
| assets/js/app/build-app.js:1136 | draft: sessionStorage.getItem('vt_assistant_draft') \|\| '', |
| assets/js/app/build-app.js:1138 | currentConversationId: localStorage.getItem('vt_assistant_current') \|\| '', |
| assets/js/app/build-app.js:1141 | const saved = JSON.parse(localStorage.getItem('vt_assistant_conversations') \|\| '[]'); |
| assets/js/app/build-app.js:1149 | const saved = JSON.parse(localStorage.getItem('vt_assistant_thread') \|\| '[]'); |
| assets/js/app/build-app.js:1157 | return JSON.parse(localStorage.getItem('vt_assistant_ui') \|\| '{}') \|\| {}; |
| assets/js/app/build-app.js:1164 | copyHistory: JSON.parse(sessionStorage.getItem('vt_history') \|\| '[]'), |
| assets/js/app/build-app.js:1165 | undoBuffer: sessionStorage.getItem('vt_undo') \|\| '', |
| assets/js/app/build-app.js:1177 | try { return JSON.parse(sessionStorage.getItem('vt_correction_cache') \|\| '{}') \|\| {}; } |
| assets/js/app/build-app.js:1205 | const WORKSPACE_STORAGE_KEY = 'vt_workspace_v3'; |
| assets/js/app/build-app.js:1206 | const LEGACY_WORKSPACE_STORAGE_KEY = 'vt_workspace_v2'; |
| assets/js/app/build-app.js:1571 | Stored only in your browser localStorage. Keep shared copies of this HTML free of real keys.<br> |
| assets/js/app/build-app.js:1899 | if (persist) localStorage.setItem('vt_workspace_view', state.workspaceView); |
| assets/js/app/build-app.js:2014 | safeLocalStorageSet('vt_sidebar_collapsed', state.sidebarCollapsed ? '1' : '0'); |
| assets/js/app/build-app.js:2026 | localStorage.setItem('vt_sidebar_width', '220'); |
| assets/js/app/build-app.js:2284 | localStorage.setItem('vt_memory_packs', JSON.stringify(state.memoryPacks \|\| [])); |
| assets/js/app/build-app.js:2285 | localStorage.setItem('vt_memory_pack_active', state.activeMemoryPackId \|\| ''); |
| assets/js/app/build-app.js:2286 | localStorage.setItem('vt_memory_raw', state.memoryRaw \|\| ''); |
| assets/js/app/build-app.js:2287 | localStorage.setItem('vt_memory_imported_at', state.memoryImportedAt \|\| ''); |
| assets/js/app/build-app.js:2288 | localStorage.setItem('vt_output_style', state.outputStyle \|\| 'default'); |
| assets/js/app/build-app.js:2433 | localStorage.setItem('vt_memory_raw', state.memoryRaw \|\| ''); |
| assets/js/app/build-app.js:2434 | localStorage.setItem('vt_memory_imported_at', state.memoryImportedAt \|\| ''); |
| assets/js/app/build-app.js:2569 | localStorage.setItem('vt_capture_source', state.captureSource); |
| assets/js/app/build-app.js:4174 | sessionStorage.setItem('vt_ai_output', aiOutput?.value \|\| ''); |
| assets/js/app/build-app.js:4309 | sessionStorage.setItem('vt_undo', text); |
| assets/js/app/build-app.js:4320 | sessionStorage.setItem('vt_history', JSON.stringify(state.copyHistory)); |
| assets/js/app/build-app.js:4875 | localStorage.setItem('vt_gemini_usage', JSON.stringify(state.geminiUsage \|\| {})); |
| assets/js/app/build-app.js:5014 | localStorage.setItem('vt_assistant_model', state.assistant.model); |
| assets/js/app/build-app.js:5037 | localStorage.setItem('vt_assistant_model', state.assistant.model); |
| assets/js/app/build-app.js:5052 | localStorage.setItem('vt_gemini_analysis_model', active); |
| assets/js/app/build-app.js:5111 | localStorage.setItem('vt_chat_model', state.chatModel); |
| assets/js/app/build-app.js:5165 | localStorage.setItem('vt_provider_keys', JSON.stringify(state.providerKeys \|\| { groq: [], openai: [], gemini: [] })); |
| assets/js/app/build-app.js:5253 | sessionStorage.setItem('vt_correction_cache', JSON.stringify(state.correctionCache \|\| {})); |
| assets/js/app/build-app.js:5351 | localStorage.setItem('vt_translation_enabled', state.translation.enabled ? '1' : '0'); |
| assets/js/app/build-app.js:5352 | localStorage.setItem('vt_translation_target', state.translation.targetLanguage \|\| 'en'); |
| assets/js/app/build-app.js:5356 | return `vt_tr::${provider \|\| 'provider'}::${model \|\| 'model'}::${targetLanguage \|\| 'en'}::${hashPlainText(sourceText \|\| '')}`; |
| assets/js/app/build-app.js:5370 | const raw = safeJsonParse(localStorage.getItem(translationCacheKey(sourceText, targetLanguage, provider, model)) \|\| '', null); |
| assets/js/app/build-app.js:5378 | localStorage.setItem( |
| assets/js/app/build-app.js:6419 | safeLocalStorageSet(WORKSPACE_STORAGE_KEY, serialized); |
| assets/js/app/build-app.js:6441 | function transcriptCacheKey(key) { return `vt_tc::${key}`; } |
| assets/js/app/build-app.js:6443 | function readTranscriptCache(key) { return safeJsonParse(localStorage.getItem(transcriptCacheKey(key)) \|\| '', null); } |
| assets/js/app/build-app.js:6444 | function saveTranscriptCache(key, payload) { localStorage.setItem(transcriptCacheKey(key), JSON.stringify(payload)); } |
| assets/js/app/build-app.js:6445 | function readPartialProgress(key) { return safeJsonParse(localStorage.getItem(partialKey(key)) \|\| '', null); } |
| assets/js/app/build-app.js:6446 | function savePartialProgress(key, payload) { localStorage.setItem(partialKey(key), JSON.stringify(payload)); } |
| assets/js/app/build-app.js:6447 | function clearPartialProgress(key) { localStorage.removeItem(partialKey(key)); } |
| assets/js/app/build-app.js:6482 | localStorage.setItem('vt_api_key', apiKey); |
| assets/js/app/build-app.js:6582 | sessionStorage.setItem('vt_ai_output', state.aiOutput); |
| assets/js/app/build-app.js:6661 | sessionStorage.setItem('vt_ai_output', state.aiOutput); |
| assets/js/app/build-app.js:6950 | localStorage.setItem('vt_assistant_conversations', JSON.stringify(serialized)); |
| assets/js/app/build-app.js:6951 | localStorage.setItem('vt_assistant_current', state.assistant.currentConversationId \|\| ''); |
| assets/js/app/build-app.js:6957 | localStorage.setItem('vt_assistant_thread', JSON.stringify((state.assistant.messages \|\| []).map(msg => cloneAssistantMessage(msg)))); |
| assets/js/app/build-app.js:6989 | localStorage.setItem('vt_assistant_thread', JSON.stringify((state.assistant.messages \|\| []).map(msg => cloneAssistantMessage(msg)))); |
| assets/js/app/build-app.js:6994 | localStorage.setItem('vt_assistant_ui', JSON.stringify({ |
| assets/js/app/build-app.js:7042 | sessionStorage.setItem('vt_assistant_draft', value); |
| assets/js/app/build-app.js:8459 | sessionStorage.removeItem('vt_history'); |
| assets/js/app/build-app.js:8521 | localStorage.setItem('vt_provider', apiProvider.value); |
| assets/js/app/build-app.js:8525 | localStorage.setItem('vt_audio_model', state.audioModel); |
| assets/js/app/build-app.js:8535 | localStorage.setItem('vt_api_key', state.apiKey); |
| assets/js/app/build-app.js:8549 | safeLocalStorageSet('vt_api_key', state.apiKey); |
| assets/js/app/build-app.js:8603 | localStorage.setItem('vt_gemini_analysis_model', state.geminiAnalysisModel); |
| assets/js/app/build-app.js:8636 | localStorage.setItem('vt_audio_model', state.audioModel); |
| assets/js/app/build-app.js:8709 | localStorage.setItem('vt_output_style', state.outputStyle); |
| assets/js/app/build-app.js:8731 | localStorage.setItem('vt_glossary', state.glossaryRaw); |
| assets/js/app/build-app.js:8833 | localStorage.setItem('vt_preset', state.preset); |
| assets/js/app/build-app.js:8868 | localStorage.setItem('vt_speaker_mode', state.speakerMode ? '1' : '0'); |
| assets/js/app/build-app.js:8875 | safeLocalStorageSet('vt_autosave', state.autosaveEnabled ? '1' : '0'); |
| assets/js/app/build-app.js:8971 | localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(parsed)); |
| assets/js/app/build-app.js:8982 | Object.keys(localStorage).filter(k => k.startsWith('vt_tc::')).forEach(k => localStorage.removeItem(k)); |
| assets/js/app/build-app.js:8983 | Object.keys(localStorage).filter(k => k.startsWith('vt_tr::')).forEach(k => localStorage.removeItem(k)); |
| assets/js/app/build-app.js:8984 | Object.keys(localStorage).filter(k => k.includes('::partial')).forEach(k => localStorage.removeItem(k)); |
| assets/js/app/build-app.js:9057 | sessionStorage.setItem('vt_ai_output', ''); |
| assets/js/app/build-app.js:9162 | sessionStorage.setItem('vt_ai_output', state.aiOutput); |
| assets/js/app/build-app.js:9175 | sessionStorage.setItem('vt_ai_output', aiOutput.value); |
| assets/js/app/build-app.js:9224 | sessionStorage.setItem('vt_diag', JSON.stringify(state.diagnostics)); |
| assets/js/app/build-app.js:9592 | const payload = safeJsonParse(localStorage.getItem(WORKSPACE_STORAGE_KEY) \|\| '', null) |
| assets/js/app/build-app.js:9593 | \|\| safeJsonParse(localStorage.getItem(LEGACY_WORKSPACE_STORAGE_KEY) \|\| '', null); |
