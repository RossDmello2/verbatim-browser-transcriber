# SA-3: Frontend Report
Generated: 2026-05-16T21:09:03

## UI Architecture
The browser shell is minimal: `index.html:10`-`index.html:16` links CSS, `index.html:17`-`index.html:19` provide toast/page/mainContent containers, and `index.html:22` loads the module runtime. `assets/js/app/build-app.js:15` injects the application DOM with `mainContent.innerHTML`. Capability gating is performed before app build by `assets/js/main.js:3`-`assets/js/main.js:7`.

## Component/Page Inventory
| Name | File:Line | Purpose | Data Dependencies | Actions |
|---|---|---|---|---|
| API Configuration | `assets/js/app/build-app.js:26` | provider/key/model setup | localStorage provider keys/models | save/test/toggle provider keys |
| Topbar | `assets/js/app/build-app.js:206` | mode/language/translation controls | state.mode/state.translation | mode switch, language switch |
| Workspace Sidebar | `assets/js/app/build-app.js:345` | navigation among views | state.workspaceView | navigateToWorkspaceView |
| Capture View | `assets/js/app/build-app.js:418` | capture source/help/orb | runtimeCapabilities/state.captureSource | start/stop recording |
| Transcript View | `assets/js/app/build-app.js:609` | raw transcript and segments | state.segments/transcript textarea | edit, copy, history, rebuild |
| Translation View | `assets/js/app/build-app.js:647` | translated transcript and sentiment | state.translation | target change, render translations |
| Memory View | `assets/js/app/build-app.js:667` | memory packs and glossary | localStorage memory keys | import/create/delete packs |
| Export View | `assets/js/app/build-app.js:818` | download formats | transcript/state/workspace | download TXT/DOCX/SRT/VTT/JSON/MD/CSV |
| Diagnostics | `assets/js/app/build-app.js:747` | runtime status and logs | state.diagnostics | toggle/render diagnostics |
| Assistant | `assets/js/app/build-app.js:898` | floating chat assistant | state.assistant/provider keys | chat, attach, voice, history |

## State Management Map
State is centralized in the in-memory `state` object at `assets/js/app/build-app.js:1039`. Persistent browser keys are documented at `assets/js/app/state.js:6`-`assets/js/app/state.js:31`, session keys at `assets/js/app/state.js:34`-`assets/js/app/state.js:40`, and state domains at `assets/js/app/state.js:43`-`assets/js/app/state.js:51`.
| Location | Storage/State Evidence |
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

## API Call Inventory
| File:Line | Endpoint | Auth Headers | Error Handling | Loading State |
|---|---|---|---|---|
| `assets/js/app/build-app.js:5143`-`5147` | Groq/OpenAI audio transcription/translation | Bearer via `assets/js/app/build-app.js:6474` | provider retry at `assets/js/app/build-app.js:6503`-`6515` | transcribe button/progress |
| `assets/js/app/build-app.js:5149`-`5153` | Groq/OpenAI chat completions | Bearer via `assets/js/app/build-app.js:6474` | context errors at `assets/js/app/build-app.js:6587`-`6597` | AI/assistant busy flags |
| `assets/js/app/build-app.js:5155`-`5157` | Gemini generateContent | `x-goog-api-key` at `assets/js/app/build-app.js:7963` | provider errors at `assets/js/app/build-app.js:7979`-`7983` | assistant thinking state |
| `assets/js/app/build-app.js:5159`-`5160` | Gemini file upload | `x-goog-api-key` and upload headers at `assets/js/app/build-app.js:7837`-`7864` | upload errors at `assets/js/app/build-app.js:7853` and `7870` | attachment preparation |

## Client-Side Route Map
URL routing is NOT PRESENT. Workspace sections are DOM views created by `buildWorkspaceViews()` at `assets/js/app/build-app.js:1641`-`assets/js/app/build-app.js:1676`; `syncWorkspaceViewUi()` toggles hidden/active state at `assets/js/app/build-app.js:1773`-`assets/js/app/build-app.js:1784`; navigation persists `vt_workspace_view` at `assets/js/app/build-app.js:1896`-`assets/js/app/build-app.js:1899`.

## Form Analysis
HTML `<form>` submission is NOT PRESENT; all user input is event-listener driven. Key inputs include password API key fields at `assets/js/app/build-app.js:38` and `assets/js/app/build-app.js:47`, media upload at `assets/js/app/build-app.js:530`, transcript textarea at `assets/js/app/build-app.js:619`, memory textarea at `assets/js/app/build-app.js:681`, workspace JSON import at `assets/js/app/build-app.js:735`, assistant input and attachment input at `assets/js/app/build-app.js:951` and `assets/js/app/build-app.js:968`.

## UI Bugs Found
1. `assets/css/00-fonts.css:1` loads Google Fonts via `@import`; this is valid CSS but creates an external font dependency with no local fallback beyond the CSS font-family stack. Severity: LOW availability/privacy consideration.
2. `index.html:5` disables user scaling (`maximum-scale=1.0, user-scalable=no`), which is an accessibility risk. Severity: MEDIUM.
3. API keys are browser-stored (`assets/js/app/build-app.js:1084`, `assets/js/app/build-app.js:5165`, `assets/js/app/build-app.js:8549`), which is unsafe on shared profiles. Severity: HIGH.
4. Assistant and rendered list surfaces use `innerHTML`, including assistant message insertion at `assets/js/app/build-app.js:7431`; escaping helpers reduce risk but this is a high-sensitivity rendering surface. Severity: MEDIUM.
5. The app relies heavily on override CSS: base `.page` styling at `assets/css/10-core.css:73` is later overwritten by app-like layout in `assets/css/40-overrides.css:5985`-`assets/css/40-overrides.css:6000`, increasing regression risk. Severity: LOW/MEDIUM.

## Accessibility and UX Correctness
Positive: help modal uses dialog semantics at `assets/js/app/build-app.js:152`, sidebar/menu buttons have ARIA attributes at `assets/js/app/build-app.js:209` and `assets/js/app/build-app.js:227`, capture orb has role/button semantics at `assets/js/app/build-app.js:577`, and active nav updates `aria-pressed` at `assets/js/app/build-app.js:1783`. Risk: keyboard shortcuts override browser defaults at `assets/js/app/build-app.js:9690`, `assets/js/app/build-app.js:9701`, and `assets/js/app/build-app.js:9731`.

## DOM Rendering Evidence
| Location | DOM Rendering Evidence |
|---|---|
| assets/js/app/build-app.js:15 | mainContent.innerHTML = ` |
| assets/js/app/build-app.js:1562 | if (apiProvider?.options?.[0]) apiProvider.options[0].textContent = 'Groq - whisper-large-v3-turbo recommended'; |
| assets/js/app/build-app.js:1563 | if (apiProvider?.options?.[1]) apiProvider.options[1].textContent = 'OpenAI - whisper-1 secondary fallback'; |
| assets/js/app/build-app.js:1570 | apiNote.innerHTML = ` |
| assets/js/app/build-app.js:1587 | apiKeyToggleBtn.textContent = showing ? 'Hide' : 'Show'; |
| assets/js/app/build-app.js:1595 | geminiKeyToggleBtn.textContent = showing ? 'Hide' : 'Show'; |
| assets/js/app/build-app.js:1649 | section.innerHTML = ` |
| assets/js/app/build-app.js:1693 | captureLiveSplit.innerHTML = ` |
| assets/js/app/build-app.js:1735 | transcriptViewBar.innerHTML = ` |
| assets/js/app/build-app.js:1826 | el.textContent = formatter(nextValue); |
| assets/js/app/build-app.js:1839 | el.textContent = formatter(value); |
| assets/js/app/build-app.js:1867 | iconWrap.innerHTML = lucideIconMarkup(btn.dataset.view \|\| 'transcript'); |
| assets/js/app/build-app.js:1984 | workspaceSidebarBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="4"  |
| assets/js/app/build-app.js:1992 | if (sidebarWidthMeta) sidebarWidthMeta.textContent = `${width}px width`; |
| assets/js/app/build-app.js:1994 | sidebarCollapseBtn.textContent = isCompactSidebarViewport() |
| assets/js/app/build-app.js:2127 | interimEl.textContent = ''; |
| assets/js/app/build-app.js:2421 | memoryStatusChip.textContent = imported |
| assets/js/app/build-app.js:2426 | memoryMeta.textContent = imported |
| assets/js/app/build-app.js:2486 | captureHelpTip.textContent = `Current source: ${getCaptureSourceLabel()}`; |
| assets/js/app/build-app.js:2487 | captureHelpCopy.innerHTML = cards.map(card => `<div class="capture-help-card"><h4>${card.title}</h4><p>${card.body}</p></div>`).join(''); |
| assets/js/app/build-app.js:2507 | captureOrbStatus.textContent = getCaptureStatusLabel(); |
| assets/js/app/build-app.js:2518 | captureOrbStatus.textContent = normalizeUiText(getReadyStatusForCurrentState(state.mode, state.captureSource).main); |
| assets/js/app/build-app.js:2532 | captureInterimEl.textContent = interimEl?.textContent \|\| ''; |
| assets/js/app/build-app.js:2540 | captureSourceSelect.options[1].textContent = runtimeCapabilities.supportsTabOrScreenCapture ? 'Browser tab audio' : 'Browser tab audio (Desktop Chrome/Edge)'; |
| assets/js/app/build-app.js:2544 | captureSourceSelect.options[2].textContent = runtimeCapabilities.supportsTabOrScreenCapture ? 'Screen + system audio' : 'Screen + system audio (Desktop Chrome/Edge)'; |
| assets/js/app/build-app.js:2546 | if (captureCapabilityNote) captureCapabilityNote.textContent = getCaptureCapabilitySummary(); |
| assets/js/app/build-app.js:2678 | interimEl.textContent = interim; |
| assets/js/app/build-app.js:3034 | detectedLangBadge.textContent = normalized.toUpperCase(); |
| assets/js/app/build-app.js:3065 | apiStatusLabel.textContent = 'Connected'; |
| assets/js/app/build-app.js:3071 | apiStatusLabel.textContent = 'Error'; |
| assets/js/app/build-app.js:3100 | btn.textContent = 'Ready'; |
| assets/js/app/build-app.js:3101 | setTimeout(() => { btn.classList.remove('saved'); btn.textContent = 'Test'; }, 1500); |
| assets/js/app/build-app.js:3327 | transcribeBtn.innerHTML = '<span>Processing...</span>'; |
| assets/js/app/build-app.js:3459 | transcribeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="roun |
| assets/js/app/build-app.js:3467 | segView.innerHTML = ''; |
| assets/js/app/build-app.js:3663 | progressLabel.querySelector('span') ? progressLabel.querySelector('span').textContent = label : (progressLabel.childNodes[0].textContent = label); |
| assets/js/app/build-app.js:3684 | audioAnalysisEl.innerHTML = ` |
| assets/js/app/build-app.js:3904 | durStat.textContent = fmtTime(Date.now() - state.sessionStart) + ' duration'; |
| assets/js/app/build-app.js:3910 | timerEl.textContent = fmtTime(Date.now() - state.sessionStart); |
| assets/js/app/build-app.js:3911 | if (orbTimerDisplay) orbTimerDisplay.textContent = timerEl.textContent; |
| assets/js/app/build-app.js:3912 | if (captureOrbTimerDisplay) captureOrbTimerDisplay.textContent = timerEl.textContent; |
| assets/js/app/build-app.js:3913 | if (captureTimerDisplay) captureTimerDisplay.textContent = timerEl.textContent; |
| assets/js/app/build-app.js:3957 | interimEl.textContent = ''; |
| assets/js/app/build-app.js:3992 | statusSub.textContent = state.liveHealth.mode === 'recovering' |
| assets/js/app/build-app.js:4008 | if (state.isRecording) statusSub.textContent = state.mode === 'quality' ? 'Speak now - tap the orb or press Space to stop' : 'Speak now - tap the orb or press Space to st |
| assets/js/app/build-app.js:4142 | segView.innerHTML = ''; |
| assets/js/app/build-app.js:4143 | segCount.textContent = '0 segments'; |
| assets/js/app/build-app.js:4144 | durStat.textContent = '0:00 duration'; |
| assets/js/app/build-app.js:4145 | timerEl.textContent = '00:00'; |
| assets/js/app/build-app.js:4146 | if (orbTimerDisplay) orbTimerDisplay.textContent = '00:00'; |
| assets/js/app/build-app.js:4147 | if (captureOrbTimerDisplay) captureOrbTimerDisplay.textContent = '00:00'; |
| assets/js/app/build-app.js:4148 | if (captureTimerDisplay) captureTimerDisplay.textContent = '00:00'; |
| assets/js/app/build-app.js:4194 | if (recText) recText.textContent = isRec ? 'Recording' : (state.isProcessing ? 'Processing' : 'Idle'); |
| assets/js/app/build-app.js:4206 | sbLang.textContent = lang === '-' ? '-' : 'Lang: ' + lang; |
| assets/js/app/build-app.js:4212 | sbMode.innerHTML = '<strong>' + (modeMap[state.mode] \|\| 'LIVE') + '</strong>'; |
| assets/js/app/build-app.js:4221 | sbAutosave.textContent = autosaveOn ? (state.isProcessing ? 'Saving...' : 'Autosave on') : 'Autosave off'; |
| assets/js/app/build-app.js:4259 | statusMain.textContent = normalizeUiText(main); |
| assets/js/app/build-app.js:4260 | statusSub.textContent = normalizeUiText(sub); |
| assets/js/app/build-app.js:4261 | if (orbStatusMain) orbStatusMain.textContent = normalizeUiText(main); |
| assets/js/app/build-app.js:4262 | if (captureOrbStatus && !state.isRecording) captureOrbStatus.textContent = normalizeUiText(main); |
| assets/js/app/build-app.js:4263 | if (captureStatusMain) captureStatusMain.textContent = normalizeUiText(main); |
| assets/js/app/build-app.js:4264 | if (captureStatusSub) captureStatusSub.textContent = normalizeUiText(sub); |
| assets/js/app/build-app.js:4274 | el.textContent = normalizeUiText(msg); |
| assets/js/app/build-app.js:4326 | historyList.innerHTML = '<div class="history-empty">No history yet - copied text will appear here</div>'; |
| assets/js/app/build-app.js:4329 | historyList.innerHTML = state.copyHistory.map((item, i) => ` |
| assets/js/app/build-app.js:4477 | topDownloadBtn.innerHTML = ` |
| assets/js/app/build-app.js:4492 | button.textContent = 'Download'; |
| assets/js/app/build-app.js:4637 | transcribeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8  |
| assets/js/app/build-app.js:4639 | transcribeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="roun |
| assets/js/app/build-app.js:4934 | if (geminiUsageTitle) geminiUsageTitle.textContent = `${quota.label} usage`; |
| assets/js/app/build-app.js:4935 | if (geminiUsageMinuteText) geminiUsageMinuteText.textContent = `${minuteUsed} / ${minuteLimit} used \| ${Math.max(0, minuteLimit - minuteUsed)} left`; |
| assets/js/app/build-app.js:4936 | if (geminiUsageDayText) geminiUsageDayText.textContent = `${dayUsed} / ${dayLimit} used \| ${Math.max(0, dayLimit - dayUsed)} left`; |
| assets/js/app/build-app.js:4939 | if (geminiUsageNote) geminiUsageNote.textContent = 'Tracked from this app only. External Gemini usage is not included.'; |
| assets/js/app/build-app.js:5033 | if (assistantModelSelect) assistantModelSelect.innerHTML = optionMarkup; |
| assets/js/app/build-app.js:5053 | if (geminiModelSelect) geminiModelSelect.innerHTML = optionMarkup; |
| assets/js/app/build-app.js:5099 | if (chatModelSelect) chatModelSelect.innerHTML = optionMarkup; |
| assets/js/app/build-app.js:5101 | chatModelSuggestions.innerHTML = catalog |
| assets/js/app/build-app.js:5171 | element.textContent = count ? `${count} key${count > 1 ? 's' : ''} stored for ${provider}` : `No keys stored for ${provider}`; |
| assets/js/app/build-app.js:5180 | cacheStatus.textContent = message \|\| 'Cache idle'; |
| assets/js/app/build-app.js:5183 | function escapeHtml(v) { |

## Event Binding Evidence
| Location | Event Evidence |
|---|---|
| assets/js/app/build-app.js:2645 | recognition.onresult = (e) => { |
| assets/js/app/build-app.js:2695 | recognition.onerror = (e) => { |
| assets/js/app/build-app.js:2721 | recognition.onend = () => { |
| assets/js/app/build-app.js:2741 | assistantRecognition.onresult = (e) => { |
| assets/js/app/build-app.js:2760 | assistantRecognition.onend = () => { |
| assets/js/app/build-app.js:2765 | assistantRecognition.onerror = (e) => { |
| assets/js/app/build-app.js:4245 | $('btnRaw').addEventListener('click', () => switchView('raw')); |
| assets/js/app/build-app.js:4246 | $('btnSeg').addEventListener('click', () => switchView('segments')); |
| assets/js/app/build-app.js:4252 | btn.addEventListener('click', () => setMode(btn.dataset.mode)); |
| assets/js/app/build-app.js:4338 | btn.addEventListener('click', (e) => { |
| assets/js/app/build-app.js:6338 | editor.addEventListener('input', () => { |
| assets/js/app/build-app.js:6345 | wrap.querySelector('[data-act="speaker"]').addEventListener('change', (e) => { |
| assets/js/app/build-app.js:6349 | wrap.querySelector('[data-act="seek"]').addEventListener('click', () => { |
| assets/js/app/build-app.js:6357 | wrap.querySelector('[data-act="lock"]').addEventListener('click', () => { |
| assets/js/app/build-app.js:6362 | wrap.querySelector('[data-act="split"]').addEventListener('click', () => { |
| assets/js/app/build-app.js:6379 | wrap.querySelector('[data-act="merge-up"]').addEventListener('click', () => { |
| assets/js/app/build-app.js:6389 | wrap.querySelector('[data-act="delete"]').addEventListener('click', () => { |
| assets/js/app/build-app.js:7703 | reader.onerror = () => reject(new Error('Could not read the selected file.')); |
| assets/js/app/build-app.js:7712 | reader.onerror = () => reject(new Error('Could not read the selected text file.')); |
| assets/js/app/build-app.js:7725 | image.onerror = () => { |
| assets/js/app/build-app.js:8088 | micBtn?.addEventListener('click', toggleRecordingFromUi); |
| assets/js/app/build-app.js:8089 | orbTrigger?.addEventListener('click', (e) => { |
| assets/js/app/build-app.js:8092 | orbTrigger?.addEventListener('keydown', (e) => { |
| assets/js/app/build-app.js:8098 | captureOrbStage?.addEventListener('click', () => { |
| assets/js/app/build-app.js:8101 | captureOrbStage?.addEventListener('keydown', (e) => { |
| assets/js/app/build-app.js:8108 | assistantLauncher?.addEventListener('click', () => { |
| assets/js/app/build-app.js:8112 | assistantLauncher?.addEventListener('mousemove', (e) => { |
| assets/js/app/build-app.js:8120 | assistantLauncher?.addEventListener('mouseleave', () => { |
| assets/js/app/build-app.js:8149 | document.addEventListener('mousemove', (e) => updateRobot(e.clientX, e.clientY)); |
| assets/js/app/build-app.js:8151 | document.addEventListener('touchmove', (e) => { |
| assets/js/app/build-app.js:8161 | assistantInput?.addEventListener('input', () => { |
| assets/js/app/build-app.js:8165 | assistantInput?.addEventListener('keydown', (e) => { |
| assets/js/app/build-app.js:8171 | assistantMessages?.addEventListener('click', (e) => { |
| assets/js/app/build-app.js:8185 | assistantInputWrap?.addEventListener(evt, (e) => { |
| assets/js/app/build-app.js:8192 | assistantInputWrap?.addEventListener(evt, () => { |
| assets/js/app/build-app.js:8196 | assistantInputWrap?.addEventListener('drop', (e) => { |
| assets/js/app/build-app.js:8202 | assistantInput?.addEventListener('paste', (e) => { |
| assets/js/app/build-app.js:8214 | assistantSend?.addEventListener('click', submitAssistantDraft); |
| assets/js/app/build-app.js:8215 | assistantAttachBtn?.addEventListener('click', () => { |
| assets/js/app/build-app.js:8223 | assistantAttachBtn?.addEventListener(evt, (e) => { |
| assets/js/app/build-app.js:8230 | assistantAttachBtn?.addEventListener(evt, () => { |
| assets/js/app/build-app.js:8234 | assistantAttachBtn?.addEventListener('drop', (e) => { |
| assets/js/app/build-app.js:8240 | assistantFileInput?.addEventListener('change', () => { |
| assets/js/app/build-app.js:8244 | assistantAttachmentRemove?.addEventListener('click', () => { |
| assets/js/app/build-app.js:8248 | assistantMicBtn?.addEventListener('click', () => { |
| assets/js/app/build-app.js:8256 | assistantHistoryBtn?.addEventListener('click', () => { |
| assets/js/app/build-app.js:8267 | assistantQuickNewBtn?.addEventListener('click', () => { |
| assets/js/app/build-app.js:8272 | assistantNewChatBtn?.addEventListener('click', () => { |
| assets/js/app/build-app.js:8277 | assistantHistoryList?.addEventListener('click', (e) => { |
| assets/js/app/build-app.js:8290 | assistantMinBtn?.addEventListener('click', () => setAssistantOpen(false)); |
| assets/js/app/build-app.js:8291 | assistantMaxBtn?.addEventListener('click', () => toggleAssistantMaximized()); |
| assets/js/app/build-app.js:8292 | assistantCloseBtn?.addEventListener('click', () => setAssistantOpen(false)); |
| assets/js/app/build-app.js:8293 | assistantClearBtn?.addEventListener('click', () => { |
| assets/js/app/build-app.js:8300 | assistantCopyLastBtn?.addEventListener('click', () => { |
| assets/js/app/build-app.js:8323 | btn.addEventListener('click', () => { |
| assets/js/app/build-app.js:8335 | langSelect.addEventListener('change', () => { |
| assets/js/app/build-app.js:8346 | punctBtn.addEventListener('click', () => { |
| assets/js/app/build-app.js:8353 | autoCopyBtn.addEventListener('click', () => { |
| assets/js/app/build-app.js:8367 | input.addEventListener('change', () => { |
| assets/js/app/build-app.js:8377 | $('copyBtn').addEventListener('click', () => { |
| assets/js/app/build-app.js:8391 | topDownloadBtn?.addEventListener('click', (e) => { |
| assets/js/app/build-app.js:8405 | topDownloadMenu?.addEventListener('click', (e) => { |
| assets/js/app/build-app.js:8409 | topDownloadDropdown?.addEventListener('click', (e) => { |
| assets/js/app/build-app.js:8419 | button.addEventListener('click', () => { |
| assets/js/app/build-app.js:8435 | document.addEventListener('click', () => { |
| assets/js/app/build-app.js:8441 | $('clearBtn').addEventListener('click', () => { |
| assets/js/app/build-app.js:8450 | historyBtn.addEventListener('click', () => { |
| assets/js/app/build-app.js:8457 | $('historyClearBtn').addEventListener('click', () => { |
| assets/js/app/build-app.js:8465 | transcript.addEventListener('input', () => { |
| assets/js/app/build-app.js:8474 | apiHeader.addEventListener('click', () => { |
| assets/js/app/build-app.js:8477 | helpBtn?.addEventListener('click', () => openHelpModal()); |
| assets/js/app/build-app.js:8478 | helpCloseBtn?.addEventListener('click', () => closeHelpModal()); |
| assets/js/app/build-app.js:8479 | helpModalOverlay?.addEventListener('click', (e) => { |
| assets/js/app/build-app.js:8518 | apiProvider.addEventListener('change', () => { |
| assets/js/app/build-app.js:8547 | $('apiKeySave').addEventListener('click', () => { |
| assets/js/app/build-app.js:8570 | apiKeyToggleBtn.addEventListener('click', () => { |
| assets/js/app/build-app.js:8575 | $('apiKeyTest').addEventListener('click', testApiKey); |
| assets/js/app/build-app.js:8577 | geminiKeySaveBtn?.addEventListener('click', () => { |
| assets/js/app/build-app.js:8594 | geminiKeyToggleBtn?.addEventListener('click', () => { |
| assets/js/app/build-app.js:8599 | geminiKeyTestBtn?.addEventListener('click', testGeminiKey); |
