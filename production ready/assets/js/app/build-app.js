/*
 * Preserved application core for the production submission package.
 * The live behavior still runs from this file so feature parity stays intact.
 * For a beginner-friendly map of responsibilities, start with:
 * - ../runtime/capabilities.js
 * - ./state.js
 * - ./dom.js
 * - ./events.js
 * - ../features/*.js
 */

import { SR, mainContent, runtimeCapabilities } from '../runtime/capabilities.js';
import { fetchWithTimeout, getProviderTimeoutMs, isAbortError, isRequestTimeoutError } from '../runtime/request-timeout.js';
import { DEFAULT_MAX_WORKSPACE_BYTES, WorkspaceValidationError, parseWorkspacePayload, validateWorkspacePayload } from '../runtime/workspace-validation.js';

function buildApp() {
    mainContent.innerHTML = `
    <div class="topbar-right-actions">
      <div class="api-header api-config-btn" id="apiHeader">
        <span class="api-header-title">API Configuration</span>
        <span class="api-status-label" id="apiStatusLabel">Not configured</span>
        <span class="api-status-dot api-config-dot" id="apiStatusDot"></span>
        <svg class="api-chevron api-config-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>

    <!-- API Config Panel -->
    <div class="api-panel" id="apiPanel">
      <div class="api-body">
        <div class="api-row api-field-row">
          <span class="api-label api-field-label">Provider</span>
          <select id="apiProvider" class="api-select api-provider-select">
            <option value="groq">Groq - whisper-large-v3-turbo (free)</option>
            <option value="openai">OpenAI - whisper-1</option>
          </select>
        </div>
        <div class="api-row api-field-row">
          <span class="api-label api-field-label">API Key</span>
          <div class="api-key-row">
            <input type="password" class="api-key-input" id="apiKeyInput" placeholder="Paste your API key here..." autocomplete="off" spellcheck="false">
            <button class="api-btn-sm api-key-btn" id="apiKeyToggle" title="Show API key">Show</button>
            <button class="api-btn-sm api-key-btn save" id="apiKeySave">Save</button>
            <button class="api-btn-sm api-key-btn test" id="apiKeyTest">Test</button>
            <button class="api-btn-sm api-key-btn clear" id="apiKeysClear" title="Clear saved provider keys">Clear saved keys</button>
          </div>
        </div>
        <div class="api-row api-field-row">
          <span class="api-label api-field-label">Gemini key</span>
          <div class="api-key-row">
            <input type="password" class="api-key-input" id="geminiKeyInput" placeholder="Optional for assistant image and PDF analysis" autocomplete="off" spellcheck="false">
            <button class="api-btn-sm api-key-btn" id="geminiKeyToggle" title="Show Gemini API key">Show</button>
            <button class="api-btn-sm api-key-btn save" id="geminiKeySave">Save</button>
            <button class="api-btn-sm api-key-btn test" id="geminiKeyTest">Test</button>
          </div>
        </div>
        <div class="api-row api-field-row">
          <span class="api-label api-field-label">Gemini vault</span>
          <textarea class="api-key-input api-vault-textarea" id="geminiKeyVault" rows="3" placeholder="Optional Gemini keys - one per line - used only for assistant image and PDF analysis"></textarea>
          <button class="api-btn-sm api-save-vault-btn" id="geminiVaultSave">Save vault</button>
        </div>
        <div class="api-row api-field-row api-model-row">
          <span class="api-label api-field-label">Gemini model</span>
          <div class="api-field-control api-inline-control">
            <select id="geminiModelSelect" class="api-inline-select api-select api-provider-select" aria-label="Gemini analysis model">
              <option value="">Loading Gemini models...</option>
            </select>
            <button class="api-info-btn" type="button" aria-label="Gemini free-tier model info" title="Gemini free-tier model info">i</button>
            <div class="api-info-popover" role="note" aria-label="Gemini free-tier model guide">
              <div class="api-info-title">Gemini Model Guide</div>
              <div class="api-info-sub">Free-key limits plus paid-only note for image/PDF analysis models</div>
              <table class="api-info-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>RPM</th>
                    <th>RPD</th>
                    <th>Best For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Gemini 2.5 Pro</td>
                    <td>5</td>
                    <td>100</td>
                    <td>Paid Gemini key only</td>
                  </tr>
                  <tr>
                    <td>Gemini 2.5 Flash</td>
                    <td>10</td>
                    <td>250</td>
                    <td>General use, chatbots</td>
                  </tr>
                  <tr>
                    <td>Gemini 2.5 Flash-Lite</td>
                    <td>15</td>
                    <td>1,000</td>
                    <td>Bulk tasks, simple Q&amp;A</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="api-row api-field-row">
          <span class="api-label api-field-label">Gemini usage</span>
          <div class="gemini-usage-card api-usage-box" id="geminiUsageCard">
            <div class="gemini-usage-head">
              <div class="gemini-usage-title api-usage-title" id="geminiUsageTitle">App-tracked Gemini usage</div>
              <button class="api-btn-sm api-usage-reset" id="geminiUsageReset" type="button">Reset</button>
            </div>
            <div class="gemini-usage-stat api-usage-row">
              <span>Minute window</span>
              <span id="geminiUsageMinuteText">0 / 15 used</span>
            </div>
            <div class="gemini-usage-bar api-usage-bar-track"><span class="api-usage-bar-fill" id="geminiUsageMinuteBar"></span></div>
            <div class="gemini-usage-stat api-usage-row">
              <span>Daily window</span>
              <span id="geminiUsageDayText">0 / 1000 used</span>
            </div>
            <div class="gemini-usage-bar gemini-usage-bar-day api-usage-bar-track"><span class="api-usage-bar-fill" id="geminiUsageDayBar"></span></div>
            <div class="gemini-usage-note api-usage-note" id="geminiUsageNote">Tracked from this app only. External Gemini usage is not included.</div>
          </div>
        </div>
        <div class="api-row api-field-row">
          <span class="api-label api-field-label">Audio model</span>
          <input type="text" class="api-key-input api-model-input" id="audioModelInput" placeholder="Speech model. Groq translation auto-switches to whisper-large-v3">
        </div>
        <div class="api-row api-field-row api-model-row">
          <span class="api-label api-field-label">Chat model</span>
          <div class="api-field-control api-chat-control">
            <input type="text" class="api-key-input api-model-input" id="chatModelInput" list="chatModelSuggestions" placeholder="Groq recommendation: openai/gpt-oss-120b">
            <select id="chatModelSelect" class="api-inline-select api-select api-provider-select">
              <option value="">Loading models...</option>
            </select>
          </div>
          <datalist id="chatModelSuggestions"></datalist>
        </div>
        <div class="api-row api-field-row">
          <span class="api-label api-field-label">Key vault</span>
          <textarea class="api-key-input api-vault-textarea" id="apiKeyVault" rows="4" placeholder="Optional extra API keys - one per line - stored locally only"></textarea>
          <button class="api-btn-sm api-save-vault-btn" id="apiVaultSave">Save vault</button>
        </div>
        <div class="api-note api-info-text">
          Stored only in your browser's localStorage. Never hardcode real keys inside the HTML when sharing this file.<br>
          Get a free Groq key: <a href="https://console.groq.com/keys" target="_blank">console.groq.com/keys</a> |
          OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a> |
          Gemini: <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com/app/apikey</a><br>
          <span class="api-keys-stored" id="apiVaultMeta">No extra keys saved</span><br>
          <span class="api-keys-stored" id="geminiVaultMeta">No keys stored for gemini</span>
        </div>
      </div>
    </div>

    <div class="help-modal-overlay" id="helpModalOverlay" hidden>
      <div class="help-modal" role="dialog" aria-modal="true" aria-labelledby="helpModalTitle">
        <div class="help-modal-header">
          <div class="help-modal-title">
            <span class="help-emoji">🎙️</span>
            <div>
              <div class="help-title-text" id="helpModalTitle">How to use Verbatim</div>
              <div class="help-subtitle">A quick guide for everyone</div>
            </div>
          </div>
          <button class="help-close-btn" id="helpCloseBtn" type="button" aria-label="Close help">✕</button>
        </div>
        <div class="help-modal-body">
          <div class="help-step">
            <div class="help-step-num">1</div>
            <div class="help-step-content">
              <div class="help-step-title">Choose your mode</div>
              <div class="help-step-desc">Use <strong>LIVE</strong> to transcribe your microphone in real-time. Use <strong>FILE</strong> to upload an audio or video file and transcribe it. Use <strong>QUALITY</strong> for the most accurate transcription using AI.</div>
            </div>
          </div>
          <div class="help-step">
            <div class="help-step-num">2</div>
            <div class="help-step-content">
              <div class="help-step-title">Set up your API key</div>
              <div class="help-step-desc">Click <strong>API CONFIGURATION</strong> in the top right. Get a free API key from groq.com and paste it in. This powers the AI transcription.</div>
            </div>
          </div>
          <div class="help-step">
            <div class="help-step-num">3</div>
            <div class="help-step-content">
              <div class="help-step-title">Start transcribing</div>
              <div class="help-step-desc">In LIVE mode: click the microphone orb and start speaking. In FILE mode: drag and drop your audio file, then click TRANSCRIBE and wait for results.</div>
            </div>
          </div>
          <div class="help-step">
            <div class="help-step-num">4</div>
            <div class="help-step-content">
              <div class="help-step-title">Download your transcript</div>
              <div class="help-step-desc">Go to <strong>Export</strong> in the left menu. Choose your format: TXT for plain text, DOCX for Word, SRT for video subtitles, and more.</div>
            </div>
          </div>
          <div class="help-step">
            <div class="help-step-num">5</div>
            <div class="help-step-content">
              <div class="help-step-title">Use AI features</div>
              <div class="help-step-desc">Go to <strong>AI Output</strong> to get summaries, action items, or ask questions about your transcript. Use <strong>Verba Assistant</strong> to chat with your transcript directly.</div>
            </div>
          </div>
        </div>
        <div class="help-modal-footer">
          <div class="help-tip">💡 Tip: Enable <strong>AUTOSAVE</strong> in the topbar so your transcript is never lost.</div>
        </div>
      </div>
    </div>

    <div class="workspace-command-deck topbar">
      <!-- Controls -->
      <div class="controls">
        <button class="workspace-sidebar-btn topbar-menu-btn" id="workspaceSidebarBtn" type="button" aria-expanded="false" aria-controls="workspaceSidebar" aria-label="Open navigation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="4" y1="7" x2="20" y2="7"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="17" x2="20" y2="17"></line>
          </svg>
          <span class="topbar-menu-label">Sidebar</span>
        </button>
        <div class="app-brand" aria-label="Verbatim">
          <div class="app-brand-icon">V</div>
          <span class="app-brand-name">Verbatim</span>
        </div>
        <div class="mode-toggle mode-switcher">
          <span class="mode-pill" aria-hidden="true"></span>
          <button class="mode-btn mode-seg-btn active" id="modeRealtime" data-mode="realtime"><span class="mode-dot"></span> Live</button>
          <button class="mode-btn mode-seg-btn" id="modeQuality" data-mode="quality"><span class="mode-dot"></span> Quality</button>
          <button class="mode-btn mode-seg-btn" id="modeFile" data-mode="file"><span class="mode-dot"></span> File</button>
        </div>
        <button class="topbar-controls-btn topbar-menu-btn" id="topbarControlsBtn" type="button" aria-expanded="false" aria-controls="topbarMobileDrawer" aria-label="Open controls">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
            <circle cx="9" cy="6" r="2"></circle>
            <circle cx="15" cy="12" r="2"></circle>
            <circle cx="11" cy="18" r="2"></circle>
          </svg>
          <span class="topbar-menu-label">Controls</span>
        </button>
        <div class="topbar-secondary-controls topbar-mobile-drawer" id="topbarMobileDrawer">
          <div class="lang-wrap">
            <span class="lang-label">Lang</span>
            <select id="langSelect" class="lang-select">
              <option value="auto">Auto-detect</option>
              <optgroup label="English">
                <option value="en-IN" data-wlang="en">English - India</option>
                <option value="en-US" data-wlang="en">English - US</option>
                <option value="en-GB" data-wlang="en">English - UK</option>
                <option value="en-AU" data-wlang="en">English - AU</option>
              </optgroup>
              <optgroup label="Indian Languages">
                <option value="hi-IN" data-wlang="hi">Hindi</option>
                <option value="ta-IN" data-wlang="ta">Tamil</option>
                <option value="te-IN" data-wlang="te">Telugu</option>
                <option value="mr-IN" data-wlang="mr">Marathi</option>
                <option value="bn-IN" data-wlang="bn">Bengali</option>
                <option value="gu-IN" data-wlang="gu">Gujarati</option>
                <option value="kn-IN" data-wlang="kn">Kannada</option>
                <option value="ml-IN" data-wlang="ml">Malayalam</option>
                <option value="pa-IN" data-wlang="pa">Punjabi</option>
                <option value="or-IN" data-wlang="or">Odia</option>
                <option value="ur-PK" data-wlang="ur">Urdu</option>
              </optgroup>
              <optgroup label="Other Languages">
                <option value="es-ES" data-wlang="es">Spanish</option>
                <option value="fr-FR" data-wlang="fr">French</option>
                <option value="de-DE" data-wlang="de">German</option>
                <option value="ja-JP" data-wlang="ja">Japanese</option>
                <option value="zh-CN" data-wlang="zh">Mandarin</option>
                <option value="ar-SA" data-wlang="ar">Arabic</option>
                <option value="pt-BR" data-wlang="pt">Portuguese</option>
                <option value="ko-KR" data-wlang="ko">Korean</option>
                <option value="ru-RU" data-wlang="ru">Russian</option>
              </optgroup>
            </select>
          </div>
          <div class="lang-wrap translator-wrap">
            <span class="lang-label">Target</span>
            <select id="translationTargetSelect" class="target-select">
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="mr">Marathi</option>
              <option value="bn">Bengali</option>
              <option value="gu">Gujarati</option>
              <option value="kn">Kannada</option>
              <option value="ml">Malayalam</option>
              <option value="pa">Punjabi</option>
              <option value="ur">Urdu</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="zh">Mandarin</option>
              <option value="ar">Arabic</option>
              <option value="pt">Portuguese</option>
              <option value="ko">Korean</option>
              <option value="ru">Russian</option>
            </select>
          </div>
          <button class="btn-toggle toggle-btn" id="liveTranslateToggle" title="Translate finalized segments with sentiment"><span class="toggle-dot"></span><span class="btn-label">Live Translate</span></button>
          <button class="btn-toggle toggle-btn" id="punctBtn" title="Smart punctuation"><span class="toggle-dot"></span><span class="btn-label">Punct</span></button>
          <button class="btn-toggle toggle-btn" id="autoCopyBtn" title="Auto-copy after silence"><span class="toggle-dot"></span><span class="btn-label">Auto-Copy</span></button>
          <button class="btn-toggle toggle-btn" id="speakerModeToggle" title="Render transcript with speaker labels"><span class="toggle-dot"></span><span class="btn-label">Speakers</span></button>
          <button class="btn-toggle toggle-btn" id="autosaveToggle" title="Autosave workspace in browser"><span class="toggle-dot"></span><span class="btn-label">Autosave</span></button>
        </div>
        <div class="topbar-right-spacer" aria-hidden="true"></div>
      </div>

      <details class="studio-settings" id="studioSettingsPanel">
        <summary class="studio-settings-toggle">
          <span class="studio-settings-copy">
            <span class="studio-settings-kicker">Studio settings</span>
            <span class="studio-settings-title">Preset, autosave, punctuation, speaker labels, and diagnostics</span>
          </span>
          <span class="studio-settings-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </summary>
        <div class="workspace-banner">
          <div class="field">
            <label for="presetSelect">Preset</label>
            <select id="presetSelect" class="studio-select">
              <option value="dictation">Dictation</option>
              <option value="meeting">Meeting</option>
              <option value="subtitle">Subtitle</option>
              <option value="interview">Interview</option>
              <option value="voice-notes">Voice Notes</option>
              <option value="prompt">Prompt Builder</option>
              <option value="build">Build Spec</option>
              <option value="debug">Debug Report</option>
              <option value="docs">Docs Notes</option>
            </select>
          </div>

          <div class="field">
            <label>Quick tools</label>
            <div class="pill-row">
              <button class="pill-btn preset-pill" id="rebuildTranscriptBtn">Rebuild</button>
              <button class="pill-btn preset-pill" id="diagToggleBtn">Diagnostics</button>
            </div>
          </div>
        </div>
      </details>
    </div>
    <div class="workspace-shell app-shell" id="workspaceShell">
      <aside class="workspace-left-rail sidebar" id="workspaceSidebar">
        <div class="utility-card workspace-sidebar-card" id="workspaceSidebarCard">
          <div class="workspace-sidebar-toolbar">
            <button class="workspace-sidebar-icon-btn sidebar-collapse-btn" id="workspaceSidebarCollapseBtn" type="button" aria-label="Collapse sidebar" title="Collapse sidebar">
              <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6"></path>
              </svg>
            </button>
            <div class="workspace-sidebar-brand workspace-header">
              <span class="utility-card-kicker workspace-label">Workspace</span>
              <div class="utility-card-title workspace-title">Navigation</div>
            </div>
            <button class="micro-btn workspace-sidebar-close" id="workspaceSidebarCloseBtn" type="button" aria-label="Close sidebar">Close</button>
          </div>
          <nav class="workspace-sidebar-nav" aria-label="Workspace sections">
            <button class="workspace-nav-btn nav-item" type="button" data-view="record" title="Record">
              <span class="workspace-nav-icon nav-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3"></circle><path d="M12 11v7"></path><path d="M8 21h8"></path><path d="M19 10a7 7 0 0 1-14 0"></path></svg>
              </span>
              <span class="workspace-nav-label nav-label">Record</span>
            </button>
            <button class="workspace-nav-btn nav-item" type="button" data-view="capture" title="Capture">
              <span class="workspace-nav-icon nav-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16v10H4z"></path><path d="M8 7V5h8v2"></path></svg>
              </span>
              <span class="workspace-nav-label nav-label">Capture</span>
            </button>
            <button class="workspace-nav-btn nav-item" type="button" data-view="transcript" title="Transcript">
              <span class="workspace-nav-icon nav-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14v16H5z"></path><path d="M8 8h8"></path><path d="M8 12h8"></path><path d="M8 16h5"></path></svg>
              </span>
              <span class="workspace-nav-label nav-label">Transcript</span>
            </button>
            <button class="workspace-nav-btn nav-item" type="button" data-view="translation" title="Translation">
              <span class="workspace-nav-icon nav-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h6"></path><path d="M8 4v3"></path><path d="M4 12c2.5-1.5 4.5-4.5 5-8"></path><path d="M9 12c-1-1-2-2.5-2.5-4"></path><path d="M14 16l3-8 3 8"></path><path d="M15 14h4"></path></svg>
              </span>
              <span class="workspace-nav-label nav-label">Translation</span>
            </button>
            <button class="workspace-nav-btn nav-item" type="button" data-view="ai-output" title="AI Output">
              <span class="workspace-nav-icon nav-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.9L12 3z"></path></svg>
              </span>
              <span class="workspace-nav-label nav-label">AI Output</span>
            </button>
            <button class="workspace-nav-btn nav-item" type="button" data-view="memory" title="Memory">
              <span class="workspace-nav-icon nav-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h9l3 3v13H6z"></path><path d="M15 4v4h4"></path></svg>
              </span>
              <span class="workspace-nav-label nav-label">Memory</span>
            </button>
            <button class="workspace-nav-btn nav-item" type="button" data-view="tools" title="Export">
              <span class="workspace-nav-icon nav-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.2 2.2-3.2-3.2 2.4-2z"></path></svg>
              </span>
              <span class="workspace-nav-label nav-label">Export</span>
            </button>
            <div class="nav-divider" aria-hidden="true"></div>
            <button class="workspace-nav-btn nav-item" type="button" data-view="settings" title="Settings">
              <span class="workspace-nav-icon nav-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1.1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1z"></path></svg>
              </span>
              <span class="workspace-nav-label nav-label">Settings</span>
            </button>
          </nav>
        </div>

        <div class="utility-card utility-card-capture" id="captureSupportCard">
          <div class="utility-card-head">
            <span class="utility-card-kicker">Support</span>
            <div class="utility-card-title">Capture setup</div>
          </div>
          <div class="capture-toolbar" id="captureToolbar">
            <div class="capture-source-wrap">
              <span class="capture-label">Capture source</span>
              <select id="captureSourceSelect" class="capture-select" aria-label="Capture source">
                <option value="mic">Microphone</option>
                <option value="browser-tab">Browser tab audio</option>
                <option value="screen-audio">Screen + system audio</option>
                <option value="external-help">External app / phone help</option>
              </select>
            </div>
            <div class="capture-capability-note" id="captureCapabilityNote">Microphone capture ready.</div>
            <button class="pill-btn preset-pill capture-help-toggle" id="captureHelpToggle" type="button" aria-expanded="false" aria-controls="captureHelpPanel">
              <span>Capture setup guide</span>
              <svg class="capture-help-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
          <div class="capture-help-panel" id="captureHelpPanel" hidden>
            <div class="capture-help-head">
              <div class="capture-help-title">Capture setup guide</div>
              <div class="capture-help-tip" id="captureHelpTip">Choose the source that matches your meeting or device.</div>
            </div>
            <div class="capture-help-copy" id="captureHelpCopy"></div>
          </div>
        </div>

        <div class="utility-card utility-card-shortcuts" id="shortcutsCard">
          <div class="utility-card-head">
            <span class="utility-card-kicker">Keyboard</span>
            <div class="utility-card-title">Quick access</div>
          </div>
          <button class="pill-btn preset-pill capture-help-toggle shortcuts-toggle" id="shortcutsToggle" type="button" aria-expanded="false" aria-controls="shortcutsPanel">
            <span>Keyboard quick access</span>
            <svg class="capture-help-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        <div class="shortcuts-panel" id="shortcutsPanel" hidden>
          <div class="shortcuts-bar">
            <div class="shortcut"><kbd>Ctrl+C</kbd> Copy text</div>
            <div class="shortcut"><kbd>Ctrl+D</kbd> Download</div>
            <div class="shortcut"><kbd>Ctrl+O</kbd> Open / upload file</div>
            <div class="shortcut"><kbd>Ctrl+U</kbd> Assistant file</div>
            <div class="shortcut"><kbd>Ctrl+Enter</kbd> Transcribe file</div>
            <div class="shortcut"><kbd>Ctrl+Delete</kbd> Clear transcript</div>
            <div class="shortcut"><kbd>Ctrl+Shift+Q</kbd> Toggle recording</div>
            <div class="shortcut"><kbd>Ctrl+Shift+P</kbd> Toggle AI Output panel</div>
            <div class="shortcut"><kbd>Ctrl+Z</kbd> Recover</div>
          </div>
        </div>
        </div>

        <div class="tool-panel utility-card-ai" id="aiOutputCard">
          <div class="tool-header">
            <div>
              <div class="tool-title">AI Output</div>
              <div class="tool-sub">Groq-first summaries, action items, and prompt packs using your configured provider and chat model.</div>
            </div>
            <div class="inline-actions">
              <button class="micro-btn" id="copyAiOutputBtn">Copy</button>
              <button class="micro-btn" id="clearAiOutputBtn">Clear</button>
            </div>
          </div>
          <button class="pill-btn preset-pill capture-help-toggle ai-output-toggle" id="aiOutputToggle" type="button" aria-expanded="false" aria-controls="aiOutputPanel">
            <span>AI output tools</span>
            <svg class="capture-help-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="ai-output-panel" id="aiOutputPanel" hidden>
            <div class="field full">
              <label for="outputStyleSelect">Output style</label>
              <select id="outputStyleSelect" class="studio-select">
                <option value="default">Default</option>
                <option value="concise">Concise</option>
                <option value="executive">Executive</option>
                <option value="technical">Technical</option>
                <option value="founder">Founder</option>
                <option value="client-ready">Client-ready</option>
                <option value="meeting-notes">Meeting Notes</option>
              </select>
              <div class="mini-note" id="aiContextNote">AI Output will use the active memory pack and selected style automatically.</div>
            </div>
            <div class="inline-actions" style="margin-bottom:10px;">
              <button class="pill-btn" id="cleanAiBtn">AI Clean</button>
              <button class="pill-btn" id="summaryBtn">Summary</button>
              <button class="pill-btn" id="actionItemsBtn">Action Items</button>
              <button class="pill-btn" id="promptPackBtn">Prompt Pack</button>
              <button class="pill-btn" id="translateAiOutputBtn">Translate AI Output</button>
            </div>
            <div class="field full">
              <label for="askTranscriptInput">Ask This Transcript</label>
              <textarea id="askTranscriptInput" class="studio-textarea ask-transcript-input" placeholder="Ask a direct question about this transcript. Example: What are the blockers, what should I do next, or convert this into a client-ready brief?"></textarea>
              <div class="inline-actions">
                <button class="pill-btn" id="askTranscriptBtn">Ask transcript</button>
              </div>
            </div>
            <div class="output-stack">
              <div class="output-stack-head">
                <span class="mini-note">Final output only</span>
                <button class="pill-btn pill-btn-sm" id="expandAiOutputBtn" type="button">Expand</button>
              </div>
              <textarea id="aiOutput" class="ai-output" placeholder="AI notes, cleaned transcript, summaries, or paste-ready prompts will appear here."></textarea>
              <div class="mini-note">Recommended on Groq: openai/gpt-oss-120b. Use openai/gpt-oss-20b when you want a faster fallback.</div>
            </div>
          </div>
        </div>
      </aside>

      <div class="workspace-main main-area">
        <!-- Upload Panel -->
        <div class="upload-panel" id="uploadPanel">
          <div class="upload-header">
            <span class="upload-title">Media File</span>
          </div>
          <div class="upload-body">
            <div class="drop-zone" id="dropZone">
              <input type="file" id="fileInput" accept="audio/*,video/*,.mp3,.wav,.m4a,.flac,.ogg,.webm,.mp4,.aac,.mov,.mkv,.avi,.amr,.3gp">
              <div class="drop-zone-icon">UP</div>
              <div class="drop-zone-text">Drop audio or video file here or click to browse</div>
              <div class="drop-zone-sub">MP3 | WAV | M4A | FLAC | OGG | WebM | MP4 | MOV | MKV | AVI | AMR | 3GP - Max 500MB - Any language</div>
            </div>
            <div class="file-info" id="fileInfo">
              <div class="file-info-row">
                <span class="file-name" id="fileName"></span>
                <div class="file-meta" id="fileMeta"></div>
                <button class="file-remove-btn" id="fileRemoveBtn" type="button">Remove</button>
              </div>
              <div class="file-options">
                <label class="file-option-label"><input type="checkbox" id="optNormalize" checked> Normalize volume</label>
                <label class="file-option-label"><input type="checkbox" id="optUseCache" checked> Use transcript cache</label>
              </div>
              <div class="file-language-mode" id="fileLanguageMode">
                <span class="file-option-heading">Output mode</span>
                <label class="file-mode-option">
                  <input type="radio" name="fileLanguageMode" value="preserve" checked>
                  <span>Preserve original languages</span>
                </label>
                <label class="file-mode-option">
                  <input type="radio" name="fileLanguageMode" value="translate">
                  <span>Translate everything to English</span>
                </label>
                <div class="file-mode-note">Marathi and Hindi stay in native script. English stays English.</div>
              </div>
              <div class="audio-analysis" id="audioAnalysis"></div>
              <button class="transcribe-btn" id="transcribeBtn" type="button" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                Transcribe
              </button>
              <div class="progress-wrap" id="progressWrap">
                <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
                <div class="progress-label">
                  <span id="progressLabel">Preparing...</span>
                  <button class="progress-cancel" id="progressCancel">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recording Panel -->
            <div class="rec-panel" id="recPanel">
          <div class="rec-hero">
            <div class="orb-panel">
              <div class="rec-orb-stage orb-stage ready" id="orbTrigger" role="button" tabindex="0" aria-label="Toggle recording from voice orb" aria-pressed="false">
                <div class="orb-status-bar orb-status-main" id="orbStatusMain">Tap to record</div>
                <div class="orb-halo" aria-hidden="true"></div>
                <div class="orb-rings" aria-hidden="true">
                  <span class="ring orb-ring ring-1"></span>
                  <span class="ring orb-ring ring-2"></span>
                  <span class="ring orb-ring ring-3"></span>
                </div>
                <div class="orb-sphere waveform-wrap idle">
                  <canvas id="waveCanvas"></canvas>
                  <div class="waveform-overlay" id="waveOverlay"></div>
                </div>
                <div class="orb-waveform" aria-hidden="true">
                  <span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span>
                </div>
                <div class="orb-runtime sr-only-live">
                  <div class="orb-timer-display" id="orbTimerDisplay">00:00</div>
                </div>
                <div class="status-main sr-only-live" id="statusMain">Ready to record</div>
                <div class="status-sub sr-only-live" id="statusSub">Click orb or press Space</div>
                <div class="timer-display sr-only-live" id="timerDisplay">00:00</div>
              </div>
            </div>
          </div>
          <div class="interim-box">
            <div class="live-dot"></div>
            <div id="interimText" class="interim-text idle-hint">Interim transcription appears here as you speak...</div>
          </div>
          <div class="autocopy-bar" id="autoCopyBar"><div class="autocopy-fill" id="autoCopyFill"></div></div>
        </div>

        <!-- Transcript Panels -->
        <div class="dual-transcript-grid">
          <div class="transcript-panel" id="transcriptPanelCard">
            <div class="tp-header">
              <div class="tp-header-main">
                <span class="tp-title">Transcript</span>
              </div>
              <div class="tp-header-media" id="transcriptHeaderMedia" hidden>
                <audio class="file-audio-player tp-header-player" id="fileAudioPlayer" controls></audio>
              </div>
            </div>
            <textarea id="transcript" placeholder="Your verbatim transcription will appear here.&#10;You can edit this text directly." spellcheck="true"></textarea>
            <div class="segments-view" id="segmentsView"></div>
          </div>
          <div class="transcript-panel translation-panel" id="translationPanel">
            <div class="tp-header translation-header">
              <div class="translation-heading">
                <span class="tp-title">Translation</span>
                <span class="translation-target-label" id="translationTargetLabel">English</span>
              </div>
              <div class="translation-status-wrap">
                <span class="translation-status-dot" id="translationStatusDot"></span>
                <span class="translation-status-text" id="translationStatusText">Disabled</span>
              </div>
            </div>
            <div class="translation-sentiment-card" id="translationSentimentCard">
              <div class="translation-sentiment-top">
                <div>
                  <div class="translation-sentiment-kicker">Session sentiment</div>
                  <div class="translation-sentiment-dominant" id="translationDominantSentiment">No data</div>
                </div>
                <div class="translation-sentiment-trend" id="translationTrendText">Enable translation to start tracking</div>
              </div>
              <div class="translation-sentiment-stats">
                <span class="translation-stat-pill translation-stat-positive" id="translationPositiveCount">0 positive</span>
                <span class="translation-stat-pill translation-stat-neutral" id="translationNeutralCount">0 neutral</span>
                <span class="translation-stat-pill translation-stat-negative" id="translationNegativeCount">0 negative</span>
              </div>
            </div>
            <textarea id="translatedTranscript" class="translated-transcript" placeholder="Translated transcript will appear here when Live Translate is enabled." spellcheck="false" readonly></textarea>
            <div class="segments-view translated-segments-view" id="translatedSegmentsView"></div>
          </div>
        </div>

        <div class="studio-grid studio-grid-single">
          <div class="tool-panel" id="memoryPanel">
            <div class="tool-header">
              <div>
                <div class="tool-title">Imported Memory</div>
                <div class="tool-sub">Paste your exported memory once so AI Output and Verba Assistant can generate more accurate summaries, action items, prompt packs, and answers.</div>
              </div>
              <div class="workspace-meta">
                <span class="workspace-chip" id="memoryStatusChip">No memory loaded</span>
                <span class="workspace-chip" id="workspaceStatus">Workspace idle</span>
                <span class="workspace-chip" id="cacheStatus">Cache idle</span>
              </div>
            </div>
            <div class="memory-stack">
              <div class="field full">
                <label for="memoryPackSelect">Project memory pack</label>
                <select id="memoryPackSelect" class="studio-select" aria-label="Project memory pack"></select>
                <div class="mini-note" id="memoryPackMeta">Use separate packs for workstreams like Client A, Startup, Personal, or Research.</div>
              </div>
              <details class="memory-dropdown">
                <summary class="memory-dropdown-toggle">
                  <span>Show more</span>
                  <span class="memory-dropdown-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </span>
                </summary>
                <div class="memory-dropdown-body">
                  <div class="field full">
                    <label for="memoryInput">Imported memory</label>
                    <textarea id="memoryInput" class="studio-textarea memory-input" placeholder="Paste your exported memory here. The app will use it for AI Output and Verba Assistant."></textarea>
                    <div class="mini-note" id="memoryMeta">No imported memory yet. Once saved, it will ground summaries, action items, prompt packs, AI clean, and assistant replies.</div>
                    <div class="inline-actions">
                      <button class="pill-btn" id="importMemoryBtn">Import memory</button>
                      <button class="pill-btn" id="clearMemoryBtn">Clear memory</button>
                    </div>
                  </div>
                  <div class="tool-grid">
                    <div class="field">
                      <label for="memoryPackNameInput">New pack name</label>
                      <input type="text" id="memoryPackNameInput" class="studio-input" placeholder="New pack name">
                    </div>
                    <div class="field memory-dropdown-actions">
                      <label>Pack actions</label>
                      <div class="inline-actions">
                        <button class="pill-btn" id="createMemoryPackBtn">Create pack</button>
                        <button class="pill-btn" id="deleteMemoryPackBtn">Delete pack</button>
                      </div>
                    </div>
                  </div>
                  <div class="field full">
                    <label for="memoryPromptExport">Import memory prompt</label>
                    <div class="mini-note">Copy this prompt into your other AI provider, export your memory, then paste the result below.</div>
                    <textarea id="memoryPromptExport" class="studio-textarea memory-prompt-box" readonly spellcheck="false"></textarea>
                    <div class="inline-actions">
                      <button class="pill-btn" id="copyMemoryPromptBtn">Copy prompt</button>
                    </div>
                  </div>
                  <div class="field full">
                    <div class="mini-note">Imported memory is treated as long-term user context. Transcript text remains the source of current facts, while memory supplies preferences, projects, terminology, and working style.</div>
                  </div>
                  <button class="pill-btn preset-pill capture-help-toggle memory-tools-toggle" id="memoryToolsToggle" type="button" aria-expanded="false" aria-controls="memoryToolsPanel">
                    <span>Advanced transcript tools</span>
                    <svg class="capture-help-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div class="memory-tools-panel" id="memoryToolsPanel" hidden>
                    <div class="field full">
                      <label for="glossaryInput">Terminology / local replacements</label>
                      <textarea id="glossaryInput" class="studio-textarea" placeholder="One rule per line - examples:
hpcl => HPCL
n8n => n8n
qdrant => Qdrant"></textarea>
                      <div class="mini-note">Applied locally after transcription and whenever you click Apply Glossary.</div>
                    </div>
                    <div class="field full">
                      <div class="inline-actions">
                        <button class="pill-btn" id="applyGlossaryBtn">Apply glossary</button>
                        <button class="pill-btn" id="cleanLocalBtn">Clean locally</button>
                        <button class="pill-btn" id="redactBtn">Redact PII</button>
                        <button class="pill-btn" id="saveWorkspaceBtn">Save workspace</button>
                        <button class="pill-btn" id="exportWorkspaceBtn">Export workspace</button>
                        <button class="pill-btn" id="importWorkspaceBtn">Import workspace</button>
                        <button class="pill-btn" id="clearCacheBtn">Clear cache</button>
                      </div>
                      <input class="import-input" type="file" id="workspaceFileInput" accept=".json,application/json">
                    </div>
                    <div class="field full">
                      <div class="mini-note warning-note">Do not paste real API keys into the transcript, imported memory, or exported workspace if you plan to share the file.</div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>

        <div class="diagnostics-panel" id="diagnosticsPanel">
          <div class="tool-header">
            <div>
              <div class="tool-title">Diagnostics</div>
              <div class="tool-sub">Provider pressure, retries, cache usage, chunk counts, and current workspace metadata.</div>
            </div>
          </div>
          <div class="diag-grid" id="diagGrid"></div>
          <textarea id="diagLog" class="diag-log" readonly placeholder="Diagnostics log will appear here."></textarea>
        </div>

        <div class="workspace-status-bar statusbar" id="workspaceStatusBar">
          <span class="status-bar-item" id="statusBarRecording">
            <span class="status-bar-dot" id="statusBarRecDot"></span>
            <span id="statusBarRecText">Idle</span>
          </span>
          <span class="status-bar-sep"></span>
          <span class="status-bar-item" id="statusBarWords">0 words</span>
          <span class="status-bar-sep"></span>
          <span class="status-bar-item" id="statusBarChars">0 chars</span>
          <span class="status-bar-sep"></span>
          <span class="status-bar-item" id="statusBarLang">-</span>
          <span class="status-bar-sep"></span>
          <span class="status-bar-item" id="statusBarMode">
            <strong>LIVE</strong>
          </span>
          <span class="status-bar-sep"></span>
          <span class="status-bar-item" id="statusBarAutosave">Autosave off</span>
        </div>
      </div>

      <aside class="workspace-right-rail">
        <div class="utility-card session-summary-card" id="sessionSummaryCard">
          <div class="utility-card-head">
            <span class="utility-card-kicker">Runtime</span>
            <div class="utility-card-title">Session summary</div>
          </div>
          <div class="summary-pill-row">
            <div class="stat-pill" id="wordPill">0 words</div>
            <div class="stat-pill" id="charPill">0 chars</div>
          </div>
          <details class="summary-dropdown">
            <summary class="summary-dropdown-toggle">
              <span>More details</span>
              <span class="summary-dropdown-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </summary>
            <div class="summary-meta-grid">
              <div class="summary-meta-block">
                <span class="summary-label">Detected language</span>
                <span class="detected-lang-badge" id="detectedLangBadge" style="display:none"></span>
              </div>
              <div class="summary-meta-block">
                <span class="summary-label">Segments</span>
                <span class="summary-value" id="segCount">0 segments</span>
              </div>
              <div class="summary-meta-block">
                <span class="summary-label">Duration</span>
                <span class="summary-value" id="durStat">0:00 duration</span>
              </div>
            </div>
          </details>
        </div>

        <div class="utility-card utility-card-actions" id="transcriptToolsCard">
          <div class="utility-card-head">
            <span class="utility-card-kicker">Export Transcript</span>
            <div class="utility-card-title">Choose a format to download your transcript</div>
          </div>
          <div class="export-grid" id="exportGrid">
            <article class="export-card" data-format="txt">
              <div class="export-card-top"><span class="export-card-icon" aria-hidden="true">📄</span><span class="export-card-ext">.TXT</span></div>
              <div class="export-card-name">Plain Text</div>
              <div class="export-card-desc">Simple unformatted transcript</div>
              <button class="export-card-btn" type="button" data-format="txt">Download</button>
            </article>
            <article class="export-card" data-format="docx">
              <div class="export-card-top"><span class="export-card-icon" aria-hidden="true">📝</span><span class="export-card-ext">.DOCX</span></div>
              <div class="export-card-name">Word Document</div>
              <div class="export-card-desc">Formatted doc for Microsoft Word</div>
              <button class="export-card-btn" type="button" data-format="docx">Download</button>
            </article>
            <article class="export-card" data-format="srt">
              <div class="export-card-top"><span class="export-card-icon" aria-hidden="true">🎬</span><span class="export-card-ext">.SRT</span></div>
              <div class="export-card-name">Subtitles</div>
              <div class="export-card-desc">Standard subtitle file for video</div>
              <button class="export-card-btn" type="button" data-format="srt">Download</button>
            </article>
            <article class="export-card" data-format="vtt">
              <div class="export-card-top"><span class="export-card-icon" aria-hidden="true">🌐</span><span class="export-card-ext">.VTT</span></div>
              <div class="export-card-name">WebVTT</div>
              <div class="export-card-desc">Web-compatible caption format</div>
              <button class="export-card-btn" type="button" data-format="vtt">Download</button>
            </article>
            <article class="export-card" data-format="json">
              <div class="export-card-top"><span class="export-card-icon" aria-hidden="true">📦</span><span class="export-card-ext">.JSON</span></div>
              <div class="export-card-name">JSON</div>
              <div class="export-card-desc">Structured data with timestamps</div>
              <button class="export-card-btn" type="button" data-format="json">Download</button>
            </article>
            <article class="export-card" data-format="md">
              <div class="export-card-top"><span class="export-card-icon" aria-hidden="true">✍️</span><span class="export-card-ext">.MD</span></div>
              <div class="export-card-name">Markdown</div>
              <div class="export-card-desc">Formatted text for docs and blogs</div>
              <button class="export-card-btn" type="button" data-format="md">Download</button>
            </article>
            <article class="export-card" data-format="csv">
              <div class="export-card-top"><span class="export-card-icon" aria-hidden="true">📊</span><span class="export-card-ext">.CSV</span></div>
              <div class="export-card-name">Segments CSV</div>
              <div class="export-card-desc">Tabular data for spreadsheets</div>
              <button class="export-card-btn" type="button" data-format="csv">Download</button>
            </article>
            <article class="export-card" data-format="workspace">
              <div class="export-card-top"><span class="export-card-icon" aria-hidden="true">💾</span><span class="export-card-ext">.JSON</span></div>
              <div class="export-card-name">Workspace</div>
              <div class="export-card-desc">Full workspace backup and restore</div>
              <button class="export-card-btn" type="button" data-format="workspace">Download</button>
            </article>
          </div>
          <div class="action-bar export-actions">
            <div class="view-toggle">
              <span class="view-pill" aria-hidden="true"></span>
              <button class="view-btn active" id="btnRaw" type="button" data-view="raw">Plain</button>
              <button class="view-btn" id="btnSeg" type="button" data-view="segments">Timestamped</button>
            </div>
            <button class="btn btn-history" id="historyBtn" type="button" title="Transcript history">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              History
            </button>
            <button class="btn btn-clear" id="clearBtn" type="button" title="Clear transcript">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Clear
            </button>
          </div>
        </div>

        <div class="history-panel" id="historyPanel">
          <div class="history-header">
            <span class="history-title">Copy History</span>
            <button class="history-clear-btn" id="historyClearBtn" type="button">Clear history</button>
          </div>
          <div class="history-list" id="historyList">
            <div class="history-empty">No history yet - copied text will appear here</div>
          </div>
        </div>
      </aside>
    </div>
    <button class="workspace-sidebar-fab" id="workspaceSidebarFab" type="button" aria-expanded="false" aria-controls="workspaceSidebar">Sidebar</button>
    <div class="workspace-sidebar-backdrop" id="workspaceSidebarBackdrop" hidden></div>

    <div class="assistant-shell" id="assistantShell">
      <div class="assistant-panel" id="assistantPanel" hidden>
        <div class="assistant-header verba-header">
          <div class="assistant-title verba-title verba-header-left">
            <div class="assistant-mini-bot verba-avatar verba-avatar-img" aria-hidden="true">${getAssistantRobotBadgeMarkup()}</div>
            <div class="assistant-heading verba-title-block">
              <div class="assistant-name verba-name">Verba</div>
              <div class="assistant-sub verba-name-sub" id="assistantRuntimeMeta">Assistant</div>
            </div>
          </div>
          <div class="assistant-actions verba-controls verba-header-controls">
            <button class="assistant-icon-btn verba-ctrl-btn vctrl-btn" id="assistantQuickNewBtn" title="New chat" aria-label="New chat" data-action="new">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button class="assistant-icon-btn verba-ctrl-btn vctrl-btn" id="assistantHistoryBtn" title="Conversation history" aria-label="Conversation history" data-action="history">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>
            </button>
            <button class="assistant-icon-btn verba-ctrl-btn vctrl-btn" id="assistantCopyLastBtn" title="Copy last assistant answer" aria-label="Copy last assistant answer" data-action="copy">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>
            </button>
            <button class="assistant-icon-btn verba-ctrl-btn vctrl-btn" id="assistantClearBtn" title="Clear assistant thread" aria-label="Clear assistant thread" data-action="delete">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3,6 5,6 21,6"></polyline><path d="M19,6l-1,14a2 2 0 01-2 2H8a2 2 0 01-2-2L5,6"></path><path d="M10,11v6M14,11v6"></path><path d="M9,6V4a1 1 0 011-1h4a1 1 0 011 1v2"></path></svg>
            </button>
            <button class="assistant-icon-btn verba-ctrl-btn vctrl-btn" id="assistantMinBtn" title="Minimize assistant" aria-label="Minimize assistant" data-action="minimize">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button class="assistant-icon-btn verba-ctrl-btn vctrl-btn" id="assistantMaxBtn" title="Expand assistant" aria-label="Expand assistant" data-action="expand">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15,3 21,3 21,9"></polyline><polyline points="9,21 3,21 3,15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
            </button>
            <button class="assistant-icon-btn verba-ctrl-btn vctrl-btn vctrl-close close" id="assistantCloseBtn" title="Close assistant" aria-label="Close assistant" data-action="close">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
        <div class="assistant-history-panel" id="assistantHistoryPanel" hidden>
          <div class="assistant-history-top">
            <div class="assistant-history-title">Chats</div>
            <button class="assistant-history-new" id="assistantNewChatBtn" type="button">New chat</button>
          </div>
          <div class="assistant-history-list" id="assistantHistoryList"></div>
        </div>
        <div class="assistant-toolbar verba-tabs" id="assistantQuickPrompts">
          <button class="assistant-chip verba-tab" data-prompt="How do Live, Quality, and File differ?">Modes</button>
          <button class="assistant-chip verba-tab" data-prompt="How does translate-to-English work in this app?">Translate</button>
          <button class="assistant-chip verba-tab" data-prompt="What does Auto-Copy do and when does it trigger?">Auto-Copy</button>
          <button class="assistant-chip verba-tab" data-prompt="How do exports and workspace save work?">Export + Save</button>
        </div>
        <div class="assistant-empty" id="assistantEmpty">
          Ask about modes, language selection, provider setup, imported memory, exports, AI Output, presets, or the current runtime state.
        </div>
        <div class="assistant-messages" id="assistantMessages"></div>
        <div class="assistant-footer verba-input-area">
          <div class="assistant-input-wrap" id="assistantInputWrap">
            <textarea class="assistant-input verba-textarea" id="assistantInput" placeholder="Ask anything. Example: What does Quality mode do, or explain ML in simple terms."></textarea>
            <div class="assistant-attachment-preview" id="assistantAttachmentPreview" hidden>
              <div class="assistant-attachment-pill">
                <span class="assistant-attachment-kind" id="assistantAttachmentKind">Image</span>
                <span class="assistant-attachment-name" id="assistantAttachmentMeta">No file attached</span>
                <button class="assistant-attachment-close" id="assistantAttachmentRemove" type="button" aria-label="Remove attached file">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div class="assistant-footer-row verba-input-row verba-input-bottom">
              <select id="assistantModelSelect" class="assistant-model-select verba-model-select verba-model-dropdown" aria-label="Assistant model">
                <option value="">Loading models...</option>
              </select>
              <input type="file" id="assistantFileInput" hidden multiple accept="image/png,image/jpeg,image/webp,application/pdf,.pdf,text/plain,.txt,text/markdown,.md,text/csv,.csv,application/json,.json">
              <button class="assistant-attach-btn verba-attach-btn" id="assistantAttachBtn" type="button" aria-label="Add photos and files" title="Add photos and files">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.9-9.9a4 4 0 1 1 5.66 5.66l-10 10a2 2 0 0 1-2.83-2.83l8.84-8.84"></path>
                </svg>
                <span class="assistant-attach-label">Add photos & files</span>
              </button>
              <button class="assistant-mic-btn verba-mic-btn" id="assistantMicBtn" type="button" aria-label="Start voice input" title="Voice input (English)">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3z"></path>
                  <path d="M19 11a7 7 0 0 1-14 0"></path>
                  <path d="M12 18v3"></path>
                  <path d="M8 21h8"></path>
                </svg>
              </button>
              <button class="assistant-send verba-send-btn" id="assistantSend" aria-label="Send assistant message">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
            <div class="assistant-meta" id="assistantModelMeta">Groq-first assistant</div>
          </div>
          <div class="assistant-note">Uses the assistant model you pick below for chat. Image, PDF, and file analysis can route through the Gemini model set in API Configuration.</div>
        </div>
      </div>
      <div class="assistant-dock bottom-actions">
        <button class="btn btn-copy" id="copyBtn" title="Copy all text">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </button>
        <button class="assistant-launcher verba-mascot" id="assistantLauncher" aria-label="Open Verba Assistant" title="Open Verba Assistant">
          <span class="assistant-unread" id="assistantUnread">0</span>
          <span class="assistant-launcher-label">Verba Assistant</span>
          <div class="robot-3d" aria-hidden="true">
            <div class="robot-antenna"><div class="robot-antenna-dot"></div><div class="robot-antenna-stem"></div></div>
            <div class="robot-head">
              <div class="robot-ear robot-ear-l"></div>
              <div class="robot-eye"><div class="robot-pupil"></div></div>
              <div class="robot-ear robot-ear-r"></div>
            </div>
            <div class="robot-neck"></div>
            <div class="robot-base">
              <div class="robot-base-shoulder"></div>
              <div class="robot-base-body"><div class="robot-led robot-led-1"></div><div class="robot-led robot-led-2"></div><div class="robot-led robot-led-3"></div></div>
            </div>
            <div class="robot-shadow"></div>
          </div>
        </button>
      </div>
    </div>
    <button class="help-fab" id="helpFabBtn" type="button" title="How to use Verbatim">
      <span class="help-fab-icon">?</span>
      <span class="help-fab-label">Help</span>
    </button>
  `;

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // STATE
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function safeLocalStorageSet(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
                console.warn('localStorage quota exceeded for key:', key);
                if (typeof toast === 'function') {
                    toast('Storage full - oldest session data may not be saved.', 'warning');
                }
            }
        }
    }

    let state = {
        mode: 'realtime',
        captureSource: localStorage.getItem('vt_capture_source') || 'mic',
        sidebarWidth: Math.min(360, Math.max(240, Number(localStorage.getItem('vt_sidebar_width') || 280))) || 280,
        sidebarCollapsed: localStorage.getItem('vt_sidebar_collapsed') === '1',
        sidebarMobileOpen: false,
        workspaceView: localStorage.getItem('vt_workspace_view') || 'record',
        captureHelpOpen: false,
        isRecording: false,
        segments: [],
        sessionStart: null,
        timerInterval: null,
        confirmedText: '',
        currentView: 'raw',
        smartPunctEnabled: false,
        autoCopyEnabled: false,
        lastEndTime: 0,
        noSpeechTimer: null,
        restartTimeout: null,
        autoCopyTimer: null,
        autoCopyCountdown: null,
        // Audio
        audioCtx: null,
        analyser: null,
        source: null,
        animFrame: null,
        micStream: null,
        captureSessionStream: null,
        visualLevel: 0,
        orbPhase: 0,
        orbSeed: Math.random() * Math.PI * 2,
        // Quality mode
        mediaRecorder: null,
        recordedChunks: [],
        recorderMimeType: '',
        // File mode
        uploadedFile: null,
        uploadedAudioBuffer: null,
        uploadedFileUrl: '',
        audioAnalysis: null,
        isProcessing: false,
        abortController: null,
        detectedLanguage: '',
        // API
        apiProvider: localStorage.getItem('vt_provider') || 'groq',
        apiKey: localStorage.getItem('vt_api_key') || '',
        apiConnected: false,
        audioModel: localStorage.getItem('vt_audio_model') || '',
        chatModel: localStorage.getItem('vt_chat_model') || '',
        providerKeys: (() => {
            try { return normalizeProviderKeyStore(JSON.parse(localStorage.getItem('vt_provider_keys') || '{}')); }
            catch (e) { return normalizeProviderKeyStore({}); }
        })(),
        preset: localStorage.getItem('vt_preset') || 'dictation',
        glossaryRaw: localStorage.getItem('vt_glossary') || 'hpcl => HPCL\nn8n => n8n\nqdrant => Qdrant',
        memoryRaw: localStorage.getItem('vt_memory_raw') || '',
        memoryImportedAt: localStorage.getItem('vt_memory_imported_at') || '',
        memoryPacks: (() => {
            try {
                const saved = JSON.parse(localStorage.getItem('vt_memory_packs') || '[]');
                return Array.isArray(saved) ? saved : [];
            } catch (e) {
                return [];
            }
        })(),
        activeMemoryPackId: localStorage.getItem('vt_memory_pack_active') || '',
        outputStyle: localStorage.getItem('vt_output_style') || 'default',
        geminiAnalysisModel: localStorage.getItem('vt_gemini_analysis_model') || '',
        geminiUsage: (() => {
            try { return JSON.parse(localStorage.getItem('vt_gemini_usage') || '{}') || {}; }
            catch (e) { return {}; }
        })(),
        autosaveEnabled: localStorage.getItem('vt_autosave') !== '0',
        speakerMode: localStorage.getItem('vt_speaker_mode') === '1',
        fileHash: '',
        cacheKey: '',
        audioDurationSec: 0,
        translation: normalizeTranslationState({
            enabled: localStorage.getItem('vt_translation_enabled') === '1',
            targetLanguage: localStorage.getItem('vt_translation_target') || 'en'
        }),
        aiBusy: false,
        aiOutput: sessionStorage.getItem('vt_ai_output') || '',
        capabilities: runtimeCapabilities,
        diagnostics: (() => {
            try { return JSON.parse(sessionStorage.getItem('vt_diag') || '{}'); }
            catch (e) { return {}; }
        })(),
        assistant: {
            isOpen: false,
            minimized: true,
            maximized: false,
            showHistory: false,
            isSending: false,
            isListening: false,
            unread: 0,
            model: localStorage.getItem('vt_assistant_model') || '',
            draft: sessionStorage.getItem('vt_assistant_draft') || '',
            pendingAttachment: null,
            currentConversationId: localStorage.getItem('vt_assistant_current') || '',
            conversations: (() => {
                try {
                    const saved = JSON.parse(localStorage.getItem('vt_assistant_conversations') || '[]');
                    return Array.isArray(saved) ? saved : [];
                } catch (e) {
                    return [];
                }
            })(),
            messages: (() => {
                try {
                    const saved = JSON.parse(localStorage.getItem('vt_assistant_thread') || '[]');
                    return Array.isArray(saved) ? saved : [];
                } catch (e) {
                    return [];
                }
            })(),
            ui: (() => {
                try {
                    return JSON.parse(localStorage.getItem('vt_assistant_ui') || '{}') || {};
                } catch (e) {
                    return {};
                }
            })()
        },
        // History
        copyHistory: JSON.parse(sessionStorage.getItem('vt_history') || '[]'),
        undoBuffer: sessionStorage.getItem('vt_undo') || '',
        lastInterimText: '',
        lastInterimAlternatives: [],
        manualStop: false,
        workspaceSaveTimer: null,
        realtimePendingSegment: null,
        realtimeCommitTimer: null,
        realtimeFallbackPromise: null,
        correctionHistory: [],
        correctionQueue: [],
        correctionBusy: false,
        correctionCache: (() => {
            try { return JSON.parse(sessionStorage.getItem('vt_correction_cache') || '{}') || {}; }
            catch (e) { return {}; }
        })(),
        liveHealth: {
            score: 1,
            consecutiveRestarts: 0,
            consecutiveErrors: 0,
            noSpeechEvents: 0,
            networkEvents: 0,
            fallbackUses: 0,
            activeLanguage: '',
            mode: 'live',
            lastReason: '',
            lastUpdatedAt: 0
        },
        liveAudioBuffer: {
            stream: null,
            recorder: null,
            mimeType: '',
            chunks: [],
            startedAt: 0
        },
    };

    const ASSISTANT_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
    const assistantAttachmentCache = new Map();
    let assistantAttachmentSeq = 0;
    const AUTO_COPY_DELAY = 4000;
    const WORKSPACE_STORAGE_KEY = 'vt_workspace_v3';
    const LEGACY_WORKSPACE_STORAGE_KEY = 'vt_workspace_v2';
    const TRANSLATION_DEBOUNCE_MS = 850;
    const REALTIME_FINAL_COMMIT_DELAY_MS = 180;
    const LIVE_FALLBACK_MIN_BUFFER_MS = 1800;
    const LIVE_RELIABILITY_THRESHOLD = 0.46;
    const MAX_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024;
    const DIRECT_MEDIA_UPLOAD_MAX_BYTES = 24 * 1024 * 1024;
    let translationFlushTimer = null;
    const LEGACY_MEMORY_IMPORT_PROMPT = [
        "Export all of my stored memories and any context you've learned about me from past conversations. Preserve my words verbatim where possible, especially for instructions and preferences.",
        "",
        "## Categories (output in this order):",
        "",
        "1. **Instructions**: Rules I've explicitly asked you to follow going forward - tone, format, style, \"always do X\", \"never do Y\", and corrections to your behavior. Only include rules from stored memories, not from conversations.",
        "",
        "2. **Identity**: Name, age, location, education, family, relationships, languages, and personal interests.",
        "",
        "3. **Career**: Current and past roles, companies, and general skill areas.",
        "",
        "4. **Projects**: Projects I meaningfully built or committed to. Ideally ONE entry per project. Include what it does, current status, and any key decisions. Use the project name or a short descriptor as the first words of the entry.",
        "",
        "5. **Preferences**: Opinions, tastes, and working-style preferences that apply broadly.",
        "",
        "## Format:",
        "",
        "Use section headers for each category. Within each category, list one entry per line, sorted by oldest date first. Format each line as:",
        "",
        "[YYYY-MM-DD] - Entry content here.",
        "",
        "If no date is known, use [unknown] instead.",
        "",
        "## Output:",
        "- Wrap the entire export in a single code block for easy copying.",
        "- After the code block, state whether this is the complete set or if more remain."
    ].join('\n');

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const MEMORY_IMPORT_PROMPT_V2 = [
        "Prepare a durable user-memory export for cross-platform import.",
        "",
        "STEP 1 - INSPECT",
        "Examine everything currently accessible:",
        "- Stable or saved memory and user profile context",
        "- Custom instructions and system-level configuration",
        "- Project instructions and project files if this is a project workspace",
        "- Recurring patterns from conversation history",
        "",
        "STEP 2 - CLASSIFY EVERY FACT",
        "PORTABLE - About the user as a person: identity, career, skills, preferences, constraints, goals. Relevant in any workspace.",
        "CONTEXTUAL - About this workspace's purpose, operating modes, file structure, progress state, or task-specific directives. Relevant only in a workspace with a similar purpose.",
        "EPHEMERAL - One-off requests, transient mistakes, temporary runtime state, or short-lived conversation details. Discard these entirely.",
        "",
        "Keep only durable facts. Deduplicate repeated facts. Prefer atomic one-line facts over long paragraphs.",
        "",
        "STEP 3 - FORMAT",
        "Return exactly one fenced code block using the structure below.",
        "",
        "Per-line format: - [YYYY-MM-DD] fact",
        "Use [unknown] if the date cannot be determined.",
        "Sort oldest-known items first within each section.",
        "If a section would be empty, write: - [unknown] None captured yet.",
        "Omit a section only if it is structurally irrelevant, for example omit Open Loops if no concrete state exists.",
        "",
        "SECTION STRUCTURE:",
        "",
        "## Meta",
        "Export date, source platform, format version \"v2\", count of portable facts, count of contextual facts.",
        "",
        "## PORTABLE CORE (always import)",
        "## Identity",
        "## Career & Education",
        "## Technical Profile",
        "## Projects & Achievements",
        "## Active Goals",
        "## Communication Preferences",
        "## Hard Constraints",
        "## Terminology",
        "",
        "## CONTEXTUAL (import into similar workspaces)",
        "## Workspace Purpose & Scope",
        "## Workspace Directives",
        "## Progress & State",
        "## Open Loops",
        "",
        "STEP 4 - COMPLETION CHECK",
        "After the code block, output exactly one line:",
        "Export-complete: yes|no - N portable, M contextual"
    ].join('\n');

    const MEMORY_IMPORT_PROMPT = [
        "Prepare a durable user-memory export for cross-platform import.",
        "",
        "STEP 1 - INSPECT",
        "Examine everything you can currently access:",
        "- Saved or persistent memory entries",
        "- Custom instructions or system-level user configuration",
        "- Project instructions and project knowledge files if this is a project workspace",
        "Do not attempt to recall past conversations you cannot see.",
        "If you have access to nothing, say so in Meta and produce empty sections.",
        "",
        "STEP 2 - CLASSIFY EVERY FACT",
        "PORTABLE - About the user as a person: identity, career, skills, preferences, constraints, goals. Relevant in any workspace.",
        "CONTEXTUAL - About this workspace's purpose, operating modes, file structure, progress state, or task-specific directives. Relevant only in a similar-purpose workspace.",
        "EPHEMERAL - One-off requests, transient mistakes, runtime states, and short-lived details. Discard these entirely.",
        "",
        "Keep only durable facts. Deduplicate. One atomic fact per line. Do not embellish or infer unsupported facts.",
        "",
        "STEP 3 - FORMAT",
        "Return exactly one fenced code block.",
        "Per-line format: - [YYYY-MM-DD] fact",
        "Use [unknown] when the date cannot be determined.",
        "Oldest items first within each section.",
        "Empty sections get: - [unknown] None captured yet.",
        "",
        "SECTION ORDER - every heading is ##, no nesting:",
        "",
        "## Meta",
        "- [YYYY-MM-DD] Export date",
        "- [unknown] Source platform: <platform>",
        "- [unknown] Workspace name: <name or [unknown]>",
        "- [unknown] Format version: v3",
        "- [unknown] Portable fact count: <N>",
        "- [unknown] Contextual fact count: <M>",
        "- [unknown] Portable sections: Identity, Career & Education, Technical Profile, Projects & Achievements, Active Goals, Communication Preferences, Hard Constraints, Terminology",
        "- [unknown] Contextual sections: Workspace Purpose & Scope, Workspace Directives, Progress & State, Open Loops",
        "",
        "## Identity",
        "## Career & Education",
        "## Technical Profile",
        "## Projects & Achievements",
        "## Active Goals",
        "## Communication Preferences",
        "## Hard Constraints",
        "## Terminology",
        "## Workspace Purpose & Scope",
        "## Workspace Directives",
        "## Progress & State",
        "## Open Loops",
        "",
        "STEP 4 - COMPLETION CHECK",
        "After the code block, output exactly one line:",
        "Export-complete: yes|no - N portable, M contextual"
    ].join('\n');

    // ELEMENTS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const $ = id => document.getElementById(id);
    const micBtn = $('micBtn');
    const recPanel = $('recPanel');
    const micOuter = $('micOuter');
    const statusMain = $('statusMain');
    const statusSub = $('statusSub');
    const interimEl = $('interimText');
    const timerEl = $('timerDisplay');
    const orbStatusMain = $('orbStatusMain');
    const orbTimerDisplay = $('orbTimerDisplay');
    const transcript = $('transcript');
    const segView = $('segmentsView');
    const translatedTranscript = $('translatedTranscript');
    const translatedSegmentsView = $('translatedSegmentsView');
    const langSelect = $('langSelect');
    const translationTargetSelect = $('translationTargetSelect');
    const liveTranslateToggle = $('liveTranslateToggle');
    const translationPanel = $('translationPanel');
    const translationTargetLabel = $('translationTargetLabel');
    const translationStatusText = $('translationStatusText');
    const translationStatusDot = $('translationStatusDot');
    const translationDominantSentiment = $('translationDominantSentiment');
    const translationTrendText = $('translationTrendText');
    const translationPositiveCount = $('translationPositiveCount');
    const translationNeutralCount = $('translationNeutralCount');
    const translationNegativeCount = $('translationNegativeCount');
    const modeRealtimeBtn = $('modeRealtime');
    const modeQualityBtn = $('modeQuality');
    const modeFileBtn = $('modeFile');
    const workspaceShell = $('workspaceShell');
    const workspaceMain = document.querySelector('.workspace-main');
    const workspaceRightRail = document.querySelector('.workspace-right-rail');
    const workspaceSidebar = $('workspaceSidebar');
    const workspaceSidebarCard = $('workspaceSidebarCard');
    const workspaceSidebarBtn = $('workspaceSidebarBtn');
    const workspaceSidebarFab = $('workspaceSidebarFab');
    const workspaceSidebarBackdrop = $('workspaceSidebarBackdrop');
    const topbarControlsBtn = $('topbarControlsBtn');
    const topbarMobileDrawer = $('topbarMobileDrawer');
    const workspaceSidebarCloseBtn = $('workspaceSidebarCloseBtn');
    const workspaceSidebarCollapseBtn = $('workspaceSidebarCollapseBtn');
    const workspaceSidebarSettings = $('workspaceSidebarSettings');
    const sidebarWidthRange = $('sidebarWidthRange');
    const sidebarWidthMeta = $('sidebarWidthMeta');
    const sidebarCollapseBtn = $('sidebarCollapseBtn');
    const sidebarResetBtn = $('sidebarResetBtn');
    const workspaceNavButtons = Array.from(document.querySelectorAll('.workspace-nav-btn'));
    const studioSettingsPanel = $('studioSettingsPanel');
    const captureSupportCard = $('captureSupportCard');
    const captureToolbar = $('captureToolbar');
    const captureSourceSelect = $('captureSourceSelect');
    const captureCapabilityNote = $('captureCapabilityNote');
    const captureHelpToggle = $('captureHelpToggle');
    const captureHelpPanel = $('captureHelpPanel');
    const captureHelpTip = $('captureHelpTip');
    const captureHelpCopy = $('captureHelpCopy');
    const captureRecOrbCard = $('captureRecOrbCard');
    const captureOrbStage = $('captureOrbStage');
    const captureOrbStatus = $('captureOrbStatus');
    const captureOrbTimerDisplay = $('captureOrbTimerDisplay');
    const captureStatusMain = $('captureStatusMain');
    const captureStatusSub = $('captureStatusSub');
    const captureTimerDisplay = $('captureTimerDisplay');
    const captureInterimEl = $('captureInterimEl');
    const captureTranscriptHost = $('captureTranscriptHost');
    const shortcutsCard = $('shortcutsCard');
    const shortcutsToggle = $('shortcutsToggle');
    const shortcutsPanel = $('shortcutsPanel');
    const aiOutputCard = $('aiOutputCard');
    const aiOutputToggle = $('aiOutputToggle');
    const aiOutputPanel = $('aiOutputPanel');
    const transcriptPanelCard = $('transcriptPanelCard');
    const sessionSummaryCard = $('sessionSummaryCard');
    const transcriptToolsCard = $('transcriptToolsCard');
    const memoryPanel = $('memoryPanel');
    const dualTranscriptGrid = document.querySelector('.dual-transcript-grid');
    const studioGridSingle = document.querySelector('.studio-grid');
    const wordPill = $('wordPill');
    const charPill = $('charPill');
    const segCount = $('segCount');
    const durStat = $('durStat');
    const canvas = $('waveCanvas');
    const ctx2d = canvas.getContext('2d');
    const waveOverlay = $('waveOverlay');
    const orbTrigger = $('orbTrigger');
    const waveformWrap = orbTrigger?.querySelector('.waveform-wrap');
    const autoCopyBtn = $('autoCopyBtn');
    const autoCopyBar = $('autoCopyBar');
    const autoCopyFill = $('autoCopyFill');
    const punctBtn = $('punctBtn');
    const historyBtn = $('historyBtn');
    const clearBtn = $('clearBtn');
    const historyPanel = $('historyPanel');
    const historyList = $('historyList');
    const uploadPanel = $('uploadPanel');
    const dropZone = $('dropZone');
    const fileInput = $('fileInput');
    const fileInfo = $('fileInfo');
    const fileName = $('fileName');
    const fileMeta = $('fileMeta');
    const fileAudioPlayer = $('fileAudioPlayer');
    const transcriptHeaderMedia = $('transcriptHeaderMedia');
    const topDownloadMenu = $('topDownloadMenu');
    const topDownloadBtn = $('topDownloadBtn');
    const topDownloadDropdown = $('topDownloadDropdown');
    const transcribeBtn = $('transcribeBtn');
    const progressWrap = $('progressWrap');
    const progressFill = $('progressFill');
    const progressLabel = $('progressLabel');
    const progressCancel = $('progressCancel');
    const audioAnalysisEl = $('audioAnalysis');
    const detectedLangBadge = $('detectedLangBadge');
    const helpBtn = $('helpFabBtn');
    const helpModalOverlay = $('helpModalOverlay');
    const helpCloseBtn = $('helpCloseBtn');
    const apiPanel = $('apiPanel');
    const apiHeader = $('apiHeader');
    const apiNote = apiPanel.querySelector('.api-note');
    const apiKeyInput = $('apiKeyInput');
    const apiKeyToggleBtn = $('apiKeyToggle');
    const geminiKeyInput = $('geminiKeyInput');
    const geminiKeyVault = $('geminiKeyVault');
    const geminiKeyToggleBtn = $('geminiKeyToggle');
    const geminiKeySaveBtn = $('geminiKeySave');
    const geminiKeyTestBtn = $('geminiKeyTest');
    const geminiVaultSaveBtn = $('geminiVaultSave');
    const geminiModelSelect = $('geminiModelSelect');
    const geminiUsageTitle = $('geminiUsageTitle');
    const geminiUsageMinuteText = $('geminiUsageMinuteText');
    const geminiUsageMinuteBar = $('geminiUsageMinuteBar');
    const geminiUsageDayText = $('geminiUsageDayText');
    const geminiUsageDayBar = $('geminiUsageDayBar');
    const geminiUsageNote = $('geminiUsageNote');
    const geminiUsageResetBtn = $('geminiUsageReset');
    const apiProvider = $('apiProvider');
    const apiStatusDot = $('apiStatusDot');
    const apiStatusLabel = $('apiStatusLabel');
    const exportCardButtons = Array.from(document.querySelectorAll('.export-card-btn'));
    const fileLanguageModeInputs = Array.from(document.querySelectorAll('input[name="fileLanguageMode"]'));
    const presetSelect = $('presetSelect');
    const speakerModeToggle = $('speakerModeToggle');
    const autosaveToggle = $('autosaveToggle');
    const rebuildTranscriptBtn = $('rebuildTranscriptBtn');
    const diagnosticsPanel = $('diagnosticsPanel');
    const diagGrid = $('diagGrid');
    const diagLog = $('diagLog');
    const workspaceStatus = $('workspaceStatus');
    const cacheStatus = $('cacheStatus');
    const audioModelInput = $('audioModelInput');
    const chatModelInput = $('chatModelInput');
    const chatModelSelect = $('chatModelSelect');
    const chatModelSuggestions = $('chatModelSuggestions');
    const apiKeyVault = $('apiKeyVault');
    let apiVaultMeta = $('apiVaultMeta');
    let geminiVaultMeta = $('geminiVaultMeta');
    const memoryStatusChip = $('memoryStatusChip');
    const memoryPackSelect = $('memoryPackSelect');
    const memoryPackNameInput = $('memoryPackNameInput');
    const createMemoryPackBtn = $('createMemoryPackBtn');
    const deleteMemoryPackBtn = $('deleteMemoryPackBtn');
    const memoryPackMeta = $('memoryPackMeta');
    const memoryPromptExport = $('memoryPromptExport');
    const copyMemoryPromptBtn = $('copyMemoryPromptBtn');
    const memoryInput = $('memoryInput');
    const memoryMeta = $('memoryMeta');
    const importMemoryBtn = $('importMemoryBtn');
    const clearMemoryBtn = $('clearMemoryBtn');
    const memoryToolsToggle = $('memoryToolsToggle');
    const memoryToolsPanel = $('memoryToolsPanel');
    const glossaryInput = $('glossaryInput');
    const aiOutput = $('aiOutput');
    const expandAiOutputBtn = $('expandAiOutputBtn');
    const translateAiOutputBtn = $('translateAiOutputBtn');
    const outputStyleSelect = $('outputStyleSelect');
    const aiContextNote = $('aiContextNote');
    const askTranscriptInput = $('askTranscriptInput');
    const askTranscriptBtn = $('askTranscriptBtn');
    const workspaceFileInput = $('workspaceFileInput');
    const assistantShell = $('assistantShell');
    const assistantDock = document.querySelector('.assistant-dock');
    const copyBtn = $('copyBtn');
    const assistantPanel = $('assistantPanel');
    const assistantLauncher = $('assistantLauncher');
    const assistantUnread = $('assistantUnread');
    const assistantMessages = $('assistantMessages');
    const assistantInput = $('assistantInput');
    const assistantInputWrap = $('assistantInputWrap');
    const assistantRuntimeMeta = $('assistantRuntimeMeta');
    const assistantModelMeta = $('assistantModelMeta');
    const assistantModelSelect = $('assistantModelSelect');
    const assistantFileInput = $('assistantFileInput');
    const assistantAttachBtn = $('assistantAttachBtn');
    const assistantAttachmentPreview = $('assistantAttachmentPreview');
    const assistantAttachmentKind = $('assistantAttachmentKind');
    const assistantAttachmentMeta = $('assistantAttachmentMeta');
    const assistantAttachmentRemove = $('assistantAttachmentRemove');
    const assistantMicBtn = $('assistantMicBtn');
    const assistantHistoryPanel = $('assistantHistoryPanel');
    const assistantHistoryList = $('assistantHistoryList');
    const assistantEmpty = $('assistantEmpty');
    const assistantSend = $('assistantSend');
    const assistantHistoryBtn = $('assistantHistoryBtn');
    const assistantQuickNewBtn = $('assistantQuickNewBtn');
    const assistantNewChatBtn = $('assistantNewChatBtn');
    const assistantCopyLastBtn = $('assistantCopyLastBtn');
    const assistantClearBtn = $('assistantClearBtn');
    const assistantMinBtn = $('assistantMinBtn');
    const assistantMaxBtn = $('assistantMaxBtn');
    const assistantCloseBtn = $('assistantCloseBtn');

    if (apiProvider?.options?.[0]) apiProvider.options[0].textContent = 'Groq - whisper-large-v3-turbo recommended';
    if (apiProvider?.options?.[1]) apiProvider.options[1].textContent = 'OpenAI - whisper-1 secondary fallback';
    audioModelInput.placeholder = 'Speech model. Groq translation auto-switches to whisper-large-v3';
    chatModelInput.placeholder = 'Groq recommendation: openai/gpt-oss-120b';
    populateChatModelControls();
    populateAssistantModelControls();
    populateGeminiModelControls();
    if (apiNote) {
        apiNote.innerHTML = `
      Stored only in your browser localStorage. Keep shared copies of this HTML free of real keys.<br>
      Groq-first defaults: transcription whisper-large-v3-turbo, translation whisper-large-v3, AI cleanup openai/gpt-oss-120b, fast fallback openai/gpt-oss-20b.<br>
      Groq keys: <a href="https://console.groq.com/keys" target="_blank">console.groq.com/keys</a> |
      OpenAI fallback: <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a> |
      Gemini assistant files: <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com/app/apikey</a> |
      Free Gemini key: use Flash-Lite or Flash. Gemini 2.5 Pro is paid-key only.<br>
      <span id="apiVaultMeta">No extra keys saved</span><br>
      <span id="geminiVaultMeta">No keys stored for gemini</span>
    `;
        apiVaultMeta = $('apiVaultMeta');
        geminiVaultMeta = $('geminiVaultMeta');
    }

    function syncApiKeyToggleButton() {
        if (!apiKeyInput || !apiKeyToggleBtn) return;
        const showing = apiKeyInput.type === 'text';
        apiKeyToggleBtn.textContent = showing ? 'Hide' : 'Show';
        apiKeyToggleBtn.title = showing ? 'Hide API key' : 'Show API key';
        apiKeyToggleBtn.setAttribute('aria-label', showing ? 'Hide API key' : 'Show API key');
    }

    function syncGeminiKeyToggleButton() {
        if (!geminiKeyInput || !geminiKeyToggleBtn) return;
        const showing = geminiKeyInput.type === 'text';
        geminiKeyToggleBtn.textContent = showing ? 'Hide' : 'Show';
        geminiKeyToggleBtn.title = showing ? 'Hide Gemini API key' : 'Show Gemini API key';
        geminiKeyToggleBtn.setAttribute('aria-label', showing ? 'Hide Gemini API key' : 'Show Gemini API key');
    }

    function isTouchPrimary() {
        return !!(runtimeCapabilities.isMobile || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
    }

    function getCaptureSourceLabel(source = state.captureSource) {
        return ({
            mic: 'Microphone',
            'browser-tab': 'Browser tab audio',
            'screen-audio': 'Screen + system audio',
            'external-help': 'External app / phone help'
        })[source] || 'Microphone';
    }

    function canUseLiveMode() {
        return !!runtimeCapabilities.hasSpeechRecognition;
    }

    function canUseQualityMode(source = state.captureSource) {
        if (source === 'mic') return !!runtimeCapabilities.supportsMicQuality;
        return !!runtimeCapabilities.supportsTabOrScreenCapture;
    }

    function getIdleHint() {
        return isTouchPrimary() ? 'Tap the orb to start' : 'Click orb or press Space';
    }

    function getActiveHint() {
        return isTouchPrimary() ? 'Speak now - tap the orb to stop' : 'Speak now - tap the orb or press Space to stop';
    }

    function isCompactSidebarViewport() {
        return !!(window.matchMedia && window.matchMedia('(max-width: 767px)').matches);
    }

    function setTopbarMobileDrawerOpen(open) {
        const next = !!open && isCompactSidebarViewport();
        topbarMobileDrawer?.classList.toggle('open', next);
        topbarControlsBtn?.classList.toggle('is-open', next);
        topbarControlsBtn?.setAttribute('aria-expanded', next ? 'true' : 'false');
    }

    function buildWorkspaceViews() {
        if (!workspaceMain || workspaceMain.querySelector('.workspace-view-stage')) return;

        const createWorkspaceView = (name, kicker, title, copy) => {
            const section = document.createElement('section');
            section.className = 'workspace-view';
            section.dataset.workspaceView = name;
            section.hidden = true;
            section.innerHTML = `
                      <div class="workspace-view-head">
                        <div class="workspace-view-kicker">${kicker}</div>
                        <div class="workspace-view-title">${title}</div>
                        <div class="workspace-view-copy">${copy}</div>
                      </div>
                      <div class="workspace-view-body"></div>
                    `;
            return { section, body: section.querySelector('.workspace-view-body') };
        };

        const viewStage = document.createElement('div');
        viewStage.className = 'workspace-view-stage page-content';
        viewStage.id = 'workspaceViewStage';

        const views = {
            record: createWorkspaceView('record', 'Session', 'Recording workspace', 'Runtime status and live session summary for the current capture.'),
            capture: createWorkspaceView('capture', 'Input', 'Capture setup', 'Choose the source, verify compatibility, and review capture guidance.'),
            transcript: createWorkspaceView('transcript', 'Transcript', 'Verbatim transcript', 'Edit the transcript directly and switch between plain and timestamped reading.'),
            translation: createWorkspaceView('translation', 'Translation', 'Translated output', 'Monitor translated text, sentiment, and language output in one focused panel.'),
            'ai-output': createWorkspaceView('ai-output', 'AI', 'AI output', 'Run AI cleanups, summaries, actions, and transcript Q&A without leaving the workspace.'),
            memory: createWorkspaceView('memory', 'Memory', 'Imported memory', 'Manage memory packs, imports, and workspace grounding tools.'),
            tools: createWorkspaceView('tools', 'Utilities', 'Transcript tools', 'Download, copy history, clear content, and recover previous text.'),
            settings: createWorkspaceView('settings', 'Workspace', 'Studio settings', 'Tune presets, punctuation, autosave, diagnostics, and keyboard help.')
        };

        Object.values(views).forEach(({ section }) => viewStage.appendChild(section));
        workspaceMain.appendChild(viewStage);

        const recordSplit = document.createElement('div');
        recordSplit.className = 'workspace-record-split';
        const recordStageHost = document.createElement('div');
        recordStageHost.className = 'workspace-record-stage';
        recordStageHost.id = 'recordStageHost';
        const recordTranscriptHost = document.createElement('div');
        recordTranscriptHost.className = 'workspace-record-transcript';
        recordTranscriptHost.id = 'recordTranscriptHost';
        recordSplit.append(recordStageHost, recordTranscriptHost);
        const transcriptStandaloneHost = document.createElement('div');
        transcriptStandaloneHost.className = 'workspace-transcript-standalone';
        transcriptStandaloneHost.id = 'transcriptStandaloneHost';
        const captureLiveSplit = document.createElement('div');
        captureLiveSplit.className = 'capture-live-split workspace-record-split';
        captureLiveSplit.id = 'captureLiveSplit';
        captureLiveSplit.innerHTML = `
          <div class="workspace-record-stage">
            <div class="rec-panel" id="captureRecOrbCard">
              <div class="rec-hero">
                <div class="orb-panel">
                  <div class="rec-orb-stage orb-stage ready" id="captureOrbStage" role="button" tabindex="0" aria-label="Toggle recording from capture orb" aria-pressed="false">
                    <div class="orb-status-bar orb-status-main" id="captureOrbStatus">READY TO CAPTURE</div>
                    <div class="orb-halo" id="captureOrbHalo" aria-hidden="true"></div>
                    <div class="orb-rings" id="captureOrbRings" aria-hidden="true">
                      <span class="ring orb-ring ring-1"></span>
                      <span class="ring orb-ring ring-2"></span>
                      <span class="ring orb-ring ring-3"></span>
                    </div>
                    <div class="orb-sphere waveform-wrap idle" id="captureOrbSphere">
                      <canvas id="captureWaveCanvas"></canvas>
                      <div class="waveform-overlay" id="captureWaveOverlay"></div>
                    </div>
                    <div class="orb-waveform" id="captureOrbWaveform" aria-hidden="true">
                      <span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span>
                    </div>
                    <div class="orb-runtime sr-only-live">
                      <div class="orb-timer-display" id="captureOrbTimerDisplay">00:00</div>
                    </div>
                    <div class="status-main sr-only-live" id="captureStatusMain">Ready to capture</div>
                    <div class="status-sub sr-only-live" id="captureStatusSub">Use the selected source to capture</div>
                    <div class="timer-display sr-only-live" id="captureTimerDisplay">00:00</div>
                  </div>
                </div>
              </div>
              <div class="interim-box">
                <div class="live-dot"></div>
                <div id="captureInterimEl" class="interim-text idle-hint">Captured audio transcription appears here...</div>
              </div>
              <div class="autocopy-bar" id="captureAutoCopyBar"><div class="autocopy-fill" id="captureAutoCopyFill"></div></div>
            </div>
          </div>
          <div class="workspace-record-transcript" id="captureTranscriptHost"></div>
        `;

        const transcriptViewBar = document.createElement('div');
        transcriptViewBar.className = 'utility-card workspace-transcript-toolbar';
        transcriptViewBar.id = 'transcriptViewToolbar';
        transcriptViewBar.innerHTML = `
                  <div class="utility-card-head">
                    <span class="utility-card-kicker">Read mode</span>
                    <div class="utility-card-title">Transcript view</div>
                  </div>
                `;
        const transcriptToggle = transcriptToolsCard?.querySelector('.view-toggle');
        if (transcriptToggle) transcriptViewBar.appendChild(transcriptToggle);

        if (uploadPanel) recordStageHost.appendChild(uploadPanel);
        if (recPanel) recordStageHost.appendChild(recPanel);
        if (sessionSummaryCard) recordStageHost.appendChild(sessionSummaryCard);
        if (transcriptPanelCard) recordTranscriptHost.appendChild(transcriptPanelCard);
        if (transcriptViewBar) recordTranscriptHost.appendChild(transcriptViewBar);
        views.record.body.appendChild(recordSplit);
        views.transcript.body.appendChild(transcriptStandaloneHost);
        if (translationPanel) views.translation.body.appendChild(translationPanel);
        if (captureSupportCard) views.capture.body.appendChild(captureSupportCard);
        views.capture.body.appendChild(captureLiveSplit);
        if (shortcutsCard) views.settings.body.appendChild(shortcutsCard);
        if (aiOutputCard) views['ai-output'].body.appendChild(aiOutputCard);
        if (memoryPanel) views.memory.body.appendChild(memoryPanel);
        if (studioSettingsPanel) views.settings.body.appendChild(studioSettingsPanel);
        if (diagnosticsPanel) views.settings.body.appendChild(diagnosticsPanel);
        if (transcriptToolsCard) views.tools.body.appendChild(transcriptToolsCard);
        if (historyPanel) views.tools.body.appendChild(historyPanel);
        if (assistantDock) {
            if (copyBtn) assistantDock.appendChild(copyBtn);
            if (historyBtn) assistantDock.appendChild(historyBtn);
            if (clearBtn) assistantDock.appendChild(clearBtn);
            if (assistantLauncher) assistantDock.appendChild(assistantLauncher);
        }

        dualTranscriptGrid?.remove();
        studioGridSingle?.remove();
        workspaceRightRail?.remove();
    }

    function syncWorkspaceViewUi() {
        const active = String(state.workspaceView || 'transcript');
        document.querySelectorAll('.workspace-view').forEach((view) => {
            const isActive = view.dataset.workspaceView === active;
            view.hidden = !isActive;
            view.classList.toggle('is-active', isActive);
        });
        workspaceNavButtons.forEach((btn) => {
            const isActive = btn.dataset.view === active;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        syncRecordTranslationSplit();
    }

    function syncSlidingPill(containerSelector, activeSelector, pillSelector) {
        try {
            const container = document.querySelector(containerSelector);
            const active = container?.querySelector(activeSelector);
            const pill = container?.querySelector(pillSelector);
            if (!container || !active || !pill) return;
            pill.style.width = `${active.offsetWidth}px`;
            pill.style.transform = `translateX(${active.offsetLeft}px)`;
        } catch (err) {
            console.warn('Sliding pill sync failed', err);
        }
    }

    function syncInteractiveChrome() {
        syncSlidingPill('.mode-toggle', '.mode-btn.active', '.mode-pill');
        syncSlidingPill('.view-toggle', '.view-btn.active', '.view-pill');
    }

    function animateWorkspaceViewStage() {
        const stage = $('workspaceViewStage');
        if (!stage || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
        stage.classList.remove('page-enter');
        void stage.offsetWidth;
        stage.classList.add('page-enter');
        clearTimeout(animateWorkspaceViewStage._timer);
        animateWorkspaceViewStage._timer = setTimeout(() => stage.classList.remove('page-enter'), 180);
    }

    function formatCounterLabel(value, unit) {
        return `${value} ${unit}${value === 1 ? '' : 's'}`;
    }

    function animateCount(el, nextValue, formatter) {
        if (!el) return;
        const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const currentValue = Number(el.dataset.countValue || 0);
        if (reducedMotion || currentValue === nextValue) {
            el.dataset.countValue = String(nextValue);
            el.textContent = formatter(nextValue);
            return;
        }
        const start = performance.now();
        const duration = 260;
        const delta = nextValue - currentValue;
        el.classList.remove('is-flashing');
        void el.offsetWidth;
        el.classList.add('is-flashing');
        const tick = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(currentValue + delta * eased);
            el.textContent = formatter(value);
            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                el.dataset.countValue = String(nextValue);
            }
        };
        requestAnimationFrame(tick);
    }

    function lucideIconMarkup(name) {
        const icons = {
            record: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z"></path><path d="M19 10a7 7 0 0 1-14 0"></path><path d="M12 19v3"></path><path d="M8 22h8"></path></svg>',
            capture: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Z"></path><path d="m22 8-6 4 6 4V8Z"></path></svg>',
            transcript: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"></path><path d="M4 12h10"></path><path d="M4 17h16"></path></svg>',
            translation: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"></path></svg>',
            'ai-output': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.8L19 9.7l-4 3.2 1.2 5.1L12 15.8 7.8 18l1.2-5.1-4-3.2 5.1-1.9L12 3Z"></path></svg>',
            memory: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="7" ry="3"></ellipse><path d="M5 5v14c0 1.7 3.1 3 7 3s7-1.3 7-3V5"></path><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"></path></svg>',
            tools: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M4 21h16"></path><path d="M4 17h16"></path></svg>',
            settings: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21v-7"></path><path d="M4 10V3"></path><path d="M12 21v-9"></path><path d="M12 8V3"></path><path d="M20 21v-5"></path><path d="M20 12V3"></path><path d="M2 14h4"></path><path d="M10 8h4"></path><path d="M18 16h4"></path></svg>'
        };
        return icons[name] || icons.transcript;
    }

    function applyWorkspaceNavIcons() {
        workspaceNavButtons.forEach((btn) => {
            const iconWrap = btn.querySelector('.workspace-nav-icon');
            if (!iconWrap) return;
            iconWrap.innerHTML = lucideIconMarkup(btn.dataset.view || 'transcript');
        });
    }

    function syncRecordTranslationSplit() {
        const recordTranscriptHost = $('recordTranscriptHost');
        if (!recordTranscriptHost || !translationPanel) return;

        const inRecordView = state.workspaceView === 'record';
        const translationEnabled = !!state.translation?.enabled;
        const shouldEmbed = inRecordView && translationEnabled;

        if (shouldEmbed) {
            // Move translation panel into record transcript host
            if (translationPanel.parentElement !== recordTranscriptHost) {
                recordTranscriptHost.appendChild(translationPanel);
            }
            recordTranscriptHost.classList.add('has-translation');
            translationPanel.style.display = '';
        } else {
            // Move translation panel back to its own view
            const translationViewBody = document.querySelector('[data-workspace-view="translation"] .workspace-view-body');
            if (translationViewBody && translationPanel.parentElement !== translationViewBody) {
                translationViewBody.appendChild(translationPanel);
            }
            recordTranscriptHost.classList.remove('has-translation');
        }
    }

    function setWorkspaceView(view, { persist = true, closeMobile = true, animate = true } = {}) {
        const allowed = new Set(['record', 'capture', 'transcript', 'translation', 'ai-output', 'memory', 'tools', 'settings']);
        state.workspaceView = allowed.has(view) ? view : 'transcript';
        if (persist) localStorage.setItem('vt_workspace_view', state.workspaceView);
        const recordStageHost = $('recordStageHost');
        const recordTranscriptHost = $('recordTranscriptHost');
        const captureTranscriptHost = $('captureTranscriptHost');
        const transcriptStandaloneHost = $('transcriptStandaloneHost');
        const transcriptViewToolbar = $('transcriptViewToolbar');
        if (state.workspaceView === 'transcript') {
            if (transcriptStandaloneHost && transcriptViewToolbar) transcriptStandaloneHost.appendChild(transcriptViewToolbar);
            if (transcriptStandaloneHost && transcriptPanelCard) transcriptStandaloneHost.appendChild(transcriptPanelCard);
        } else if (state.workspaceView === 'capture') {
            if (captureTranscriptHost && transcriptPanelCard) captureTranscriptHost.appendChild(transcriptPanelCard);
        } else {
            if (recordTranscriptHost && transcriptViewToolbar) recordTranscriptHost.appendChild(transcriptViewToolbar);
            if (recordTranscriptHost && transcriptPanelCard) recordTranscriptHost.appendChild(transcriptPanelCard);
        }
        if (state.workspaceView === 'ai-output') setAiOutputOpen(true);
        if (state.workspaceView === 'settings' && studioSettingsPanel) studioSettingsPanel.open = true;
        syncWorkspaceViewUi();
        syncInteractiveChrome();
        if (animate) animateWorkspaceViewStage();
        if (closeMobile && isCompactSidebarViewport()) setSidebarMobileOpen(false);
    }

    function navigateToWorkspaceView(view) {
        try {
            const stage = $('workspaceViewStage');
            if (!stage || state.workspaceView === view || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
                setWorkspaceView(view);
                return;
            }
            clearTimeout(navigateToWorkspaceView._timer);
            stage.classList.remove('page-enter');
            stage.classList.add('page-exit');
            navigateToWorkspaceView._timer = setTimeout(() => {
                stage.classList.remove('page-exit');
                setWorkspaceView(view, { animate: false });
                stage.classList.add('page-enter');
                clearTimeout(animateWorkspaceViewStage._timer);
                animateWorkspaceViewStage._timer = setTimeout(() => stage.classList.remove('page-enter'), 180);
            }, 130);
        } catch (err) {
            console.warn('Workspace navigation transition failed', err);
            setWorkspaceView(view);
        }
    }

    function setApiPanelOpen(isOpen) {
        const open = !!isOpen;
        apiPanel?.classList.toggle('open', open);
        apiHeader?.classList.toggle('open', open);
    }

    function openHelpModal() {
        if (!helpModalOverlay) return;
        helpModalOverlay.hidden = false;
        helpModalOverlay.classList.remove('is-closing');
        helpModalOverlay.classList.add('is-open');
    }

    function closeHelpModal() {
        if (!helpModalOverlay || helpModalOverlay.hidden) return;
        helpModalOverlay.classList.remove('is-open');
        helpModalOverlay.classList.add('is-closing');
        setTimeout(() => {
            helpModalOverlay.hidden = true;
            helpModalOverlay.classList.remove('is-closing');
        }, 150);
    }

    function syncSidebarUi() {
        const width = 220;
        state.sidebarWidth = width;
        const collapsedWidth = 48;
        document.documentElement.style.setProperty('--workspace-sidebar-width', `${width}px`);
        document.documentElement.style.setProperty('--workspace-sidebar-collapsed-width', `${collapsedWidth}px`);
        document.body.classList.toggle('sidebar-collapsed', !isCompactSidebarViewport() && !!state.sidebarCollapsed);
        document.body.classList.toggle('sidebar-mobile-open', !!state.sidebarMobileOpen && isCompactSidebarViewport());
        workspaceSidebar?.classList.toggle('collapsed', !isCompactSidebarViewport() && !!state.sidebarCollapsed);
        if (workspaceSidebarBackdrop) workspaceSidebarBackdrop.hidden = !(!!state.sidebarMobileOpen && isCompactSidebarViewport());
        if (workspaceSidebarBtn) {
            const expanded = isCompactSidebarViewport() ? !!state.sidebarMobileOpen : !state.sidebarCollapsed;
            workspaceSidebarBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            const label = isCompactSidebarViewport()
                ? (state.sidebarMobileOpen ? 'Close navigation' : 'Navigation')
                : (state.sidebarCollapsed ? 'Open sidebar' : 'Close sidebar');
            workspaceSidebarBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></svg><span class="topbar-menu-label">${label}</span>`;
        }
        if (workspaceSidebarFab) {
            workspaceSidebarFab.hidden = true;
            workspaceSidebarFab.setAttribute('aria-expanded', state.sidebarMobileOpen ? 'true' : 'false');
        }
        if (workspaceSidebarCloseBtn) workspaceSidebarCloseBtn.hidden = !isCompactSidebarViewport();
        if (sidebarWidthRange) sidebarWidthRange.value = String(width);
        if (sidebarWidthMeta) sidebarWidthMeta.textContent = `${width}px width`;
        if (sidebarCollapseBtn) {
            sidebarCollapseBtn.textContent = isCompactSidebarViewport()
                ? (state.sidebarMobileOpen ? 'Close sidebar' : 'Open sidebar')
                : (state.sidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar');
        }
        if (workspaceSidebarCollapseBtn) {
            workspaceSidebarCollapseBtn.setAttribute('aria-label', isCompactSidebarViewport()
                ? 'Close sidebar'
                : (state.sidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'));
            workspaceSidebarCollapseBtn.title = isCompactSidebarViewport()
                ? 'Close sidebar'
                : (state.sidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar');
            workspaceSidebarCollapseBtn.classList.toggle('is-collapsed', !isCompactSidebarViewport() && !!state.sidebarCollapsed);
        }
        if (sidebarWidthRange) sidebarWidthRange.disabled = true;
        if (workspaceSidebarSettings) workspaceSidebarSettings.open = !state.sidebarCollapsed && !isCompactSidebarViewport();
        if (workspaceShell) workspaceShell.classList.toggle('sidebar-is-hidden', false);
    }

    function setSidebarCollapsed(collapsed) {
        state.sidebarCollapsed = !!collapsed;
        safeLocalStorageSet('vt_sidebar_collapsed', state.sidebarCollapsed ? '1' : '0');
        syncSidebarUi();
    }

    function setSidebarMobileOpen(open) {
        state.sidebarMobileOpen = !!open;
        if (state.sidebarMobileOpen) setTopbarMobileDrawerOpen(false);
        syncSidebarUi();
    }

    function setSidebarWidth(width) {
        state.sidebarWidth = 220;
        localStorage.setItem('vt_sidebar_width', '220');
        syncSidebarUi();
    }

    function getReadyStatusForCurrentState(mode = state.mode, source = state.captureSource) {
        if (source === 'external-help') return { main: 'Capture setup help', sub: 'Open Capture Help for Zoom, Meet, Safari, and phone guidance' };
        if (mode === 'quality' && source === 'browser-tab') return { main: 'Ready for tab audio', sub: 'Share the browser tab with audio, then stop to transcribe' };
        if (mode === 'quality' && source === 'screen-audio') return { main: 'Ready for system audio', sub: 'Share the screen or app audio, then stop to transcribe' };
        if (mode === 'quality') return { main: 'Ready to record', sub: 'Quality mode records first, then transcribes' };
        if (!canUseLiveMode()) return { main: 'Live mode limited here', sub: 'Use Quality or File mode in this browser' };
        return { main: 'Ready to record', sub: getIdleHint() };
    }

    function getActiveStatusForCurrentState(mode = state.mode, source = state.captureSource) {
        if (mode === 'quality' && source === 'browser-tab') return { main: 'Recording tab audio', sub: 'Keep the shared tab audio live until you stop' };
        if (mode === 'quality' && source === 'screen-audio') return { main: 'Recording system audio', sub: 'Keep the shared screen audio live until you stop' };
        if (mode === 'quality') return { main: 'Recording quality audio', sub: getActiveHint() };
        return { main: 'Recording', sub: getActiveHint() };
    }

    function getLiveRecognitionLang() {
        const selected = String(langSelect?.value || 'auto').trim();
        if (!selected || selected === 'auto') return '';
        if (selected.includes('-')) return selected;
        return getSpeechRecognitionLocale(selected);
    }

    function markLiveHealth(delta = 0, reason = '', mode = state.liveHealth.mode || 'live') {
        const next = Math.max(0, Math.min(1, Number(state.liveHealth.score || 1) + delta));
        state.liveHealth.score = next;
        state.liveHealth.mode = mode;
        state.liveHealth.lastReason = reason || state.liveHealth.lastReason || '';
        state.liveHealth.activeLanguage = langSelect?.value || 'auto';
        state.liveHealth.lastUpdatedAt = Date.now();
        updateDiagnostics({
            liveHealth: next.toFixed(2),
            liveMode: state.liveHealth.mode,
            liveFallbackUses: state.liveHealth.fallbackUses || 0,
            liveLanguage: state.liveHealth.activeLanguage || 'auto'
        }, reason || `Live health ${next.toFixed(2)}`);
    }

    function normalizeLiveTranscriptCandidate(text = '', conf = 0, language = '') {
        let out = String(text || '').replace(/\s+/g, ' ').trim();
        if (!out) return '';
        if (conf < 0.88) {
            out = out.replace(/\b(\S+)(?:\s+\1\b)+/gi, '$1');
            out = out.replace(/([^\s])\s+([,.!?])/g, '$1$2');
            out = out.replace(/(^|\s)([A-Za-z])\s+(?=[A-Za-z]{2,}\b)/g, '$1$2');
            out = out.replace(/\b(um+|uh+|ah+)\b/gi, '');
            out = out.replace(/\b([A-Za-z]{1,2})\s+(?=[A-Za-z]{1,2}\b)/g, '$1');
        }
        if (language && !/^en/i.test(language) && conf < 0.8) {
            out = out.replace(/\s{2,}/g, ' ');
        }
        out = out.replace(/\s{2,}/g, ' ').trim();
        return applyGlossaryToText(out);
    }

    function scoreRecognitionAlternative(alt, language) {
        const text = normalizeLiveTranscriptCandidate(alt?.transcript || '', alt?.confidence || 0, language);
        if (!text) return -Infinity;
        const conf = Number.isFinite(alt?.confidence) ? alt.confidence : 0;
        const words = text.split(/\s+/).filter(Boolean);
        const nonLatinWeight = /[^\u0000-\u007f]/.test(text) ? 0.08 : 0;
        const sameLangWeight = language && !/^en/i.test(language) && /[A-Za-z]/.test(text) ? -0.06 : 0;
        return conf + Math.min(0.18, words.length * 0.025) + nonLatinWeight + sameLangWeight;
    }

    function pickRecognitionCandidate(resultList, language) {
        const choices = Array.from(resultList || []).map(item => ({
            transcript: String(item?.transcript || '').trim(),
            confidence: Number.isFinite(item?.confidence) ? item.confidence : 0
        })).filter(item => item.transcript);
        if (!choices.length) return { text: '', confidence: 0, alternatives: [] };
        const ranked = [...choices].sort((a, b) => scoreRecognitionAlternative(b, language) - scoreRecognitionAlternative(a, language));
        const best = ranked[0];
        return {
            text: normalizeLiveTranscriptCandidate(best.transcript, best.confidence, language),
            confidence: best.confidence || 0,
            alternatives: ranked.slice(0, 3).map(item => normalizeLiveTranscriptCandidate(item.transcript, item.confidence, language)).filter(Boolean)
        };
    }

    function schedulePendingRealtimeCommit(text, conf, meta = {}) {
        clearTimeout(state.realtimeCommitTimer);
        state.realtimePendingSegment = {
            text,
            conf,
            meta: { ...meta },
            queuedAt: Date.now()
        };
            state.realtimeCommitTimer = setTimeout(() => {
                const pending = state.realtimePendingSegment;
                state.realtimePendingSegment = null;
                state.realtimeCommitTimer = null;
                if (!pending?.text) return;
                addSegment(pending.text, pending.conf, pending.meta.time, pending.meta.lang, pending.meta);
                state.confirmedText = transcript.value;
                state.lastInterimText = '';
                state.lastInterimAlternatives = [];
                interimEl.textContent = '';
                interimEl.classList.remove('idle-hint');
                updateCaptureInterim('');
                syncCaptureTranscript();
                state.lastEndTime = Date.now();
            }, REALTIME_FINAL_COMMIT_DELAY_MS);
    }

    function flushPendingRealtimeSegment(force = false) {
        const pending = state.realtimePendingSegment;
        if (!pending?.text) return false;
        clearTimeout(state.realtimeCommitTimer);
        state.realtimeCommitTimer = null;
        state.realtimePendingSegment = null;
        addSegment(pending.text, pending.conf, pending.meta?.time, pending.meta?.lang, {
            ...pending.meta,
            provisional: !force
        });
        state.confirmedText = transcript.value;
        state.lastEndTime = Date.now();
        return true;
    }

    async function startRealtimeAudioBuffer() {
        if (state.liveAudioBuffer.recorder || !navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: false
        });
        const mimeType = pickRecorderMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        state.liveAudioBuffer = {
            stream,
            recorder,
            mimeType: recorder.mimeType || mimeType || 'audio/webm',
            chunks: [],
            startedAt: Date.now()
        };
        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) state.liveAudioBuffer.chunks.push(e.data);
        };
        recorder.start(900);
    }

    function stopRealtimeAudioBuffer(discard = false) {
        return new Promise((resolve) => {
            const { recorder, stream, chunks, mimeType, startedAt } = state.liveAudioBuffer || {};
            const reset = () => {
                try { stream?.getTracks?.().forEach(track => track.stop()); } catch (e) { }
                state.liveAudioBuffer = { stream: null, recorder: null, mimeType: '', chunks: [], startedAt: 0 };
            };
            if (!recorder || recorder.state === 'inactive') {
                const blob = !discard && chunks?.length ? new Blob(chunks, { type: mimeType || 'audio/webm' }) : null;
                reset();
                resolve(blob ? { blob, startedAt, mimeType } : null);
                return;
            }
            recorder.onstop = () => {
                const blob = !discard && state.liveAudioBuffer.chunks.length
                    ? new Blob(state.liveAudioBuffer.chunks, { type: state.liveAudioBuffer.mimeType || 'audio/webm' })
                    : null;
                const meta = blob ? { blob, startedAt: state.liveAudioBuffer.startedAt, mimeType: state.liveAudioBuffer.mimeType } : null;
                reset();
                resolve(meta);
            };
            recorder.stop();
        });
    }

    function stopTracks(stream) {
        try { stream?.getTracks?.().forEach(track => track.stop()); } catch (e) { }
    }

    function stopActiveCaptureTracks() {
        const primary = state.micStream;
        const session = state.captureSessionStream;
        if (primary && primary !== session) stopTracks(primary);
        stopTracks(session);
        state.micStream = null;
        state.captureSessionStream = null;
    }

    function pickRecorderMimeType() {
        if (typeof MediaRecorder === 'undefined') return '';
        const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'video/mp4', 'audio/ogg;codecs=opus'];
        for (const mimeType of candidates) {
            try {
                if (typeof MediaRecorder.isTypeSupported !== 'function' || MediaRecorder.isTypeSupported(mimeType)) return mimeType;
            } catch (e) { }
        }
        return '';
    }

    function setCaptureHelpOpen(nextOpen) {
        state.captureHelpOpen = !!nextOpen;
        if (captureHelpPanel) captureHelpPanel.hidden = !state.captureHelpOpen;
        captureHelpToggle?.classList.toggle('active', state.captureHelpOpen);
        captureHelpToggle?.setAttribute('aria-expanded', state.captureHelpOpen ? 'true' : 'false');
    }

    function setShortcutsOpen(nextOpen) {
        const open = !!nextOpen;
        if (shortcutsPanel) shortcutsPanel.hidden = !open;
        shortcutsToggle?.classList.toggle('active', open);
        shortcutsToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function setAiOutputOpen(nextOpen) {
        const open = !!nextOpen;
        if (aiOutputPanel) aiOutputPanel.hidden = !open;
        aiOutputToggle?.classList.toggle('active', open);
        aiOutputToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function setMemoryToolsOpen(nextOpen) {
        const open = !!nextOpen;
        if (memoryToolsPanel) memoryToolsPanel.hidden = !open;
        memoryToolsToggle?.classList.toggle('active', open);
        memoryToolsToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function normalizeMemoryPacks(packs = []) {
        const list = Array.isArray(packs) ? packs : [];
        const normalized = list.map((pack, index) => ({
            id: String(pack?.id || `memory_${Date.now()}_${index}`),
            name: String(pack?.name || `Pack ${index + 1}`).trim() || `Pack ${index + 1}`,
            raw: normalizeImportedMemory(pack?.raw || ''),
            importedAt: String(pack?.importedAt || '')
        }));
        if (!normalized.length) {
            normalized.push({
                id: 'memory_primary',
                name: 'Primary',
                raw: normalizeImportedMemory(state.memoryRaw || ''),
                importedAt: String(state.memoryImportedAt || '')
            });
        }
        return normalized;
    }

    function getActiveMemoryPack() {
        return (state.memoryPacks || []).find(pack => pack.id === state.activeMemoryPackId) || state.memoryPacks?.[0] || null;
    }

    function syncActiveMemoryPackState() {
        const active = getActiveMemoryPack();
        if (!active) {
            state.memoryRaw = '';
            state.memoryImportedAt = '';
            return;
        }
        state.activeMemoryPackId = active.id;
        state.memoryRaw = normalizeImportedMemory(active.raw || '');
        state.memoryImportedAt = active.importedAt || '';
    }

    function persistMemoryPacksStore() {
        localStorage.setItem('vt_memory_packs', JSON.stringify(state.memoryPacks || []));
        localStorage.setItem('vt_memory_pack_active', state.activeMemoryPackId || '');
        localStorage.setItem('vt_memory_raw', state.memoryRaw || '');
        localStorage.setItem('vt_memory_imported_at', state.memoryImportedAt || '');
        localStorage.setItem('vt_output_style', state.outputStyle || 'default');
    }

    function ensureMemoryPackStore() {
        state.memoryPacks = normalizeMemoryPacks(state.memoryPacks);
        if (!state.activeMemoryPackId || !state.memoryPacks.some(pack => pack.id === state.activeMemoryPackId)) {
            state.activeMemoryPackId = state.memoryPacks[0]?.id || 'memory_primary';
        }
        syncActiveMemoryPackState();
        persistMemoryPacksStore();
    }

    function setActiveMemoryPack(packId) {
        if (!packId) return;
        if (!state.memoryPacks.some(pack => pack.id === packId)) return;
        state.activeMemoryPackId = packId;
        syncActiveMemoryPackState();
        persistMemoryPacksStore();
        renderMemoryUi();
        renderAssistantMessages();
        scheduleWorkspaceSave();
    }

    function createMemoryPack(name) {
        const cleanName = String(name || '').trim();
        if (!cleanName) {
            toast('Enter a memory pack name first', 'warning');
            return;
        }
        const id = `memory_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        state.memoryPacks.push({ id, name: cleanName, raw: '', importedAt: '' });
        state.activeMemoryPackId = id;
        syncActiveMemoryPackState();
        persistMemoryPacksStore();
        renderMemoryUi();
        renderAssistantMessages();
        scheduleWorkspaceSave();
        if (memoryPackNameInput) memoryPackNameInput.value = '';
        toast('Memory pack created', 'success');
    }

    function deleteActiveMemoryPack() {
        const active = getActiveMemoryPack();
        if (!active) return;
        if ((state.memoryPacks || []).length <= 1) {
            active.raw = '';
            active.importedAt = '';
            syncActiveMemoryPackState();
            persistMemoryPacksStore();
            renderMemoryUi();
            renderAssistantMessages();
            scheduleWorkspaceSave();
            toast('Primary memory pack cleared', 'info');
            return;
        }
        state.memoryPacks = (state.memoryPacks || []).filter(pack => pack.id !== active.id);
        state.activeMemoryPackId = state.memoryPacks[0]?.id || '';
        syncActiveMemoryPackState();
        persistMemoryPacksStore();
        renderMemoryUi();
        renderAssistantMessages();
        scheduleWorkspaceSave();
        toast('Memory pack deleted', 'info');
    }

    function getOutputStyleInstruction(style = state.outputStyle) {
        const map = {
            default: 'Use a balanced, practical style that is clear and directly useful.',
            concise: 'Keep the response compact, sharp, and low-fluff. Prioritize signal over explanation.',
            executive: 'Write for a busy executive. Lead with decisions, risks, and impact. Keep it polished.',
            technical: 'Write for an engineer. Be precise, structured, and implementation-aware.',
            founder: 'Write like a strong founder/operator brief. Focus on priorities, tradeoffs, leverage, and next moves.',
            'client-ready': 'Write as polished client-facing output with clarity, professionalism, and clean wording.',
            'meeting-notes': 'Write as clean meeting notes with clear sections, outcomes, owners, and next steps.'
        };
        return map[style] || map.default;
    }

    function normalizeImportedMemory(text = '') {
        let value = String(text || '').replace(/\r\n/g, '\n').trim();
        value = value.replace(/^```[a-zA-Z0-9_-]*\s*/m, '').replace(/\s*```$/m, '').trim();
        return value;
    }

    function formatRelativeMemoryTime(iso = '') {
        if (!iso) return 'unknown time';
        const ts = Date.parse(iso);
        if (!Number.isFinite(ts)) return 'unknown time';
        const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
        if (diffMin < 1) return 'just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        const diffDay = Math.floor(diffHr / 24);
        return `${diffDay}d ago`;
    }

    function getImportedMemoryContext({ maxChars = 9000 } = {}) {
        const raw = normalizeImportedMemory(state.memoryRaw || '');
        if (!raw) return '';
        const compact = raw.length > maxChars
            ? `${raw.slice(0, maxChars).trim()}\n\n[Imported memory truncated for token control]`
            : raw;
        return [
            'Imported user memory and long-term context:',
            'Use this for preferences, ongoing projects, terminology, and stable background context.',
            'If transcript or runtime state conflicts with memory, trust the transcript/runtime state first.',
            '',
            compact
        ].join('\n');
    }

    function getTaskMemoryGuidance(taskName = '') {
        if (taskName === 'ai-clean') {
            return 'Use memory lightly for terminology, proper nouns, and writing preferences. Do not inject unrelated facts.';
        }
        if (taskName === 'summary') {
            return 'Use memory strongly to prioritize what matters most to this user, their projects, and their preferred output style.';
        }
        if (taskName === 'action-items') {
            return 'Use memory to interpret project context and likely priorities, but only derive action items from what the transcript supports.';
        }
        if (String(taskName || '').startsWith('prompt-pack')) {
            return 'Use memory strongly to tailor the prompt structure, requirements, and context to this user and their ongoing work.';
        }
        return 'Use memory when it improves relevance, but do not override transcript facts.';
    }

    function renderMemoryUi() {
        if (memoryPromptExport) memoryPromptExport.value = MEMORY_IMPORT_PROMPT;
        if (memoryInput && document.activeElement !== memoryInput) memoryInput.value = state.memoryRaw || '';
        const imported = normalizeImportedMemory(state.memoryRaw || '');
        if (memoryStatusChip) {
            memoryStatusChip.textContent = imported
                ? `Memory loaded • ${formatRelativeMemoryTime(state.memoryImportedAt)}`
                : 'No memory loaded';
        }
        if (memoryMeta) {
            memoryMeta.textContent = imported
                ? `Imported ${imported.length.toLocaleString()} characters. AI Output and Verba Assistant will use this memory automatically. Last updated ${formatRelativeMemoryTime(state.memoryImportedAt)}.`
                : 'No imported memory yet. Once saved, it will ground summaries, action items, prompt packs, AI clean, and assistant replies.';
        }
    }

    function persistMemoryStore() {
        localStorage.setItem('vt_memory_raw', state.memoryRaw || '');
        localStorage.setItem('vt_memory_imported_at', state.memoryImportedAt || '');
    }

    function setImportedMemory(rawText, { announce = true } = {}) {
        const normalized = normalizeImportedMemory(rawText);
        state.memoryRaw = normalized;
        state.memoryImportedAt = normalized ? new Date().toISOString() : '';
        persistMemoryStore();
        renderMemoryUi();
        renderAssistantMessages();
        scheduleWorkspaceSave();
        if (announce) {
            toast(normalized ? 'Memory imported' : 'Memory cleared', normalized ? 'success' : 'info');
        }
    }

    function getCaptureCapabilitySummary() {
        if (!runtimeCapabilities.isSecureContext) return 'Recording permissions need HTTPS, localhost, or 127.0.0.1. file pages may fail.';
        if (state.captureSource === 'external-help') return 'Use the setup guide below for Zoom, Google Meet, Safari, and phone fallback workflows.';
        if (state.captureSource === 'browser-tab') {
            return runtimeCapabilities.supportsTabOrScreenCapture
                ? 'Best for Google Meet, browser media, or a single tab with shared audio on desktop Chrome or Edge.'
                : 'Browser tab audio capture is limited here. Use microphone, File mode, or another desktop Chromium browser.';
        }
        if (state.captureSource === 'screen-audio') {
            return runtimeCapabilities.supportsTabOrScreenCapture
                ? 'Use this for Zoom, Teams, or desktop app audio when the browser exposes shared system audio.'
                : 'System audio capture is limited here. Open Capture Help for Safari, iPhone, iPad, and external app fallback paths.';
        }
        if (!runtimeCapabilities.hasSpeechRecognition && runtimeCapabilities.supportsMicQuality) {
            return 'Microphone capture works here. Live speech recognition is limited, so Quality mode is recommended.';
        }
        return 'Microphone capture is ready. Use Live for fast dictation or Quality for API transcription.';
    }

    function renderCaptureHelp() {
        if (!captureHelpCopy) return;
        const cards = [];
        if (!runtimeCapabilities.isSecureContext) {
            cards.push({ title: 'Open the app on localhost or HTTPS', body: 'Safari and many mobile browsers block microphone, tab, and screen capture on file pages. Open this HTML through localhost, 127.0.0.1, or HTTPS before trying to record.' });
        }
        if (state.captureSource === 'browser-tab' || state.captureSource === 'mic') {
            cards.push({ title: 'Google Meet or browser media', body: 'Choose Browser tab audio, start recording, then pick the exact meeting or media tab and enable Share audio. This is the cleanest path for browser-based meetings on desktop Chrome or Edge.' });
        }
        if (state.captureSource === 'screen-audio' || state.captureSource === 'external-help' || state.captureSource === 'mic') {
            cards.push({ title: 'Zoom or Teams desktop apps on Windows', body: 'Choose Screen + system audio, start recording, then share the screen or app and enable system audio if the browser offers it. If audio is still missing, use a loopback device such as Stereo Mix or another OS audio loopback input as the microphone source.' });
        }
        cards.push({ title: 'Safari desktop', body: 'Microphone capture is the primary path. Browser-tab and system-audio capture are limited in Safari, so if meeting audio is important use Quality mode with a microphone or switch to Chrome or Edge for shared tab or system audio.' });
        cards.push({ title: 'iPhone and iPad', body: 'A browser on iPhone or iPad cannot directly capture audio from another app because of OS privacy rules. Use the microphone from speaker output, record in Voice Memos and upload it in File mode, or run the meeting on another device and use this device as the recorder.' });
        if (state.captureSource === 'external-help') {
            cards.push({ title: 'External app or phone workflow', body: 'If the speaker is in another app or on another phone, the most reliable path is to play the audio on one device and capture it with the microphone on another device, or save the recording and upload it in File mode for transcription.' });
        }
        captureHelpTip.textContent = `Current source: ${getCaptureSourceLabel()}`;
        captureHelpCopy.innerHTML = cards.map(card => `<div class="capture-help-card"><h4>${card.title}</h4><p>${card.body}</p></div>`).join('');
    }

    function getCaptureStatusLabel() {
        const sel = captureSourceSelect || document.querySelector('select[id*="capture"]');
        const value = String(sel?.value || '').toLowerCase();
        if (value.includes('tab')) return 'CAPTURING TAB AUDIO';
        if (value.includes('screen')) return 'CAPTURING SCREEN';
        if (value.includes('external')) return 'CAPTURING EXTERNAL';
        return 'CAPTURING';
    }

    function setCaptureOrbActive(isActive) {
        if (!captureOrbStage) return;
        captureRecOrbCard?.classList.toggle('recording', !!isActive);
        captureOrbStage.classList.toggle('recording', !!isActive);
        captureOrbStage.classList.toggle('ready', !isActive);
        captureOrbStage.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        if (isActive) {
            if (captureOrbStatus) {
                captureOrbStatus.textContent = getCaptureStatusLabel();
                captureOrbStatus.classList.add('rec-active');
            }
            return;
        }
        if (captureOrbStatus) captureOrbStatus.classList.remove('rec-active');
        updateCaptureOrbStatus();
    }

    function updateCaptureOrbStatus() {
        if (!captureOrbStatus || state.isRecording) return;
        captureOrbStatus.textContent = normalizeUiText(getReadyStatusForCurrentState(state.mode, state.captureSource).main);
    }

    function syncCaptureTranscriptHost() {
        if (!captureTranscriptHost || !transcriptPanelCard) return;
        if (state.workspaceView === 'capture') captureTranscriptHost.appendChild(transcriptPanelCard);
    }

    function syncCaptureTranscript() {
        syncCaptureTranscriptHost();
    }

    function updateCaptureInterim(_text) {
        if (!captureInterimEl) return;
        captureInterimEl.textContent = interimEl?.textContent || '';
    }

    function renderCaptureUi() {
        if (!captureSourceSelect) return;
        captureSourceSelect.value = state.captureSource;
        if (captureSourceSelect.options[1]) {
            captureSourceSelect.options[1].disabled = !runtimeCapabilities.supportsTabOrScreenCapture;
            captureSourceSelect.options[1].textContent = runtimeCapabilities.supportsTabOrScreenCapture ? 'Browser tab audio' : 'Browser tab audio (Desktop Chrome/Edge)';
        }
        if (captureSourceSelect.options[2]) {
            captureSourceSelect.options[2].disabled = !runtimeCapabilities.supportsTabOrScreenCapture;
            captureSourceSelect.options[2].textContent = runtimeCapabilities.supportsTabOrScreenCapture ? 'Screen + system audio' : 'Screen + system audio (Desktop Chrome/Edge)';
        }
        if (captureCapabilityNote) captureCapabilityNote.textContent = getCaptureCapabilitySummary();
        renderCaptureHelp();
        setCaptureHelpOpen(state.captureHelpOpen);
        updateCaptureOrbStatus();
        setCaptureOrbActive(!!state.isRecording && state.mode !== 'file' && state.captureSource !== 'external-help');
        updateCaptureInterim();
        syncCaptureTranscriptHost();
        if (modeRealtimeBtn) {
            modeRealtimeBtn.disabled = !runtimeCapabilities.hasSpeechRecognition;
            modeRealtimeBtn.classList.toggle('disabled', !runtimeCapabilities.hasSpeechRecognition);
            modeRealtimeBtn.title = runtimeCapabilities.hasSpeechRecognition ? 'Live dictation with browser speech recognition' : 'Live mode is limited here. Use Quality or File mode.';
        }
        if (captureSupportCard) {
            captureSupportCard.style.display = '';
            captureSupportCard.classList.toggle('is-file-mode', state.mode === 'file');
        }
        if (captureToolbar) captureToolbar.style.display = '';
        if (captureHelpPanel) captureHelpPanel.hidden = !state.captureHelpOpen;
    }

    function setCaptureSource(source, options = {}) {
        const allowed = ['mic', 'browser-tab', 'screen-audio', 'external-help'];
        state.captureSource = allowed.includes(source) ? source : 'mic';
        localStorage.setItem('vt_capture_source', state.captureSource);
        if (state.captureSource === 'external-help') state.captureHelpOpen = true;
        else if (!options.keepHelp) state.captureHelpOpen = false;
        if (state.captureSource === 'external-help') {
            renderCaptureUi();
            setStatus('Capture setup help', 'Choose the best setup below, or switch back to Microphone to record now');
        } else if (state.captureSource !== 'mic' && state.mode === 'realtime') {
            if (!options.silent) toast('Live mode only works with the microphone. Switched to Quality.', 'warning');
            setMode('quality', { silent: true });
        } else {
            renderCaptureUi();
            const ready = getReadyStatusForCurrentState();
            setStatus(ready.main, ready.sub);
        }
        updateDiagnostics({ captureSource: state.captureSource, captureMode: state.mode }, `Capture source set to ${state.captureSource}`);
    }

    function ensureSecureContextForCapture() {
        if (runtimeCapabilities.isSecureContext) return true;
        state.captureHelpOpen = true;
        renderCaptureUi();
        setStatus('Secure context required', 'Open this app via localhost or HTTPS to record audio');
        toast('Recording needs HTTPS, localhost, or 127.0.0.1. file pages may fail.', 'warning', 4200);
        return false;
    }

    async function acquireCaptureStream(source = state.captureSource) {
        if (!ensureSecureContextForCapture()) throw new Error('Capture requires HTTPS, localhost, or 127.0.0.1.');
        if (source === 'external-help') {
            state.captureHelpOpen = true;
            renderCaptureUi();
            throw new Error('Open Capture Help for the recommended setup on this device.');
        }
        if (source === 'mic') {
            if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone capture is not available in this browser.');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: false
            });
            state.captureSessionStream = stream;
            state.micStream = stream;
            return stream;
        }
        if (!runtimeCapabilities.supportsTabOrScreenCapture || !navigator.mediaDevices?.getDisplayMedia) {
            state.captureHelpOpen = true;
            renderCaptureUi();
            throw new Error('Meeting audio capture from tabs or apps is limited here. Use Capture Help for the best fallback.');
        }
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const audioTracks = displayStream.getAudioTracks();
        if (!audioTracks.length) {
            stopTracks(displayStream);
            state.captureHelpOpen = true;
            renderCaptureUi();
            throw new Error(source === 'browser-tab' ? 'No tab audio was shared. Pick the correct tab and enable Share audio.' : 'No shared audio track was provided. Enable system audio or use microphone or File mode.');
        }
        const audioOnlyStream = new MediaStream(audioTracks);
        state.captureSessionStream = displayStream;
        state.micStream = audioOnlyStream;
        return audioOnlyStream;
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // SPEECH RECOGNITION (Live Mode)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    let recognition = null;
    let assistantRecognition = null;
    let assistantDictationBase = '';
    let assistantDictationFinal = '';
    if (SR) {
        recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;
        recognition.lang = 'en-IN';

        recognition.onresult = (e) => {
            clearNoSpeechTimer();
            clearAutoCopyCountdown();
            autoCopyBtn.classList.remove('auto-copy-active');

            const interimParts = [];
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const res = e.results[i];
                const chosen = pickRecognitionCandidate(res, getLiveRecognitionLang() || langSelect.value || 'auto');
                let text = chosen.text;
                const conf = chosen.confidence;
                if (res.isFinal) {
                    if (!text) continue;
                    const gapMs = state.lastEndTime ? Date.now() - state.lastEndTime : 0;
                    text = applySmartPunct(text, gapMs);
                    const lowQuality = conf < 0.62 || text.split(/\s+/).length <= 1;
                    if (lowQuality) markLiveHealth(-0.14, 'Live recognition weak final detected');
                    else markLiveHealth(0.04, 'Live recognition stable final', 'live');
                    schedulePendingRealtimeCommit(text, conf, {
                        lang: getWhisperLang() || getLiveRecognitionLang() || '',
                        source: 'live',
                        provisional: lowQuality,
                        alternatives: chosen.alternatives,
                        reliability: state.liveHealth.score
                    });
                } else {
                    if (text) interimParts.push(text);
                    state.lastInterimAlternatives = chosen.alternatives || [];
                }
            }
            const interim = interimParts.join(' ').trim();
            if (interim) {
                state.lastInterimText = interim;
                interimEl.textContent = interim;
                interimEl.classList.remove('idle-hint');
                const sep = state.confirmedText && !state.confirmedText.endsWith('\n') ? ' ' : '';
                transcript.value = state.confirmedText + sep + interim;
                transcript.scrollTop = transcript.scrollHeight;
                updateCaptureInterim(interim);
                syncCaptureTranscript();
            }
            if (!interim && state.realtimePendingSegment?.text) {
                const sep = state.confirmedText && !state.confirmedText.endsWith('\n') ? ' ' : '';
                transcript.value = `${state.confirmedText}${sep}${state.realtimePendingSegment.text}`.trim();
                updateCaptureInterim('');
                syncCaptureTranscript();
            }
            setNoSpeechTimer();
        };

        recognition.onerror = (e) => {
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                forceStop();
                setStatus('Microphone access denied', 'Grant mic permission and try again');
                toast('Microphone permission denied', 'error');
            } else if (e.error === 'no-speech') {
                state.liveHealth.noSpeechEvents += 1;
                state.liveHealth.consecutiveErrors += 1;
                markLiveHealth(-0.08, 'No speech detected', 'recovering');
            } else if (e.error === 'network') {
                state.liveHealth.networkEvents += 1;
                state.liveHealth.consecutiveErrors += 1;
                markLiveHealth(-0.18, 'Speech recognition network hiccup', 'recovering');
                if (state.isRecording) {
                    setStatus('Recovering live speech', 'Network hiccup - reconnecting...');
                    scheduleRestart();
                }
            } else if (e.error === 'aborted') {
                // intentional
            } else {
                state.liveHealth.consecutiveErrors += 1;
                markLiveHealth(-0.1, `Recognition error: ${e.error}`, 'recovering');
                toast('Recognition error: ' + e.error, 'error');
            }
        };

        recognition.onend = () => {
            if (state.manualStop) {
                flushPendingRealtimeSegment(true);
                commitPendingRealtimeInterim();
                state.manualStop = false;
                return;
            }
            if (state.isRecording && state.mode === 'realtime' && !state.restartTimeout) {
                state.liveHealth.consecutiveRestarts += 1;
                markLiveHealth(-0.06, 'Speech recognizer stopped - restarting', 'recovering');
                scheduleRestart(50);
            }
        };

        assistantRecognition = new SR();
        assistantRecognition.continuous = true;
        assistantRecognition.interimResults = true;
        assistantRecognition.maxAlternatives = 1;
        assistantRecognition.lang = 'en-US';

        assistantRecognition.onresult = (e) => {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const result = e.results[i];
                const text = String(result?.[0]?.transcript || '').trim();
                if (!text) continue;
                if (result.isFinal) {
                    assistantDictationFinal = assistantDictationFinal
                        ? `${assistantDictationFinal} ${text}`
                        : text;
                } else {
                    interim = interim ? `${interim} ${text}` : text;
                }
            }
            const next = [assistantDictationBase, assistantDictationFinal, interim].filter(Boolean).join(' ').trim();
            if (assistantInput) assistantInput.value = next;
            setAssistantDraft(next);
        };

        assistantRecognition.onend = () => {
            state.assistant.isListening = false;
            renderAssistantMessages();
        };

        assistantRecognition.onerror = (e) => {
            console.warn('Assistant speech recognition error:', e.error);
            state.assistant.isListening = false;
            renderAssistantMessages();
            if (e.error !== 'aborted' && e.error !== 'no-speech') {
                toast('Assistant voice input unavailable', 'warning');
            }
        };
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // AUDIO PREPROCESSING
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    function analyzeAudio(buffer) {
        const data = buffer.getChannelData(0);
        let peak = 0, sumSq = 0, clipping = 0;
        const silenceRanges = [];
        let silStart = -1;
        const winSize = Math.floor(buffer.sampleRate * 0.05);
        const silThresh = 0.01;

        for (let i = 0; i < data.length; i++) {
            const abs = Math.abs(data[i]);
            if (abs > peak) peak = abs;
            sumSq += data[i] * data[i];
            if (abs > 0.99) clipping++;
        }

        // Silence detection (simple windowed)
        for (let i = 0; i < data.length; i += winSize) {
            let winSum = 0;
            const end = Math.min(i + winSize, data.length);
            for (let j = i; j < end; j++) winSum += data[j] * data[j];
            const rms = Math.sqrt(winSum / (end - i));
            if (rms < silThresh) {
                if (silStart < 0) silStart = i / buffer.sampleRate;
            } else {
                if (silStart >= 0) {
                    const silEnd = i / buffer.sampleRate;
                    if (silEnd - silStart > 0.3) silenceRanges.push([silStart, silEnd]);
                    silStart = -1;
                }
            }
        }
        if (silStart >= 0) {
            const silEnd = data.length / buffer.sampleRate;
            if (silEnd - silStart > 0.3) silenceRanges.push([silStart, silEnd]);
        }

        const rmsLevel = Math.sqrt(sumSq / data.length);
        const clippingPct = (clipping / data.length) * 100;

        return { peak, rmsLevel, clippingPct, silenceRanges, duration: buffer.duration, sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels };
    }

    async function processAudioBuffer(buffer, analysis, normalize) {
        const sr = buffer.sampleRate;
        const len = buffer.length;
        const offCtx = new OfflineAudioContext(1, len, sr);

        const src = offCtx.createBufferSource();
        src.buffer = buffer;

        if (normalize) {
            // High pass filter at 80Hz
            const hp = offCtx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 80;

            // Compressor
            const comp = offCtx.createDynamicsCompressor();
            comp.threshold.value = -24;
            comp.knee.value = 12;
            comp.ratio.value = 4;
            comp.attack.value = 0.003;
            comp.release.value = 0.25;

            // Gain normalization
            const gain = offCtx.createGain();
            const targetPeak = 0.89;
            gain.gain.value = analysis.peak > 0.001 ? Math.min(targetPeak / analysis.peak, 10) : 1;

            src.connect(hp);
            hp.connect(comp);
            comp.connect(gain);
            gain.connect(offCtx.destination);
        } else {
            // Just mix to mono
            src.connect(offCtx.destination);
        }

        src.start(0);
        return offCtx.startRendering();
    }

    async function resampleTo16k(buffer) {
        const targetRate = 16000;
        if (buffer.sampleRate === targetRate && buffer.numberOfChannels === 1) return buffer;
        const duration = buffer.duration;
        const outLen = Math.ceil(duration * targetRate);
        const offCtx = new OfflineAudioContext(1, outLen, targetRate);
        const src = offCtx.createBufferSource();
        src.buffer = buffer;
        src.connect(offCtx.destination);
        src.start(0);
        return offCtx.startRendering();
    }

    function audioBufferToWav(buffer) {
        const numCh = buffer.numberOfChannels;
        const sr = buffer.sampleRate;
        const data = buffer.getChannelData(0);
        const bitsPerSample = 16;
        const byteRate = sr * numCh * bitsPerSample / 8;
        const blockAlign = numCh * bitsPerSample / 8;
        const dataSize = data.length * numCh * bitsPerSample / 8;
        const bufferSize = 44 + dataSize;
        const ab = new ArrayBuffer(bufferSize);
        const dv = new DataView(ab);

        function writeStr(offset, str) { for (let i = 0; i < str.length; i++) dv.setUint8(offset + i, str.charCodeAt(i)); }
        writeStr(0, 'RIFF');
        dv.setUint32(4, bufferSize - 8, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        dv.setUint32(16, 16, true);
        dv.setUint16(20, 1, true);
        dv.setUint16(22, numCh, true);
        dv.setUint32(24, sr, true);
        dv.setUint32(28, byteRate, true);
        dv.setUint16(32, blockAlign, true);
        dv.setUint16(34, bitsPerSample, true);
        writeStr(36, 'data');
        dv.setUint32(40, dataSize, true);

        let offset = 44;
        for (let i = 0; i < data.length; i++) {
            let s = Math.max(-1, Math.min(1, data[i]));
            s = s < 0 ? s * 0x8000 : s * 0x7FFF;
            dv.setInt16(offset, s, true);
            offset += 2;
        }
        return new Blob([ab], { type: 'audio/wav' });
    }

    function chunkWavBlob(buffer, maxBytes) {
        // Calculate samples per chunk
        const bytesPerSample = 2; // 16-bit
        const headerSize = 44;
        const maxSamplesPerChunk = Math.floor((maxBytes - headerSize) / bytesPerSample);
        const data = buffer.getChannelData(0);
        const totalSamples = data.length;

        if (totalSamples * bytesPerSample + headerSize <= maxBytes) {
            return [{ blob: audioBufferToWav(buffer), startTime: 0, endTime: buffer.duration, index: 0 }];
        }

        // Find silence points for smart splitting
        const analysis = analyzeAudio(buffer);
        const silencePoints = analysis.silenceRanges.map(r => Math.floor((r[0] + r[1]) / 2 * buffer.sampleRate));

        const chunks = [];
        let pos = 0;
        let idx = 0;

        while (pos < totalSamples) {
            let end = Math.min(pos + maxSamplesPerChunk, totalSamples);

            // Try to split at silence point
            if (end < totalSamples) {
                let bestSplit = end;
                let bestDist = Infinity;
                for (const sp of silencePoints) {
                    if (sp > pos + maxSamplesPerChunk * 0.5 && sp < end) {
                        const dist = Math.abs(sp - end);
                        if (dist < bestDist) { bestDist = dist; bestSplit = sp; }
                    }
                }
                end = bestSplit;
            }

            // Add overlap
            const overlapSamples = Math.floor(buffer.sampleRate * 0.5);
            const chunkStart = Math.max(0, pos - (idx > 0 ? overlapSamples : 0));
            const chunkData = data.slice(chunkStart, end);

            // Create AudioBuffer for this chunk
            const chunkCtx = new OfflineAudioContext(1, chunkData.length, buffer.sampleRate);
            const chunkBuf = chunkCtx.createBuffer(1, chunkData.length, buffer.sampleRate);
            chunkBuf.getChannelData(0).set(chunkData);

            chunks.push({
                blob: audioBufferToWav(chunkBuf),
                startTime: chunkStart / buffer.sampleRate,
                endTime: end / buffer.sampleRate,
                index: idx
            });

            pos = end;
            idx++;
        }

        return chunks;
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // API INTEGRATION
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function getApiEndpoint() {
        return getAudioEndpoint('transcriptions');
    }

    function getWhisperLang() {
        const sel = langSelect.selectedOptions[0];
        if (!sel || langSelect.value === 'auto') return null;
        return normalizeLanguageCode(sel.dataset.wlang || '') || null;
    }

    function getSpeechRecognitionLocale(langCode) {
        const localeMap = {
            en: 'en-US',
            hi: 'hi-IN',
            ml: 'ml-IN',
            te: 'te-IN',
            ta: 'ta-IN',
            kn: 'kn-IN',
            bn: 'bn-IN',
            mr: 'mr-IN',
            gu: 'gu-IN',
            pa: 'pa-IN',
            ur: 'ur-IN',
            or: 'or-IN',
            es: 'es-ES',
            fr: 'fr-FR',
            de: 'de-DE',
            ja: 'ja-JP',
            ko: 'ko-KR',
            zh: 'zh-CN',
            ar: 'ar-SA',
            pt: 'pt-BR',
            ru: 'ru-RU'
        };
        const normalized = normalizeLanguageCode(langCode || '');
        return localeMap[normalized] || String(langCode || '').trim() || 'en-US';
    }

    function getUploadedFileLanguageMode() {
        return document.querySelector('input[name="fileLanguageMode"]:checked')?.value === 'translate' ? 'translate' : 'preserve';
    }

    function shouldTranslateUploadedFile() {
        return getUploadedFileLanguageMode() === 'translate';
    }

    function syncUploadedFileLanguageModeUi() {
        fileLanguageModeInputs.forEach((input) => {
            input.closest('.file-mode-option')?.classList.toggle('selected', input.checked);
        });
    }

    function normalizeLanguageCode(code = '') {
        return String(code || '').trim().toLowerCase().split(/[-_]/)[0] || '';
    }

    function syncDetectedLanguage(language = '', { announceMismatch = false } = {}) {
        const normalized = String(language || '').trim();
        state.detectedLanguage = normalized;
        if (normalized) {
            detectedLangBadge.textContent = normalized.toUpperCase();
            detectedLangBadge.style.display = 'inline-block';
        } else {
            detectedLangBadge.style.display = 'none';
        }
        const selected = getWhisperLang();
        if (announceMismatch && selected && normalizeLanguageCode(selected) !== normalizeLanguageCode(normalized)) {
            toast(`Detected ${normalized.toUpperCase()} while ${selected.toUpperCase()} was selected. Recovery will prefer detected language context.`, 'info', 4200);
            updateDiagnostics({ selectedLanguage: selected, detectedLanguage: normalized }, 'Selected language differs from detected speech');
        }
    }

    async function testApiKey() {
        if (!getProviderKeys().length) { toast('Enter an API key first', 'warning'); return; }
        try {
            const silentBuf = new AudioBuffer({ length: 16000, sampleRate: 16000, numberOfChannels: 1 });
            const testBlob = audioBufferToWav(silentBuf);
            const result = await providerRequest({
                url: getApiEndpoint(),
                responseType: 'json',
                purpose: 'api-test',
                buildBody: () => {
                    const fd = new FormData();
                    fd.append('file', testBlob, 'test.wav');
                    fd.append('model', getEffectiveAudioModel());
                    fd.append('response_format', 'json');
                    return fd;
                }
            });
            state.apiConnected = true;
            apiStatusDot.className = 'api-status-dot connected';
            apiStatusLabel.textContent = 'Connected';
            updateDiagnostics({ provider: state.apiProvider, audioModel: getEffectiveAudioModel(), audioTask: 'api-test', fileHash: state.fileHash || '' }, 'API key validated');
            toast('API key valid', 'success');
        } catch (e) {
            state.apiConnected = false;
            apiStatusDot.className = 'api-status-dot error';
            apiStatusLabel.textContent = 'Error';
            toast('Connection failed: ' + e.message, 'error');
        }
        updateTranscribeBtn();
    }

    async function testGeminiKey() {
        if (!getProviderKeys('gemini').length) { toast('Enter a Gemini key first', 'warning'); return; }
        try {
            recordGeminiUsage(getConfiguredGeminiAnalysisModel());
            const timeoutMs = getProviderTimeoutMs();
            const resp = await fetchWithTimeout(
                fetch,
                getGeminiGenerateEndpoint(getConfiguredGeminiAnalysisModel()),
                {
                    method: 'POST',
                    headers: {
                        'x-goog-api-key': getProviderKeys('gemini')[0],
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            role: 'user',
                            parts: [{ text: 'Reply with OK only.' }]
                        }]
                    })
                },
                { timeoutMs, timeoutMessage: `Gemini test timed out after ${timeoutMs}ms` }
            );
            const raw = await resp.text().catch(() => '');
            const payload = safeJsonParse(raw, null);
            if (!resp.ok) throw new Error(payload?.error?.message || payload?.message || raw || `Gemini test failed (${resp.status})`);
            const btn = geminiKeyTestBtn;
            if (btn) {
                btn.classList.add('saved');
                btn.textContent = 'Ready';
                setTimeout(() => { btn.classList.remove('saved'); btn.textContent = 'Test'; }, 1500);
            }
            toast('Gemini key valid', 'success');
        } catch (e) {
            toast('Gemini connection failed: ' + e.message, 'error');
        }
    }

    async function transcribeBlob(blob, options = {}) {
        const language = options.language === undefined ? getWhisperLang() : options.language;
        const endpoint = getAudioEndpoint(options.translate ? 'translations' : 'transcriptions');
        return providerRequest({
            url: endpoint,
            responseType: 'json',
            signal: options.signal,
            purpose: options.translate ? 'translate-audio' : 'transcribe-audio',
            buildBody: () => {
                const fd = new FormData();
                fd.append('file', blob, options.filename || 'audio.wav');
                fd.append('model', getEffectiveAudioModel({ translate: !!options.translate, language }));
                fd.append('response_format', 'verbose_json');
                if (!options.translate) fd.append('timestamp_granularities[]', 'segment');
                if (language && language !== 'auto') fd.append('language', language);
                if (options.prompt) fd.append('prompt', options.prompt);
                return fd;
            }
        });
    }

    async function transcribeChunks(chunks, options, onProgress, cacheKey = '') {
        let partial = cacheKey ? readPartialProgress(cacheKey) : null;
        let results = Array.isArray(partial?.results) ? partial.results : [];
        let startIndex = typeof partial?.nextIndex === 'number' ? partial.nextIndex : 0;
        if (startIndex > 0) updateDiagnostics({ resumedFromChunk: startIndex + 1 }, `Resuming chunk transcription from ${startIndex + 1}/${chunks.length}`);
        for (let i = startIndex; i < chunks.length; i++) {
            if (state.abortController?.signal.aborted) throw new Error('Cancelled');
            onProgress?.({ current: i + 1, total: chunks.length });
            const prompt = results.length > 0 ? (results[results.length - 1].text || '').slice(-240) : '';
            const result = await transcribeBlob(chunks[i].blob, {
                ...options,
                prompt,
                signal: state.abortController?.signal
            });
            if (result.segments) {
                result.segments.forEach(seg => {
                    seg.start += chunks[i].startTime;
                    seg.end += chunks[i].startTime;
                });
            }
            results.push(result);
            if (cacheKey) savePartialProgress(cacheKey, { results, nextIndex: i + 1 });
            if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 250));
        }
        if (cacheKey) clearPartialProgress(cacheKey);
        return mergeResults(results);
    }

    function mergeResults(results) {
        let allText = '';
        let allSegments = [];
        let detectedLang = '';
        let totalDuration = 0;
        const langCounts = {};

        results.forEach((r) => {
            if (r.language) {
                langCounts[r.language] = (langCounts[r.language] || 0) + 1;
            }
            if (r.duration) totalDuration = Math.max(totalDuration, (r.segments?.[r.segments.length - 1]?.end || r.duration));
            if (r.segments && r.segments.length) {
                if (allSegments.length && r.segments.length) {
                    const lastEnd = allSegments[allSegments.length - 1].end;
                    const firstStart = r.segments[0].start;
                    if (firstStart < lastEnd) {
                        const lastText = allSegments[allSegments.length - 1].text.trim().toLowerCase();
                        const firstText = r.segments[0].text.trim().toLowerCase();
                        if (textSimilarity(lastText, firstText) > 0.6) r.segments.shift();
                    }
                }
                allSegments = allSegments.concat(r.segments);
            }
            if (r.text) {
                if (allText) allText += ' ';
                allText += r.text.trim();
            }
        });

        let maxCount = 0;
        for (const [lang, count] of Object.entries(langCounts)) {
            if (count > maxCount) { maxCount = count; detectedLang = lang; }
        }

        return { text: applyGlossaryToText(allText), segments: allSegments, language: detectedLang, duration: totalDuration };
    }

    async function decodeMediaToAudioBuffer(blob) {
        const arrayBuf = await blob.arrayBuffer();
        const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
        try {
            return await tempCtx.decodeAudioData(arrayBuf);
        } finally {
            Promise.resolve(tempCtx.close()).catch(() => { });
        }
    }

    async function transcribeBlobThroughPipeline(blob, options = {}) {
        let decoded;
        try {
            decoded = await decodeMediaToAudioBuffer(blob);
        } catch (err) {
            if (blob.size > DIRECT_MEDIA_UPLOAD_MAX_BYTES) {
                throw new Error('This media format could not be decoded locally. Use MP3, WAV, M4A, MP4, or WebM, or upload a clip under 24MB for direct media transcription.');
            }
            return transcribeBlob(blob, {
                language: options.language === undefined ? getWhisperLang() : options.language,
                translate: !!options.translate,
                signal: state.abortController?.signal,
                filename: options.filename || blob.name || 'media-upload'
            });
        }
        const analysis = analyzeAudio(decoded);
        const processed = await processAudioBuffer(decoded, analysis, options.normalize !== false);
        const resampled = await resampleTo16k(processed);
        const chunks = chunkWavBlob(resampled, 24 * 1024 * 1024);
        const language = options.language === undefined ? getWhisperLang() : options.language;
        return transcribeChunks(chunks, { language, translate: !!options.translate }, options.onProgress || null, options.cacheKey || '');
    }

    function averageSegmentConfidence(result = {}) {
        const segments = Array.isArray(result?.segments) ? result.segments : [];
        if (!segments.length) return 0;
        const total = segments.reduce((sum, seg) => {
            const conf = seg.avg_logprob ? Math.exp(seg.avg_logprob) : (seg.confidence || 0.75);
            return sum + Math.max(0, Math.min(1, conf));
        }, 0);
        return total / segments.length;
    }

    function transcriptLanguageSpread(result = {}) {
        const segments = Array.isArray(result?.segments) ? result.segments : [];
        const counts = {};
        segments.forEach(seg => {
            const code = normalizeLanguageCode(seg.language || result.language || '');
            if (!code) return;
            counts[code] = (counts[code] || 0) + 1;
        });
        return counts;
    }

    function shouldRetryUploadedFileTranscription(result, analysis, options = {}) {
        const avgConf = averageSegmentConfidence(result);
        const text = cleanTranscriptLocal(result?.text || '');
        const languages = Object.keys(transcriptLanguageSpread(result));
        const hasSelectedLanguage = !!options.language;
        const veryShort = text.split(/\s+/).filter(Boolean).length < Math.max(6, Math.floor((analysis?.duration || 0) / 20));
        const hardAudio = Number(analysis?.clippingPct || 0) > 0.6 || Number(analysis?.rmsLevel || 0) < 0.018;
        const mixedLanguage = languages.length > 1;
        return (hasSelectedLanguage && avgConf < 0.72) || veryShort || hardAudio || mixedLanguage;
    }

    function preferRetriedTranscript(primary, retried) {
        const primaryConf = averageSegmentConfidence(primary);
        const retriedConf = averageSegmentConfidence(retried);
        const primaryWords = cleanTranscriptLocal(primary?.text || '').split(/\s+/).filter(Boolean).length;
        const retriedWords = cleanTranscriptLocal(retried?.text || '').split(/\s+/).filter(Boolean).length;
        if (retriedConf > primaryConf + 0.08) return true;
        if (retriedWords > primaryWords + 4) return true;
        return false;
    }

    function textSimilarity(a, b) {
        if (!a || !b) return 0;
        const longer = a.length > b.length ? a : b;
        const shorter = a.length > b.length ? b : a;
        if (longer.length === 0) return 1;
        if (longer.includes(shorter)) return shorter.length / longer.length;
        let matches = 0;
        const aArr = a.split('');
        const bSet = new Set(b.split(''));
        aArr.forEach(c => { if (bSet.has(c)) matches++; });
        return matches / Math.max(a.length, b.length);
    }

    async function finalizeUploadedFileResult(result, options = {}) {
        const normalizedSegments = normalizeResultSegmentsForDisplay(result);
        const initialSpread = getLanguageSpreadFromSegments(normalizedSegments);
        let finalSegments = normalizedSegments;
        let repairMeta = { applied: false, repairedCount: 0, spread: initialSpread };
        if (!options.translate) {
            repairMeta = await repairMultilingualResultSegments(result, normalizedSegments, options);
            finalSegments = repairMeta.segments || normalizedSegments;
        }
        const finalText = finalSegments.length
            ? buildTranscriptTextFromSegments(finalSegments)
            : cleanTranscriptLocal(result.text || '');
        updateDiagnostics({
            multilingualRepair: !options.translate && shouldRunMultilingualRepair(result, normalizedSegments, options) ? 'considered' : 'skipped',
            multilingualRepairApplied: !!repairMeta.applied,
            multilingualRepairSegments: Number(repairMeta.repairedCount || 0),
            multilingualLanguageSpread: Object.keys(repairMeta.spread || initialSpread || {}).join(', ') || 'unknown'
        }, !options.translate && repairMeta.applied
            ? `Multilingual repair updated ${repairMeta.repairedCount || 0} segment(s)`
            : (!options.translate ? 'Multilingual preserve-original review complete' : 'Translate-to-English flow complete'));
        return {
            ...result,
            text: finalText,
            segments: finalSegments.map(seg => ({
                ...seg,
                text: seg.text,
                language: seg.lang || seg.rawLanguage || result.language || ''
            }))
        };
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // FILE PROCESSING
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    async function processUploadedFile() {
        if (!state.uploadedFile || !getProviderKeys().length) return;
        if (state.isProcessing) return;

        state.isProcessing = true;
        state.abortController = new AbortController();
        progressWrap.classList.add('visible');
        transcribeBtn.disabled = true;
        transcribeBtn.classList.add('processing');
        transcribeBtn.innerHTML = '<span>Processing...</span>';

        try {
            // Step 1: Decode
            setProgress(-1, 'Decoding audio...');
            const arrayBuf = await state.uploadedFile.arrayBuffer();
            state.fileHash = await hashArrayBuffer(arrayBuf);
            const translate = shouldTranslateUploadedFile();
            const useCache = $('optUseCache').checked;
            const doNormalize = $('optNormalize').checked;
            const wLang = getWhisperLang();
            const effectiveAudioModel = getEffectiveAudioModel({ translate, language: wLang });

            state.cacheKey = buildTranscriptCacheKey(state.fileHash, {
                translate,
                normalize: doNormalize,
                language: wLang,
                model: effectiveAudioModel
            });
            updateDiagnostics({
                fileHash: state.fileHash,
                cacheKey: state.cacheKey,
                audioModel: effectiveAudioModel,
                audioTask: translate ? 'translate-en' : 'transcribe',
                cacheHit: false
            }, translate && state.apiProvider === 'groq'
                ? 'Translation requested - using whisper-large-v3 on Groq'
                : 'File loaded');
            const cached = useCache ? readTranscriptCache(state.cacheKey) : null;
            if (cached) {
                const finalizedCached = await finalizeUploadedFileResult(cached, { translate, selectedLanguage: wLang });
                displayFileResult(finalizedCached);
                setCacheStatus('Cache hit - reused previous transcript');
                updateDiagnostics({ cacheHit: true }, 'Transcript cache hit');
                setCacheStatus('Cache hit - reused previous transcript');
                toast('Loaded cached transcript', 'success');
                return;
            }
            setCacheStatus('Cache miss - transcribing');
            setCacheStatus(useCache ? 'Cache miss - transcribing' : 'Cache bypassed - transcribing');
            let analysis = null;
            let result;
            let usedDirectMediaUpload = false;
            try {
                const decoded = await decodeMediaToAudioBuffer(state.uploadedFile);

                // Step 2: Analyze
                setProgress(-1, 'Analyzing audio...');
                analysis = analyzeAudio(decoded);
                state.audioAnalysis = analysis;
                showAnalysis(analysis);

                // Step 3: Preprocess
                setProgress(-1, 'Preprocessing audio...');
                const processed = await processAudioBuffer(decoded, analysis, doNormalize);

                // Step 4: Resample
                setProgress(-1, 'Resampling to 16kHz...');
                const resampled = await resampleTo16k(processed);

                // Step 5: Chunk
                setProgress(-1, 'Preparing chunks...');
                const maxChunkBytes = 24 * 1024 * 1024;
                const chunks = chunkWavBlob(resampled, maxChunkBytes);

                // Step 6: Transcribe
                setProgress(-1, translate ? 'Preparing English translation...' : 'Preparing transcription...');
                result = await transcribeChunks(chunks, {
                    language: wLang,
                    translate
                }, (prog) => {
                    const pct = Math.round((prog.current / prog.total) * 100);
                    setProgress(pct, `${translate ? 'Translating' : 'Transcribing'} chunk ${prog.current}/${prog.total}...`);
                }, state.cacheKey);
            } catch (decodeError) {
                if (state.uploadedFile.size > DIRECT_MEDIA_UPLOAD_MAX_BYTES) throw decodeError;
                usedDirectMediaUpload = true;
                state.audioAnalysis = null;
                audioAnalysisEl.classList.remove('visible');
                setProgress(-1, translate ? 'Uploading media for English translation...' : 'Uploading media for transcription...');
                updateDiagnostics({ mediaFallback: 'direct-upload' }, 'Local decode unavailable - using direct media upload');
                result = await transcribeBlob(state.uploadedFile, {
                    language: wLang,
                    translate,
                    signal: state.abortController?.signal,
                    filename: state.uploadedFile.name
                });
            }
            let finalResult = result;
            if (!usedDirectMediaUpload && shouldRetryUploadedFileTranscription(result, analysis, { language: wLang }) && !translate) {
                setProgress(-1, 'Refining transcript for mixed language or difficult audio...');
                updateDiagnostics({ detectedLanguage: result.language || '', retries: 1 }, 'Uploaded file triggered adaptive retry with auto language');
                const retried = await transcribeBlobThroughPipeline(state.uploadedFile, {
                    language: null,
                    normalize: true,
                    translate: false,
                    filename: state.uploadedFile.name
                });
                if (preferRetriedTranscript(result, retried)) {
                    finalResult = retried;
                    toast('Adaptive retry improved transcript quality', 'success', 3200);
                }
            }
            finalResult = await finalizeUploadedFileResult(finalResult, { translate, selectedLanguage: wLang });
            if (useCache) {
                saveTranscriptCache(state.cacheKey, finalResult);
                setCacheStatus('Transcript cached locally');
            } else {
                setCacheStatus('Cache bypassed for this run');
            }

            // Step 7: Display
            setProgress(100, 'Complete!');
            displayFileResult(finalResult);

            syncDetectedLanguage(finalResult.language || '', { announceMismatch: true });

            toast(`Transcribed - ${finalResult.text.split(/\s+/).length} words`, 'success');

        } catch (err) {
            if (err.message === 'Cancelled') {
                toast('Transcription cancelled', 'info');
            } else {
                toast('Error: ' + err.message, 'error');
                console.error(err);
            }
        } finally {
            state.isProcessing = false;
            state.abortController = null;
            progressWrap.classList.remove('visible');
            transcribeBtn.disabled = false;
            transcribeBtn.classList.remove('processing');
            transcribeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg> Transcribe';
            updateTranscribeBtn();
        }
    }

    function displayFileResult(result) {
        const preparedSegments = normalizeResultSegmentsForDisplay(result);
        state.segments = [];
        segView.innerHTML = '';
        transcript.value = preparedSegments.length
            ? buildTranscriptTextFromSegments(preparedSegments)
            : cleanTranscriptLocal(result.text || '');
        state.confirmedText = transcript.value;
        state.audioDurationSec = result.duration || state.audioDurationSec || 0;
        if (preparedSegments.length) {
            preparedSegments.forEach((seg, idx) => {
                state.segments.push(normalizeSegment({
                    ...seg,
                    speaker: seg.speaker || (state.preset === 'meeting' || state.preset === 'interview' ? (idx % 2 === 0 ? 'Speaker A' : 'Speaker B') : '')
                }, idx));
            });
            renderSegments();
            rebuildTranscriptFromSegments();
        } else {
            updateStats();
        }
        transcript.scrollTop = 0;
        syncCaptureTranscript();
        refreshTopDownloadAction();
        queueTranslationBackfill({ immediate: true });
        scheduleWorkspaceSave();
    }

    function shouldTriggerRealtimeFallback() {
        if (!state.isRecording || state.mode !== 'realtime') return false;
        if (!getProviderKeys().length) return false;
        if (state.realtimeFallbackPromise) return false;
        if (state.liveHealth.score > LIVE_RELIABILITY_THRESHOLD) return false;
        const liveMs = state.liveAudioBuffer.startedAt ? (Date.now() - state.liveAudioBuffer.startedAt) : 0;
        return liveMs >= LIVE_FALLBACK_MIN_BUFFER_MS;
    }

    function getAdaptiveTranscriptionLanguageHint() {
        const selected = getWhisperLang();
        const detected = normalizeLanguageCode(state.detectedLanguage || '');
        if (!selected) return null;
        if (detected && detected !== normalizeLanguageCode(selected)) return null;
        if (state.liveHealth.score < 0.58 || state.liveHealth.consecutiveErrors > 1) return null;
        return selected;
    }

    async function runRealtimeFallback(reason = 'Live recognition degraded') {
        if (state.realtimeFallbackPromise) return state.realtimeFallbackPromise;
        if (!getProviderKeys().length) return null;
        state.realtimeFallbackPromise = (async () => {
            try {
                setStatus('High-accuracy recovery', 'Reprocessing recent audio through API transcription');
                markLiveHealth(0, reason, 'fallback-api');
                const capture = await stopRealtimeAudioBuffer(false);
                if (!capture?.blob || capture.blob.size < 512) return null;
                const result = await transcribeBlobThroughPipeline(capture.blob, {
                    language: getAdaptiveTranscriptionLanguageHint(),
                    normalize: true
                });
                const fallbackText = cleanTranscriptLocal(result?.text || '');
                if (!fallbackText) return null;
                state.liveHealth.fallbackUses += 1;
                markLiveHealth(0.28, 'Fallback API transcription applied', 'fallback-api');
                const existing = state.segments.filter(seg => seg.source !== 'fallback-api');
                state.segments = existing.map(seg => normalizeSegment(seg));
                addSegment(fallbackText, 0.93, null, result.language || getWhisperLang() || '', {
                    source: 'fallback-api',
                    provisional: false,
                    alternatives: [],
                    reliability: Math.max(state.liveHealth.score, 0.8)
                });
                state.correctionHistory.push(fallbackText);
                if (state.correctionHistory.length > 5) state.correctionHistory = state.correctionHistory.slice(-5);
                if (result.language) syncDetectedLanguage(result.language, { announceMismatch: true });
                toast('Live speech recovered with high-accuracy transcription', 'success', 3400);
                return result;
            } catch (err) {
                markLiveHealth(-0.06, `Realtime fallback failed: ${err.message || 'unknown error'}`, 'recovering');
                toast(`Fallback transcription error: ${err.message || 'request failed'}`, 'warning', 3600);
                return null;
            } finally {
                if (state.isRecording && state.mode === 'realtime') {
                    try {
                        await startRealtimeAudioBuffer();
                    } catch (e) { }
                    const active = getActiveStatusForCurrentState('realtime', 'mic');
                    setStatus(active.main, active.sub);
                }
                state.realtimeFallbackPromise = null;
            }
        })();
        return state.realtimeFallbackPromise;
    }

    function formatTimestamp(seconds) {
        if (seconds == null) return '00:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function formatTimestampFull(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    }

    function formatTimestampVTT(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    }

    function getSubtitleTextForSegment(seg) {
        if (!seg) return '';
        const translated = getTranslationResultForSegment(seg)?.translatedText || '';
        const baseText = shouldTranslateUploadedFile() && translated ? translated : (seg.text || '');
        const line = state.speakerMode && seg.speaker ? `${seg.speaker}: ${baseText}` : baseText;
        return cleanTranscriptLocal(line).replace(/\n+/g, ' ').trim();
    }

    function getExportTranscriptText() {
        const translated = cleanTranscriptLocal(translatedTranscript?.value || '');
        if (shouldTranslateUploadedFile() && translated) return translated;
        return cleanTranscriptLocal(transcript.value || '');
    }

    function getSubtitleDownloadName(ext = 'srt') {
        const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const sourceName = String(state.uploadedFile?.name || 'subtitle').replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_');
        return `${sourceName || 'subtitle'}-${ts}.${ext}`;
    }

    function getDocumentDownloadName(ext = 'txt') {
        const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const sourceName = String(state.uploadedFile?.name || 'transcript').replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_');
        return `${sourceName || 'transcript'}-${ts}.${ext}`;
    }

    function canExportFormat(format = '') {
        const hasContent =
            (typeof getExportTranscriptText === 'function' && getExportTranscriptText().trim().length > 0)
            || (state?.segments?.length > 0)
            || (state?.transcript?.trim?.().length > 0)
            || (transcript?.value?.trim?.().length > 0);

        if (!hasContent) {
            toast('No transcript to export. Record or transcribe first.');
            return false;
        }
        return true;
    }

    function downloadTranscriptFormat(format = '') {
        if (!canExportFormat(format)) {
            toast(format === 'srt' || format === 'vtt'
                ? 'No subtitle segments available yet'
                : 'Nothing to download yet', 'warning');
            return false;
        }
        if (format === 'txt') {
            downloadFile(getExportTranscriptText(), getDocumentDownloadName('txt'), 'text/plain;charset=utf-8');
        } else if (format === 'docx') {
            downloadBlob(generateDocxBlob(), getDocumentDownloadName('docx'));
        } else if (format === 'srt') {
            downloadFile(generateSRT(), getSubtitleDownloadName('srt'), 'text/plain;charset=utf-8');
        } else if (format === 'vtt') {
            downloadFile(generateVTT(), getSubtitleDownloadName('vtt'), 'text/vtt;charset=utf-8');
        } else if (format === 'json') {
            downloadFile(generateJSON(), getDocumentDownloadName('json'), 'application/json;charset=utf-8');
        } else if (format === 'md') {
            downloadFile(generateMarkdown(), getDocumentDownloadName('md'), 'text/markdown;charset=utf-8');
        } else if (format === 'csv') {
            downloadFile(generateCSV(), getDocumentDownloadName('csv'), 'text/csv;charset=utf-8');
        } else if (format === 'workspace') {
            downloadFile(generateWorkspaceJSON(), `workspace-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`, 'application/json;charset=utf-8');
        } else {
            return false;
        }
        toast(`Downloaded as ${format.toUpperCase()}`, 'success');
        return true;
    }

    function normalizeUiText(text = '') {
        return String(text || '')
            .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦|Ã¢â‚¬Â¦/g, '...')
            .replace(/Ã¢â‚¬â€/g, '-')
            .replace(/Ã‚Â·/g, ' | ')
            .replace(/Whisper API/g, 'speech-to-text')
            .replace(/Whisper transcription/g, 'quality transcription')
            .replace(/Whisper/g, 'speech-to-text');
    }

    function setProgress(pct, label) {
        label = normalizeUiText(label);
        progressLabel.querySelector('span') ? progressLabel.querySelector('span').textContent = label : (progressLabel.childNodes[0].textContent = label);
        if (pct < 0) {
            progressFill.classList.add('indeterminate');
            progressFill.style.width = '40%';
        } else {
            progressFill.classList.remove('indeterminate');
            progressFill.style.width = pct + '%';
        }
    }

    function showAnalysis(a) {
        const peakDb = a.peak > 0 ? (20 * Math.log10(a.peak)).toFixed(1) : '-inf';
        const rmsDb = a.rmsLevel > 0 ? (20 * Math.log10(a.rmsLevel)).toFixed(1) : '-inf';
        const peakColor = a.peak > 0.95 ? 'red' : a.peak > 0.5 ? 'green' : 'yellow';
        const clipColor = a.clippingPct > 1 ? 'red' : a.clippingPct > 0 ? 'yellow' : 'green';
        const note = a.clippingPct > 1
            ? 'Hard audio: clipping detected, adaptive retry will be more aggressive.'
            : (a.rmsLevel < 0.018
                ? 'Quiet or distant audio: auto-detect and normalization may be preferred.'
                : 'Audio looks usable for detailed transcription.');

        audioAnalysisEl.innerHTML = `
      <span class="analysis-item"><span class="dot ${peakColor}"></span> Peak: ${peakDb} dB</span>
      <span class="analysis-item"><span class="dot green"></span> RMS: ${rmsDb} dB</span>
      <span class="analysis-item"><span class="dot ${clipColor}"></span> Clipping: ${a.clippingPct.toFixed(2)}%</span>
      <span class="analysis-item"><span class="dot green"></span> ${a.sampleRate / 1000}kHz | ${a.channels}ch | ${fmtTime(a.duration * 1000)}</span>
      <span class="analysis-item"><span class="dot yellow"></span> ${note}</span>
    `;
        audioAnalysisEl.classList.add('visible');
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // QUALITY MODE (Record â†’ Whisper)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // AUDIO VISUALIZATION
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function ensureCanvasSize() {
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;
        if (!W || !H) return { W: 0, H: 0 };
        if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        return { W, H };
    }

    function analyzeLiveLevel(data) {
        if (!data?.length) return 0;
        let peak = 0;
        let sumSq = 0;
        for (let i = 0; i < data.length; i++) {
            const centered = (data[i] - 128) / 128;
            const abs = Math.abs(centered);
            if (abs > peak) peak = abs;
            sumSq += centered * centered;
        }
        const rms = Math.sqrt(sumSq / data.length);
        return Math.min(1, rms * 2.6 + peak * 0.35);
    }

    function drawOrbFrame(level = 0, isLive = false, waveform = null) {
        const { W, H } = ensureCanvasSize();
        if (!W || !H) return;

        const t = performance.now() * 0.001;
        const cx = W / 2;
        const cy = H / 2;
        const size = Math.min(W, H);
        const radius = size * 0.205;
        const easedLevel = Math.pow(Math.max(0, Math.min(1, level)), 0.8);
        const pulse = 1 + easedLevel * 0.032 + (isLive ? 0.006 : 0);

        ctx2d.clearRect(0, 0, W, H);

        const bg = ctx2d.createRadialGradient(cx, cy, size * 0.06, cx, cy, size * 0.8);
        bg.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
        bg.addColorStop(0.45, 'rgba(244, 247, 252, 0.98)');
        bg.addColorStop(1, 'rgba(235, 241, 248, 1)');
        ctx2d.fillStyle = bg;
        ctx2d.fillRect(0, 0, W, H);

        const halo = ctx2d.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.95);
        halo.addColorStop(0, 'rgba(96, 165, 250, 0.04)');
        halo.addColorStop(0.48, `rgba(59, 130, 246, ${0.04 + easedLevel * 0.08})`);
        halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx2d.fillStyle = halo;
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, radius * 2.1, 0, Math.PI * 2);
        ctx2d.fill();

        state.orbPhase += 0.004 + easedLevel * 0.016 + (isLive ? 0.0015 : 0);

        ctx2d.save();
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, radius * 1.02, 0, Math.PI * 2);
        ctx2d.clip();

        const shell = ctx2d.createRadialGradient(cx, cy - radius * 0.35, radius * 0.08, cx, cy, radius * 1.05);
        shell.addColorStop(0, 'rgba(242, 250, 255, 0.98)');
        shell.addColorStop(0.28, 'rgba(205, 235, 255, 0.94)');
        shell.addColorStop(0.58, 'rgba(96, 183, 255, 0.92)');
        shell.addColorStop(1, 'rgba(19, 118, 255, 0.98)');
        ctx2d.fillStyle = shell;
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx2d.fill();

        const liquidLevel = cy + radius * (0.24 - easedLevel * 0.12);
        const waveAmp = radius * (0.024 + easedLevel * 0.038 + (isLive ? 0.014 : 0));
        const waveFreq = 2.15;
        const phase = t * (0.72 + easedLevel * 0.42) + state.orbPhase * 3.2;

        ctx2d.beginPath();
        ctx2d.moveTo(cx - radius * 1.1, cy + radius * 1.1);
        for (let x = -radius * 1.1; x <= radius * 1.1; x += 3) {
            const normalized = x / radius;
            const sampleIndex = waveform ? Math.min(waveform.length - 1, Math.max(0, Math.floor(((normalized + 1) * 0.5) * waveform.length))) : 0;
            const sample = waveform ? (waveform[sampleIndex] - 128) / 128 : 0;
            const y = liquidLevel
                + Math.sin(normalized * waveFreq + phase) * waveAmp
                + Math.sin(normalized * (waveFreq * 0.55) - phase * 0.65) * waveAmp * 0.34
                + sample * waveAmp * 0.34;
            ctx2d.lineTo(cx + x, y);
        }
        ctx2d.lineTo(cx + radius * 1.1, cy + radius * 1.1);
        ctx2d.closePath();

        const liquid = ctx2d.createLinearGradient(cx, cy - radius, cx, cy + radius);
        liquid.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
        liquid.addColorStop(0.16, 'rgba(223, 242, 255, 0.96)');
        liquid.addColorStop(0.5, 'rgba(98, 191, 255, 0.95)');
        liquid.addColorStop(1, 'rgba(18, 126, 255, 0.97)');
        ctx2d.fillStyle = liquid;
        ctx2d.fill();

        ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.24)';
        ctx2d.lineWidth = Math.max(2, radius * 0.016);
        ctx2d.beginPath();
        for (let x = -radius * 0.92; x <= radius * 0.92; x += 4) {
            const normalized = x / radius;
            const y = liquidLevel
                + Math.sin(normalized * waveFreq + phase) * waveAmp
                + Math.sin(normalized * (waveFreq * 0.55) - phase * 0.65) * waveAmp * 0.34;
            if (x === -radius * 0.92) ctx2d.moveTo(cx + x, y);
            else ctx2d.lineTo(cx + x, y);
        }
        ctx2d.stroke();

        const highlight = ctx2d.createRadialGradient(cx - radius * 0.18, cy - radius * 0.34, radius * 0.04, cx, cy, radius * 0.92);
        highlight.addColorStop(0, 'rgba(255,255,255,0.82)');
        highlight.addColorStop(0.2, 'rgba(236,246,255,0.42)');
        highlight.addColorStop(1, 'rgba(255,255,255,0)');
        ctx2d.fillStyle = highlight;
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, radius * 0.96, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.restore();

        ctx2d.save();
        ctx2d.globalCompositeOperation = 'lighter';
        ctx2d.strokeStyle = `rgba(170, 225, 255, ${0.09 + easedLevel * 0.12})`;
        ctx2d.lineWidth = radius * 0.04 * pulse;
        ctx2d.filter = 'blur(18px)';
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, radius * 1.03, 0, Math.PI * 2);
        ctx2d.stroke();
        ctx2d.restore();

        ctx2d.strokeStyle = `rgba(214, 241, 255, ${0.2 + easedLevel * 0.12})`;
        ctx2d.lineWidth = Math.max(2, radius * 0.018);
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, radius * 1.01, 0, Math.PI * 2);
        ctx2d.stroke();
    }

    function startAudioVisualizer(stream) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (state.audioCtx.state === 'suspended') {
            state.audioCtx.resume().catch(() => { });
        }
        state.analyser = state.audioCtx.createAnalyser();
        state.analyser.fftSize = 512;
        state.analyser.smoothingTimeConstant = 0.58;
        state.source = state.audioCtx.createMediaStreamSource(stream);
        state.source.connect(state.analyser);
        drawWave();
    }

    function startAudioFromMic() {
        acquireCaptureStream('mic')
            .then(stream => {
                startAudioVisualizer(stream);
                updateDiagnostics({ captureSource: 'mic', captureMode: state.mode }, 'Microphone capture active');
            }).catch((err) => {
                setStatus('Microphone unavailable', 'Grant permission and try again');
                toast(err.message || 'Microphone access denied', 'error');
            });
    }

    function stopAudio() {
        if (state.animFrame) { cancelAnimationFrame(state.animFrame); state.animFrame = null; }
        if (state.source) { state.source.disconnect(); state.source = null; }
        if (state.audioCtx) { state.audioCtx.close().catch(() => { }); state.audioCtx = null; }
        if (state.micStream && state.mode !== 'quality') {
            stopActiveCaptureTracks();
        }
        state.visualLevel = 0;
        waveformWrap?.style.setProperty('--orb-level', '0');
        drawOrbFrame(0, false);
    }

    function drawWave() {
        state.animFrame = requestAnimationFrame(drawWave);
        if (!state.analyser) {
            drawOrbFrame(0, false);
            return;
        }
        const bufLen = state.analyser.frequencyBinCount;
        const data = new Uint8Array(bufLen);
        state.analyser.getByteTimeDomainData(data);
        const liveLevel = analyzeLiveLevel(data);
        state.visualLevel = state.visualLevel * 0.82 + liveLevel * 0.18;
        waveformWrap?.style.setProperty('--orb-level', state.visualLevel.toFixed(3));
        drawOrbFrame(state.visualLevel, true, data);
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // TIMER
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function startTimer() {
        state.sessionStart = Date.now();
        state.timerInterval = setInterval(updateTimer, 500);
    }

    function stopTimer() {
        clearInterval(state.timerInterval);
        if (state.sessionStart) {
            durStat.textContent = fmtTime(Date.now() - state.sessionStart) + ' duration';
        }
    }

    function updateTimer() {
        if (!state.sessionStart) return;
        timerEl.textContent = fmtTime(Date.now() - state.sessionStart);
        if (orbTimerDisplay) orbTimerDisplay.textContent = timerEl.textContent;
        if (captureOrbTimerDisplay) captureOrbTimerDisplay.textContent = timerEl.textContent;
        if (captureTimerDisplay) captureTimerDisplay.textContent = timerEl.textContent;
    }

    function fmtTime(ms) {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }

    function commitPendingRealtimeInterim() {
        flushPendingRealtimeSegment(true);
        const rawInterim = String(state.lastInterimText || '').trim();
        if (!rawInterim) return false;

        const displayValue = String(transcript.value || '').trim();
        const confirmedValue = String(state.confirmedText || '').trim();
        let commitText = '';

        if (!confirmedValue) {
            commitText = displayValue || rawInterim;
        } else if (displayValue && displayValue !== confirmedValue) {
            commitText = displayValue.startsWith(confirmedValue)
                ? displayValue.slice(confirmedValue.length).trim()
                : rawInterim;
        } else {
            commitText = rawInterim;
        }

        if (!commitText) {
            state.lastInterimText = '';
            return false;
        }

        const gapMs = state.lastEndTime ? Date.now() - state.lastEndTime : 0;
        const finalText = applySmartPunct(commitText, gapMs);
        addSegment(finalText, 0.75, null, getWhisperLang() || getLiveRecognitionLang() || '', {
            source: 'live',
            provisional: true,
            alternatives: state.lastInterimAlternatives || [],
            reliability: state.liveHealth.score
        });
        state.confirmedText = transcript.value;
        state.lastInterimText = '';
        state.lastInterimAlternatives = [];
        interimEl.textContent = '';
        interimEl.classList.remove('idle-hint');
        updateCaptureInterim('');
        syncCaptureTranscript();
        state.lastEndTime = Date.now();
        return true;
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // START / STOP
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function scheduleRestart(delay = 50) {
        clearTimeout(state.restartTimeout);
        state.restartTimeout = setTimeout(() => {
            state.restartTimeout = null;
            if (state.isRecording && state.mode === 'realtime' && recognition) {
                try {
                    const lang = getLiveRecognitionLang();
                    recognition.lang = lang || 'en-IN';
                    if (state.lastInterimText) {
                        setStatus('Recovering live speech', 'Keeping your interim text while the recognizer restarts');
                    }
                    recognition.start();
                } catch (e) { }
            }
        }, delay);
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // NO-SPEECH / AUTO-COPY
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function setNoSpeechTimer() {
        clearNoSpeechTimer();
        state.noSpeechTimer = setTimeout(() => {
            if (state.isRecording) {
                statusSub.textContent = state.liveHealth.mode === 'recovering'
                    ? 'Waiting while live recognition recovers...'
                    : 'Waiting for speech...';
                if (state.autoCopyEnabled && state.confirmedText.trim()) {
                    autoCopyBtn.classList.add('auto-copy-active');
                    startAutoCopyCountdown();
                }
                if (shouldTriggerRealtimeFallback()) {
                    runRealtimeFallback('Repeated no-speech or weak live recognition');
                }
            }
        }, 4000);
    }

    function clearNoSpeechTimer() {
        clearTimeout(state.noSpeechTimer);
        if (state.isRecording) statusSub.textContent = state.mode === 'quality' ? 'Speak now - tap the orb or press Space to stop' : 'Speak now - tap the orb or press Space to stop';
    }

    function startAutoCopyCountdown() {
        clearAutoCopyCountdown();
        if (!state.autoCopyEnabled || !state.isRecording) return;
        if (!state.confirmedText.trim()) return;

        autoCopyBar.classList.add('visible');
        autoCopyFill.style.width = '100%';
        const start = Date.now();

        state.autoCopyCountdown = setInterval(() => {
            const elapsed = Date.now() - start;
            const pct = Math.max(0, 100 - (elapsed / AUTO_COPY_DELAY) * 100);
            autoCopyFill.style.width = pct + '%';
            if (elapsed >= AUTO_COPY_DELAY) {
                clearAutoCopyCountdown();
                triggerAutoCopy();
            }
        }, 80);
    }

    function clearAutoCopyCountdown() {
        clearInterval(state.autoCopyCountdown);
        state.autoCopyCountdown = null;
        autoCopyBar.classList.remove('visible');
        autoCopyFill.style.width = '100%';
    }

    function triggerAutoCopy() {
        const text = transcript.value.trim();
        if (!text) return;
        copyToClipboard(text, () => {
            addToHistory(text);
            saveUndo(transcript.value);
            clearTranscript();
            autoCopyBtn.classList.remove('auto-copy-active');
            toast('Auto-copied & cleared', 'success');
        });
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // SMART PUNCTUATION
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function applySmartPunct(text, gapMs) {
        if (!state.smartPunctEnabled) return text;
        let result = text.trim();
        result = result.charAt(0).toUpperCase() + result.slice(1);
        if (state.confirmedText && gapMs > 0) {
            const last = state.confirmedText.trimEnd();
            const lastChar = last.slice(-1);
            if (!/[.!?,;:\-]/.test(lastChar)) {
                if (gapMs > 2000) {
                    state.confirmedText = last + '. ';
                    transcript.value = state.confirmedText;
                } else if (gapMs > 700) {
                    state.confirmedText = last + ', ';
                    transcript.value = state.confirmedText;
                }
            }
        }
        return result;
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // SEGMENT & TRANSCRIPT
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function addSegment(text, conf, timeStr, lang, meta = {}) {
        if (!text) return;
        const elapsed = state.sessionStart ? Date.now() - state.sessionStart : 0;
        const seg = normalizeSegment({
            text,
            conf: conf || 0,
            time: timeStr || fmtTime(elapsed),
            lang: lang || '',
            created: Date.now(),
            startSec: timeStr ? parseTimeStr(timeStr) : elapsed / 1000,
            endSec: null,
            speaker: state.speakerMode ? (state.segments.length % 2 === 0 ? 'Speaker A' : 'Speaker B') : '',
            source: meta.source || 'live',
            provisional: !!meta.provisional,
            alternatives: meta.alternatives || [],
            reliability: Number.isFinite(meta.reliability) ? meta.reliability : state.liveHealth.score,
            correctionStatus: meta.correctionStatus || '',
            originalText: meta.originalText || '',
            correctedAt: meta.correctedAt || ''
        }, state.segments.length);
        state.segments.push(seg);
        if (state.segments.length > 1) {
            const prev = state.segments[state.segments.length - 2];
            if (!prev.endSec) prev.endSec = seg.startSec;
        }
        renderSegments();
        rebuildTranscriptFromSegments();
        queueTranslationForSegmentIds([seg.id]);
        queueSelectiveCorrectionForSegment(seg.id);
    }

    function parseTimeStr(ts) {
        const parts = ts.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    function appendToTranscript(text) {
        if (!text) return;
        const now = Date.now();
        const gap = now - state.lastEndTime;
        const cur = transcript.value;
        let sep = '';
        if (cur && !cur.endsWith('\n')) {
            sep = (gap > 2500 && state.lastEndTime > 0) ? '\n\n' : ' ';
        }
        transcript.value += sep + text;
        transcript.scrollTop = transcript.scrollHeight;
        syncCaptureTranscript();
        updateStats();
    }

    function clearTranscript() {
        transcript.value = '';
        state.confirmedText = '';
        state.segments = [];
        state.correctionHistory = [];
        state.correctionQueue = [];
        state.correctionBusy = false;
        syncCaptureTranscript();
        updateCaptureInterim('');
        state.correctionCache = {};
        persistCorrectionCache();
        state.detectedLanguage = '';
        state.fileHash = '';
        state.cacheKey = '';
        state.audioDurationSec = 0;
        segView.innerHTML = '';
        segCount.textContent = '0 segments';
        durStat.textContent = '0:00 duration';
        timerEl.textContent = '00:00';
        if (orbTimerDisplay) orbTimerDisplay.textContent = '00:00';
        if (captureOrbTimerDisplay) captureOrbTimerDisplay.textContent = '00:00';
        if (captureTimerDisplay) captureTimerDisplay.textContent = '00:00';
        detectedLangBadge.style.display = 'none';
        renderSegments();
        resetTranslationSession({ keepSettings: true });
        updateStats();
        scheduleWorkspaceSave();

        /* Clear AI output panel */
        const aiOutputEl = document.getElementById('aiOutput')
            || document.querySelector('[id*="aiOutput"], [id*="ai-output"]');
        if (aiOutputEl) aiOutputEl.value = '';

        /* Clear state if it exists */
        if (typeof state !== 'undefined' && state.aiOutput !== undefined) {
            state.aiOutput = '';
        }
    }

    function updateStats() {
        const raw = transcript.value.trim();
        const words = raw ? raw.split(/\s+/).filter(Boolean).length : 0;
        const chars = raw.length;
        animateCount(wordPill, words, (value) => formatCounterLabel(value, 'word'));
        animateCount(charPill, chars, (value) => formatCounterLabel(value, 'char'));
        wordPill.classList.toggle('active', words > 0);
        charPill.classList.toggle('active', chars > 0);
        sessionStorage.setItem('vt_ai_output', aiOutput?.value || '');
        syncCaptureTranscript();
        refreshExportCards();
        syncStatusBar();
    }

    function syncStatusBar() {
        const recDot = $('statusBarRecDot');
        const recText = $('statusBarRecText');
        const sbWords = $('statusBarWords');
        const sbChars = $('statusBarChars');
        const sbLang = $('statusBarLang');
        const sbMode = $('statusBarMode');
        const sbAutosave = $('statusBarAutosave');
        if (!recDot) return;

        // Recording state
        const isRec = !!state.isRecording;
        recDot.classList.toggle('recording', isRec);
        recDot.classList.toggle('processing', !!state.isProcessing && !isRec);
        if (recText) recText.textContent = isRec ? 'Recording' : (state.isProcessing ? 'Processing' : 'Idle');

        // Word / char counts
        const raw = transcript ? transcript.value.trim() : '';
        const wc = raw ? raw.split(/\s+/).filter(Boolean).length : 0;
        const cc = raw.length;
        animateCount(sbWords, wc, (value) => `${value} words`);
        animateCount(sbChars, cc, (value) => `${value} chars`);

        // Language
        if (sbLang) {
            const lang = state.detectedLanguage || '-';
            sbLang.textContent = lang === '-' ? '-' : 'Lang: ' + lang;
        }

        // Mode
        if (sbMode) {
            const modeMap = { realtime: 'LIVE', quality: 'QUALITY', file: 'FILE' };
            sbMode.innerHTML = '<strong>' + (modeMap[state.mode] || 'LIVE') + '</strong>';
            sbMode.classList.remove('is-flashing');
            void sbMode.offsetWidth;
            sbMode.classList.add('is-flashing');
        }

        // Autosave
        if (sbAutosave) {
            const autosaveOn = state.autosaveEnabled;
            sbAutosave.textContent = autosaveOn ? (state.isProcessing ? 'Saving...' : 'Autosave on') : 'Autosave off';
            sbAutosave.classList.toggle('is-on', autosaveOn);
            sbAutosave.classList.toggle('is-saving', autosaveOn && !!state.isProcessing);
        }
    }

    function escHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // VIEW TOGGLE
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function switchView(v) {
        state.currentView = v;
        $('btnRaw').classList.toggle('active', v === 'raw');
        $('btnSeg').classList.toggle('active', v === 'segments');
        transcript.style.display = (v === 'raw') ? 'block' : 'none';
        segView.style.display = (v === 'segments') ? 'block' : 'none';
        if (translatedTranscript) translatedTranscript.style.display = (v === 'raw') ? 'block' : 'none';
        if (translatedSegmentsView) translatedSegmentsView.style.display = (v === 'segments') ? 'block' : 'none';
        syncInteractiveChrome();
    }

    $('btnRaw').addEventListener('click', () => switchView('raw'));
    $('btnSeg').addEventListener('click', () => switchView('segments'));

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // MODE TOGGLE
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // STATUS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function setStatus(main, sub) {
        statusMain.textContent = normalizeUiText(main);
        statusSub.textContent = normalizeUiText(sub);
        if (orbStatusMain) orbStatusMain.textContent = normalizeUiText(main);
        if (captureOrbStatus && !state.isRecording) captureOrbStatus.textContent = normalizeUiText(main);
        if (captureStatusMain) captureStatusMain.textContent = normalizeUiText(main);
        if (captureStatusSub) captureStatusSub.textContent = normalizeUiText(sub);
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // TOAST
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function toast(msg, type = 'info', duration = 2400) {
        const container = $('toastContainer');
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = normalizeUiText(msg);
        container.appendChild(el);
        setTimeout(() => {
            el.classList.add('out');
            setTimeout(() => el.remove(), 300);
        }, duration);
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // CLIPBOARD
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function copyToClipboard(text, onSuccess) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(onSuccess).catch(() => legacyCopy(text, onSuccess));
        } else {
            legacyCopy(text, onSuccess);
        }
    }

    function legacyCopy(text, onSuccess) {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
        document.body.appendChild(el);
        el.focus();
        el.select();
        try { document.execCommand('copy'); onSuccess(); } catch (e) { toast('Copy failed', 'error'); }
        document.body.removeChild(el);
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // UNDO / HISTORY
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function saveUndo(text) {
        state.undoBuffer = text;
        sessionStorage.setItem('vt_undo', text);
    }

    function addToHistory(text) {
        if (!text.trim()) return;
        state.copyHistory.unshift({
            text,
            preview: text.trim().slice(0, 120),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        if (state.copyHistory.length > 10) state.copyHistory.pop();
        sessionStorage.setItem('vt_history', JSON.stringify(state.copyHistory));
        renderHistory();
    }

    function renderHistory() {
        if (!state.copyHistory.length) {
            historyList.innerHTML = '<div class="history-empty">No history yet - copied text will appear here</div>';
            return;
        }
        historyList.innerHTML = state.copyHistory.map((item, i) => `
      <div class="history-item" data-index="${i}">
        <div class="history-item-meta">${item.time}</div>
        <div class="history-item-preview">${escHtml(item.preview)}${item.text.length > 120 ? '...' : ''}</div>
        <button class="history-item-restore" data-index="${i}">Restore</button>
      </div>
    `).join('');

        historyList.querySelectorAll('.history-item-restore').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                const item = state.copyHistory[idx];
                if (item) {
                    transcript.value = item.text;
                    state.confirmedText = item.text;
                    updateStats();
                    toast('Restored from history', 'success');
                }
            });
        });
    }

    renderHistory();

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // EXPORT HELPERS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function generateSRT() {
        return state.segments.map((seg, i) => {
            const startSec = seg.startSec || 0;
            const endSec = seg.endSec || (startSec + 5);
            const line = getSubtitleTextForSegment(seg);
            return `${i + 1}\n${formatTimestampFull(startSec)} --> ${formatTimestampFull(endSec)}\n${line}\n`;
        }).join('\n');
    }

    function generateVTT() {
        let vtt = 'WEBVTT\n\n';
        state.segments.forEach((seg) => {
            const startSec = seg.startSec || 0;
            const endSec = seg.endSec || (startSec + 5);
            const line = getSubtitleTextForSegment(seg);
            vtt += `${formatTimestampVTT(startSec)} --> ${formatTimestampVTT(endSec)}\n${line}\n\n`;
        });
        return vtt;
    }

    function generateJSON() {
        return JSON.stringify({
            text: transcript.value,
            translatedText: translatedTranscript?.value || '',
            aiOutput: aiOutput.value,
            preset: state.preset,
            language: state.detectedLanguage || '',
            translation: {
                enabled: !!state.translation.enabled,
                targetLanguage: state.translation.targetLanguage,
                provider: state.translation.provider || state.apiProvider,
                model: state.translation.model || getActiveChatModel(),
                stats: state.translation.stats
            },
            segments: state.segments.map(s => ({
                start: s.startSec || 0,
                end: s.endSec || 0,
                text: s.text,
                rawText: s.rawText || s.originalText || '',
                confidence: s.conf,
                language: s.lang || '',
                rawLanguage: s.rawLanguage || '',
                speaker: s.speaker || '',
                locked: !!s.locked,
                correctionStatus: s.correctionStatus || '',
                qualityScore: s.qualityScore || 0,
                qualityFlags: s.qualityFlags || [],
                translation: getTranslationResultForSegment(s)?.translatedText || '',
                sentiment: getTranslationResultForSegment(s)?.sentiment || '',
                tone: getTranslationResultForSegment(s)?.tone || ''
            })),
            metadata: {
                wordCount: transcript.value.trim().split(/\s+/).filter(Boolean).length,
                exportedAt: new Date().toISOString(),
                fileHash: state.fileHash || ''
            }
        }, null, 2);
    }

    function generateMarkdown() {
        const title = `# Transcript Export\n\n- Preset: ${state.preset}\n- Language: ${state.detectedLanguage || 'UNKNOWN'}\n- Exported: ${new Date().toLocaleString()}\n\n## Transcript\n\n${transcript.value.trim() || '_Empty_'}\n`;
        const translationSection = state.translation.enabled && (translatedTranscript?.value || '').trim()
            ? `\n## Translation (${translationTargetLabelFor(state.translation.targetLanguage)})\n\n${translatedTranscript.value.trim()}\n`
            : '';
        const notes = aiOutput.value.trim() ? `\n## AI Output\n\n${aiOutput.value.trim()}\n` : '';
        const segments = state.segments.length ? `\n## Segments\n\n${state.segments.map(seg => `- [${seg.time}] ${seg.speaker ? `**${seg.speaker}:** ` : ''}${seg.text}`).join('\n')}\n` : '';
        return title + translationSection + notes + segments;
    }

    function generateCSV() {
        const rows = [['index', 'start', 'end', 'speaker', 'confidence', 'language', 'text', 'translation_target', 'translated_text', 'sentiment', 'tone']];
        state.segments.forEach((seg, idx) => {
            const translation = getTranslationResultForSegment(seg) || {};
            rows.push([
                idx + 1,
                seg.startSec || 0,
                seg.endSec || 0,
                seg.speaker || '',
                typeof seg.conf === 'number' ? seg.conf.toFixed(3) : '',
                seg.lang || '',
                seg.text || '',
                state.translation.targetLanguage || '',
                translation.translatedText || '',
                translation.sentiment || '',
                translation.tone || ''
            ]);
        });
        return rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    }

    function generateWorkspaceJSON() {
        return JSON.stringify(getWorkspacePayload(), null, 2);
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function downloadFile(content, filename, mime) {
        downloadBlob(new Blob([content], { type: mime }), filename);
    }

    function refreshTopDownloadAction() {
        if (!topDownloadBtn) return;
        const translateMode = shouldTranslateUploadedFile();
        const hasTranscript = !!getExportTranscriptText().trim();
        const hasSubtitles = !!state.segments.length;
        const canDownload = hasTranscript || hasSubtitles;
        if (topDownloadDropdown && !canDownload) topDownloadDropdown.classList.remove('open');
        topDownloadBtn.setAttribute('aria-disabled', String(!canDownload));
        topDownloadBtn.setAttribute('aria-expanded', 'false');
        topDownloadBtn.classList.toggle('is-disabled', !canDownload);
        topDownloadBtn.title = translateMode
            ? 'Download synced English subtitles or transcript files'
            : 'Download subtitle or transcript files';
        topDownloadBtn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download
        `;
    }

    function refreshExportCards() {
        if (!exportCardButtons.length) return;
        const hasTranscript = !!getExportTranscriptText().trim();
        exportCardButtons.forEach((button) => {
            const card = button.closest('.export-card');
            const disabled = !hasTranscript;
            button.disabled = disabled;
            card?.classList.toggle('is-disabled', disabled);
            if (disabled) {
                button.textContent = 'Download';
                card?.classList.remove('is-downloaded');
            }
        });
    }

    function escapeXml(text = '') {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function getDocxParagraphXml(text = '') {
        const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
        if (!lines.length) lines.push('');
        return lines.map((line) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`).join('');
    }

    function buildDocxXmlDocument(text = '') {
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14">
  <w:body>
    ${getDocxParagraphXml(text)}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;
    }

    function buildStoredZip(files) {
        const encoder = new TextEncoder();
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let value = i;
            for (let j = 0; j < 8; j++) value = (value & 1) ? (0xEDB88320 ^ (value >>> 1)) : (value >>> 1);
            table[i] = value >>> 0;
        }
        const crc32 = (bytes) => {
            let crc = 0xFFFFFFFF;
            for (let i = 0; i < bytes.length; i++) crc = table[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
            return (crc ^ 0xFFFFFFFF) >>> 0;
        };
        const now = new Date();
        const dosTime = ((now.getHours() & 0x1F) << 11) | ((now.getMinutes() & 0x3F) << 5) | (Math.floor(now.getSeconds() / 2) & 0x1F);
        const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 0x7F) << 9) | (((now.getMonth() + 1) & 0x0F) << 5) | (now.getDate() & 0x1F);
        const locals = [];
        const centrals = [];
        let offset = 0;

        files.forEach((file) => {
            const nameBytes = encoder.encode(file.name);
            const dataBytes = encoder.encode(file.content);
            const crc = crc32(dataBytes);

            const localHeader = new ArrayBuffer(30 + nameBytes.length);
            const localView = new DataView(localHeader);
            localView.setUint32(0, 0x04034b50, true);
            localView.setUint16(4, 20, true);
            localView.setUint16(6, 0, true);
            localView.setUint16(8, 0, true);
            localView.setUint16(10, dosTime, true);
            localView.setUint16(12, dosDate, true);
            localView.setUint32(14, crc, true);
            localView.setUint32(18, dataBytes.length, true);
            localView.setUint32(22, dataBytes.length, true);
            localView.setUint16(26, nameBytes.length, true);
            localView.setUint16(28, 0, true);
            new Uint8Array(localHeader, 30).set(nameBytes);
            locals.push(localHeader, dataBytes);

            const centralHeader = new ArrayBuffer(46 + nameBytes.length);
            const centralView = new DataView(centralHeader);
            centralView.setUint32(0, 0x02014b50, true);
            centralView.setUint16(4, 20, true);
            centralView.setUint16(6, 20, true);
            centralView.setUint16(8, 0, true);
            centralView.setUint16(10, 0, true);
            centralView.setUint16(12, dosTime, true);
            centralView.setUint16(14, dosDate, true);
            centralView.setUint32(16, crc, true);
            centralView.setUint32(20, dataBytes.length, true);
            centralView.setUint32(24, dataBytes.length, true);
            centralView.setUint16(28, nameBytes.length, true);
            centralView.setUint16(30, 0, true);
            centralView.setUint16(32, 0, true);
            centralView.setUint16(34, 0, true);
            centralView.setUint16(36, 0, true);
            centralView.setUint32(38, 0, true);
            centralView.setUint32(42, offset, true);
            new Uint8Array(centralHeader, 46).set(nameBytes);
            centrals.push(centralHeader);

            offset += localHeader.byteLength + dataBytes.byteLength;
        });

        const centralSize = centrals.reduce((sum, part) => sum + part.byteLength, 0);
        const end = new ArrayBuffer(22);
        const endView = new DataView(end);
        endView.setUint32(0, 0x06054b50, true);
        endView.setUint16(8, files.length, true);
        endView.setUint16(10, files.length, true);
        endView.setUint32(12, centralSize, true);
        endView.setUint32(16, offset, true);
        endView.setUint16(20, 0, true);

        return new Blob([...locals, ...centrals, end], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }

    function generateDocxBlob() {
        return buildStoredZip([
            {
                name: '[Content_Types].xml',
                content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
            },
            {
                name: '_rels/.rels',
                content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
            },
            {
                name: 'word/document.xml',
                content: buildDocxXmlDocument(getExportTranscriptText())
            }
        ]);
    }

    function updateTranscribeBtn() {
        const hasFile = !!state.uploadedFile;
        const hasKey = getProviderKeys().length > 0;
        transcribeBtn.disabled = !hasFile || !hasKey || state.isProcessing;
        if (!hasKey && hasFile) {
            transcribeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> API key required';
        } else if (!state.isProcessing) {
            transcribeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg> Transcribe';
        }
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }
    function safeJsonParse(text, fallback = null) {
        try { return JSON.parse(text); } catch (e) { return fallback; }
    }

    function normalizeProviderKeyStore(rawStore) {
        const store = rawStore && typeof rawStore === 'object' ? rawStore : {};
        const normalizeList = value => Array.isArray(value)
            ? [...new Set(value.map(v => String(v || '').trim()).filter(Boolean))]
            : [];
        return {
            groq: normalizeList(store.groq),
            openai: normalizeList(store.openai),
            gemini: normalizeList(store.gemini)
        };
    }

    function defaultAudioModel(provider) {
        return provider === 'groq' ? 'whisper-large-v3-turbo' : 'whisper-1';
    }

    function defaultChatModel(provider) {
        return provider === 'groq' ? 'openai/gpt-oss-120b' : 'gpt-4o-mini';
    }

    function defaultCorrectionModel(provider) {
        return provider === 'groq' ? 'openai/gpt-oss-20b' : 'gpt-4o-mini';
    }

    function remapDeprecatedGroqModel(model = '') {
        const value = String(model || '').trim();
        if (!value) return value;
        if (value === 'meta-llama/llama-4-maverick-17b-128e-instruct') return 'qwen/qwen3-32b';
        if (value === 'groq:meta-llama/llama-4-maverick-17b-128e-instruct') return 'groq:qwen/qwen3-32b';
        return value;
    }

    function defaultAssistantModelId() {
        return 'assistant:max';
    }

    function getGeminiAnalysisModelCatalog() {
        return [
            {
                value: 'gemini-2.5-flash-lite',
                label: 'Gemini 2.5 Flash-Lite',
                meta: 'Recommended for free-tier image/PDF analysis',
                rpm: 15,
                rpd: 1000
            },
            {
                value: 'gemini-2.5-flash',
                label: 'Gemini 2.5 Flash',
                meta: 'Higher quality multimodal',
                rpm: 10,
                rpd: 250
            },
            {
                value: 'gemini-2.5-pro',
                label: 'Gemini 2.5 Pro',
                meta: 'Paid Gemini key only',
                rpm: 5,
                rpd: 100
            }
        ];
    }

    function defaultGeminiAnalysisModel() {
        return 'gemini-2.5-flash-lite';
    }

    function getAssistantModelCatalog() {
        return [
            {
                id: 'assistant:max',
                provider: 'smart',
                model: 'assistant:max',
                label: 'Max',
                meta: 'Smart routing for long output + latency',
                supportsImages: true,
                supportsPdf: true
            },
            {
                id: 'groq:meta-llama/llama-4-scout-17b-16e-instruct',
                provider: 'groq',
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                label: 'Groq - Llama 4 Scout',
                meta: 'Images + OCR',
                supportsImages: true,
                supportsPdf: false
            },
            {
                id: 'groq:openai/gpt-oss-120b',
                provider: 'groq',
                model: 'openai/gpt-oss-120b',
                label: 'Groq - GPT OSS 120B',
                meta: 'Text only',
                supportsImages: false,
                supportsPdf: false
            },
            {
                id: 'groq:openai/gpt-oss-20b',
                provider: 'groq',
                model: 'openai/gpt-oss-20b',
                label: 'Groq - GPT OSS 20B',
                meta: 'Fast text',
                supportsImages: false,
                supportsPdf: false
            },
            {
                id: 'groq:moonshotai/kimi-k2-instruct',
                provider: 'groq',
                model: 'moonshotai/kimi-k2-instruct',
                label: 'Groq - Kimi K2',
                meta: 'Large context + analysis',
                supportsImages: false,
                supportsPdf: false
            },
            {
                id: 'groq:qwen/qwen3-32b',
                provider: 'groq',
                model: 'qwen/qwen3-32b',
                label: 'Groq - Qwen3 32B',
                meta: 'Reasoning + coding',
                supportsImages: false,
                supportsPdf: false
            },
            {
                id: 'groq:llama-3.3-70b-versatile',
                provider: 'groq',
                model: 'llama-3.3-70b-versatile',
                label: 'Groq - Llama 3.3 70B Versatile',
                meta: 'Strong general use',
                supportsImages: false,
                supportsPdf: false
            },
            {
                id: 'groq:llama-3.1-8b-instant',
                provider: 'groq',
                model: 'llama-3.1-8b-instant',
                label: 'Groq - Llama 3.1 8B Instant',
                meta: 'Very fast replies',
                supportsImages: false,
                supportsPdf: false
            },
        ];
    }

    function getAssistantProviderLabel(provider) {
        if (provider === 'gemini') return 'Gemini';
        if (provider === 'openai') return 'OpenAI';
        if (provider === 'smart') return 'Max';
        return 'Groq';
    }

    function getAssistantModelOption(id = state.assistant.model) {
        const catalog = getAssistantModelCatalog();
        return catalog.find(item => item.id === id) || catalog[0];
    }

    function getConfiguredGeminiAnalysisModel() {
        const catalog = getGeminiAnalysisModelCatalog();
        const matched = catalog.find(item => item.value === state.geminiAnalysisModel);
        return matched?.value || defaultGeminiAnalysisModel();
    }

    function getConfiguredGeminiAnalysisOption() {
        const model = getConfiguredGeminiAnalysisModel();
        const catalog = getGeminiAnalysisModelCatalog();
        const matched = catalog.find(item => item.value === model) || catalog[0];
        return {
            id: `gemini:${matched.value}`,
            provider: 'gemini',
            model: matched.value,
            label: `Gemini - ${matched.label.replace(/^Gemini\s*/i, '')}`,
            meta: matched.meta,
            supportsImages: true,
            supportsPdf: true,
            configured: true
        };
    }

    function findAssistantCatalogOption(id) {
        return getAssistantModelCatalog().find(item => item.id === id) || null;
    }

    function isLongOutputAssistantRequest(text = '') {
        const normalized = String(text || '').trim().toLowerCase();
        if (!normalized) return false;
        if (normalized.length > 280) return true;
        return /(complete implementation|full implementation|full code|complete code|long output|detailed document|detailed explanation|comprehensive|entire file|full api|full project|2000|1500|report|documentation|generate code|generate a project|rest api|express\.js|fastapi|without truncating|all sections)/i.test(normalized);
    }

    function isContextHeavyAssistantRequest(text = '') {
        return /(analyze|architecture|design|refactor|plan|compare|research|large context|codebase|workflow|system design)/i.test(String(text || ''));
    }

    function isQuickAssistantRequest(text = '') {
        return /(quick|brief|short|one line|fast answer|summarize quickly|tl;dr)/i.test(String(text || ''));
    }

    function resolveMaxAssistantModel(attachments = null, text = '') {
        const normalizedAttachments = normalizeAssistantAttachmentList(attachments);
        if (normalizedAttachments.length) {
            if (getProviderKeys('gemini').length) {
                return getConfiguredGeminiAnalysisOption();
            }
            return findAssistantCatalogOption('groq:meta-llama/llama-4-scout-17b-16e-instruct') || getAssistantModelCatalog()[0];
        }
        if (isLongOutputAssistantRequest(text)) {
            return findAssistantCatalogOption('groq:llama-3.3-70b-versatile') || getAssistantModelCatalog()[0];
        }
        if (isContextHeavyAssistantRequest(text)) {
            return findAssistantCatalogOption('groq:moonshotai/kimi-k2-instruct')
                || findAssistantCatalogOption('groq:qwen/qwen3-32b')
                || getAssistantModelCatalog()[0];
        }
        if (isQuickAssistantRequest(text)) {
            return findAssistantCatalogOption('groq:llama-3.1-8b-instant')
                || findAssistantCatalogOption('groq:openai/gpt-oss-20b')
                || getAssistantModelCatalog()[0];
        }
        return findAssistantCatalogOption('groq:llama-3.3-70b-versatile')
            || findAssistantCatalogOption('groq:openai/gpt-oss-120b')
            || getAssistantModelCatalog()[0];
    }

    function persistGeminiUsage() {
        localStorage.setItem('vt_gemini_usage', JSON.stringify(state.geminiUsage || {}));
    }

    function getGeminiUsageEntry(model = getConfiguredGeminiAnalysisModel()) {
        const now = Date.now();
        const today = new Date().toISOString().slice(0, 10);
        const existing = state.geminiUsage?.[model] && typeof state.geminiUsage[model] === 'object'
            ? { ...state.geminiUsage[model] }
            : {};
        const minuteWindowStart = now - Number(existing.minuteWindowStart || 0) < 60000
            ? Number(existing.minuteWindowStart || now)
            : now;
        const minuteCount = now - Number(existing.minuteWindowStart || 0) < 60000
            ? Math.max(0, Number(existing.minuteCount || 0))
            : 0;
        const dayKey = existing.dayKey === today ? today : today;
        const dayCount = existing.dayKey === today
            ? Math.max(0, Number(existing.dayCount || 0))
            : 0;
        const normalized = { minuteWindowStart, minuteCount, dayKey, dayCount };
        state.geminiUsage = { ...(state.geminiUsage || {}), [model]: normalized };
        return normalized;
    }

    function recordGeminiUsage(model = getConfiguredGeminiAnalysisModel()) {
        const entry = getGeminiUsageEntry(model);
        entry.minuteCount += 1;
        entry.dayCount += 1;
        state.geminiUsage = { ...(state.geminiUsage || {}), [model]: entry };
        persistGeminiUsage();
        renderGeminiUsageMeter();
    }

    function resetGeminiUsage(model = getConfiguredGeminiAnalysisModel()) {
        const today = new Date().toISOString().slice(0, 10);
        state.geminiUsage = {
            ...(state.geminiUsage || {}),
            [model]: {
                minuteWindowStart: Date.now(),
                minuteCount: 0,
                dayKey: today,
                dayCount: 0
            }
        };
        persistGeminiUsage();
        renderGeminiUsageMeter();
    }

    function renderGeminiUsageMeter() {
        const model = getConfiguredGeminiAnalysisModel();
        const quota = getGeminiAnalysisModelCatalog().find(item => item.value === model) || { rpm: 15, rpd: 1000, label: model };
        const entry = getGeminiUsageEntry(model);
        persistGeminiUsage();
        const minuteUsed = Math.max(0, Number(entry.minuteCount || 0));
        const dayUsed = Math.max(0, Number(entry.dayCount || 0));
        const minuteLimit = Math.max(1, Number(quota.rpm || 1));
        const dayLimit = Math.max(1, Number(quota.rpd || 1));
        const minutePct = Math.min(100, (minuteUsed / minuteLimit) * 100);
        const dayPct = Math.min(100, (dayUsed / dayLimit) * 100);
        if (geminiUsageTitle) geminiUsageTitle.textContent = `${quota.label} usage`;
        if (geminiUsageMinuteText) geminiUsageMinuteText.textContent = `${minuteUsed} / ${minuteLimit} used | ${Math.max(0, minuteLimit - minuteUsed)} left`;
        if (geminiUsageDayText) geminiUsageDayText.textContent = `${dayUsed} / ${dayLimit} used | ${Math.max(0, dayLimit - dayUsed)} left`;
        if (geminiUsageMinuteBar) geminiUsageMinuteBar.style.width = `${minutePct}%`;
        if (geminiUsageDayBar) geminiUsageDayBar.style.width = `${dayPct}%`;
        if (geminiUsageNote) geminiUsageNote.textContent = 'Tracked from this app only. External Gemini usage is not included.';
    }

    function getActiveAssistantModelOption() {
        return getAssistantModelOption(state.assistant.model);
    }

    function getActiveAssistantProvider() {
        return getActiveAssistantModelOption().provider;
    }

    function getActiveAssistantModel() {
        return getActiveAssistantModelOption().model;
    }

    function assistantAttachmentAccept(option = getActiveAssistantModelOption()) {
        const textAccept = 'text/plain,.txt,text/markdown,.md,text/csv,.csv,application/json,.json';
        const activeOption = option || getActiveAssistantModelOption();
        if (getProviderKeys('gemini').length) return `image/png,image/jpeg,image/webp,application/pdf,.pdf,${textAccept}`;
        if (!activeOption) return textAccept;
        if (activeOption.supportsPdf) return `image/png,image/jpeg,image/webp,application/pdf,.pdf,${textAccept}`;
        if (activeOption.supportsImages) return `image/png,image/jpeg,image/webp,${textAccept}`;
        return textAccept;
    }

    function attachmentKindFromMimeType(mimeType = '') {
        const normalized = String(mimeType || '').toLowerCase();
        if (normalized === 'application/pdf') return 'pdf';
        if (normalized.startsWith('image/')) return 'image';
        return 'text';
    }

    function inferAttachmentMimeType(file) {
        const type = String(file?.type || '').trim().toLowerCase();
        if (type) return type;
        const name = String(file?.name || '').toLowerCase();
        if (name.endsWith('.pdf')) return 'application/pdf';
        if (name.endsWith('.png')) return 'image/png';
        if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
        if (name.endsWith('.webp')) return 'image/webp';
        if (name.endsWith('.md')) return 'text/markdown';
        if (name.endsWith('.txt')) return 'text/plain';
        if (name.endsWith('.csv')) return 'text/csv';
        if (name.endsWith('.json')) return 'application/json';
        return '';
    }

    function canAssistantModelUseAttachment(option, attachment) {
        const attachments = normalizeAssistantAttachmentList(attachment);
        if (!option || !attachments.length) return true;
        const hasPdf = attachments.some(item => item.kind === 'pdf');
        const hasText = attachments.some(item => item.kind === 'text');
        if (hasPdf) return !!option.supportsPdf;
        if (hasText) return true;
        return !!option.supportsImages;
    }

    function getAssistantOptionForRequest(attachment = null, text = '') {
        const attachments = normalizeAssistantAttachmentList(attachment);
        const activeOption = getActiveAssistantModelOption();
        if (activeOption.id === 'assistant:max') {
            return resolveMaxAssistantModel(attachments, text);
        }
        if (!attachments.length) return activeOption;
        if (getProviderKeys('gemini').length) {
            return getConfiguredGeminiAnalysisOption();
        }
        const hasPdf = attachments.some(item => item.kind === 'pdf');
        if (hasPdf) return getConfiguredGeminiAnalysisOption();
        return activeOption;
    }

    function setAssistantModel(value, options = {}) {
        const next = getAssistantModelOption(remapDeprecatedGroqModel(value));
        state.assistant.model = next.id;
        localStorage.setItem('vt_assistant_model', state.assistant.model);
        if (!options.skipAttachmentCheck && state.assistant.pendingAttachment && !canAssistantModelUseAttachment(next, state.assistant.pendingAttachment)) {
            clearAssistantAttachment({ silent: true });
            toast(next.supportsPdf
                ? 'Pending attachment cleared because the selected model changed.'
                : 'Selected model does not support the pending attachment. Attachment cleared.', 'info', 3200);
        }
        if (!options.skipRender) renderAssistantComposer();
    }

    function populateAssistantModelControls() {
        const catalog = getAssistantModelCatalog();
        const recommended = getAssistantModelOption(defaultAssistantModelId());
        const optionMarkup = [
            `<option value="${recommended.id}">Recommended - ${recommended.label}</option>`,
            ...catalog
                .filter(item => item.id !== recommended.id)
                .map(item => `<option value="${item.id}">${item.label} - ${item.meta}</option>`)
        ].join('');
        if (assistantModelSelect) assistantModelSelect.innerHTML = optionMarkup;
        state.assistant.model = remapDeprecatedGroqModel(state.assistant.model);
        if (!state.assistant.model || !catalog.some(item => item.id === state.assistant.model)) {
            state.assistant.model = recommended.id;
            localStorage.setItem('vt_assistant_model', state.assistant.model);
        }
        if (assistantModelSelect) assistantModelSelect.value = state.assistant.model;
    }

    function populateGeminiModelControls() {
        const catalog = getGeminiAnalysisModelCatalog();
        const active = getConfiguredGeminiAnalysisModel();
        const optionMarkup = [
            `<option value="${defaultGeminiAnalysisModel()}">Recommended - Gemini 2.5 Flash-Lite</option>`,
            ...catalog
                .filter(item => item.value !== defaultGeminiAnalysisModel())
                .map(item => `<option value="${item.value}">${item.label} - ${item.meta}</option>`)
        ].join('');
        state.geminiAnalysisModel = active;
        localStorage.setItem('vt_gemini_analysis_model', active);
        if (geminiModelSelect) geminiModelSelect.innerHTML = optionMarkup;
        if (geminiModelSelect) geminiModelSelect.value = active;
        renderGeminiUsageMeter();
    }

    function getChatModelCatalog(provider) {
        if (provider === 'groq') {
            return [
                { value: 'openai/gpt-oss-120b', label: 'GPT OSS 120B', meta: 'Balanced reasoning' },
                { value: 'openai/gpt-oss-20b', label: 'GPT OSS 20B', meta: 'Fast + low cost' },
                { value: 'moonshotai/kimi-k2-instruct', label: 'Kimi K2', meta: 'Large context' },
                { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout', meta: 'Multimodal + fast' },
                { value: 'qwen/qwen3-32b', label: 'Qwen3 32B', meta: 'Reasoning + coding' },
                { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile', meta: 'Strong general use' },
                { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', meta: 'Very fast replies' }
            ];
        }
        return [
            { value: 'gpt-4o-mini', label: 'GPT-4o Mini', meta: 'Recommended' },
            { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', meta: 'Sharper reasoning' }
        ];
    }

    function getActiveChatModel() {
        return remapDeprecatedGroqModel((state.chatModel || defaultChatModel(state.apiProvider)).trim());
    }

    function syncChatModelSelectors() {
        const active = getActiveChatModel();
        const catalog = getChatModelCatalog(state.apiProvider);
        const matched = catalog.some(item => item.value === active)
            ? active
            : defaultChatModel(state.apiProvider);
        if (chatModelSelect) chatModelSelect.value = matched;
        if (assistantModelSelect) assistantModelSelect.value = state.assistant.model;
    }

    function populateChatModelControls() {
        const catalog = getChatModelCatalog(state.apiProvider);
        const defaultValue = defaultChatModel(state.apiProvider);
        const optionMarkup = [
            `<option value="${defaultValue}">Recommended - ${defaultValue}</option>`,
            ...catalog
                .filter(item => item.value !== defaultValue)
                .map(item => `<option value="${item.value}">${item.label} - ${item.value}</option>`),
        ].join('');
        if (chatModelSelect) chatModelSelect.innerHTML = optionMarkup;
        if (chatModelSuggestions) {
            chatModelSuggestions.innerHTML = catalog
                .map(item => `<option value="${item.value}"></option>`)
                .join('');
        }
        syncChatModelSelectors();
    }

    function setChatModel(value, options = {}) {
        const next = remapDeprecatedGroqModel(String(value || '').trim() || defaultChatModel(state.apiProvider));
        state.chatModel = next;
        localStorage.setItem('vt_chat_model', state.chatModel);
        if (chatModelInput && chatModelInput.value !== next) chatModelInput.value = next;
        syncChatModelSelectors();
        if (!options.skipRender) renderAssistantMessages();
        if (!options.skipSave) scheduleWorkspaceSave();
    }

    function getApiModel() {
        return (state.audioModel || defaultAudioModel(state.apiProvider)).trim();
    }

    function getEffectiveAudioModel(options = {}) {
        const selectedLang = normalizeLanguageCode(options.language === undefined ? getWhisperLang() : options.language);
        const currentModel = getApiModel();
        const isEnglishOnlyModel = currentModel && (currentModel.includes('-en') || currentModel === 'distil-whisper-large-v3-en');
        if (!options.translate && selectedLang && selectedLang !== 'en' && isEnglishOnlyModel) {
            return 'whisper-large-v3';
        }
        if (state.apiProvider === 'groq' && options.translate) {
            return 'whisper-large-v3';
        }
        return currentModel;
    }

    function getProviderKeys(provider = state.apiProvider) {
        state.providerKeys = normalizeProviderKeyStore(state.providerKeys);
        const vault = Array.isArray(state.providerKeys?.[provider]) ? state.providerKeys[provider].filter(Boolean) : [];
        const apiKey = provider === state.apiProvider ? (state.apiKey || '').trim() : '';
        if (apiKey && !vault.includes(apiKey)) return [apiKey, ...vault];
        return vault;
    }

    function getAudioEndpoint(kind = 'transcriptions', provider = state.apiProvider) {
        return provider === 'groq'
            ? `https://api.groq.com/openai/v1/audio/${kind}`
            : `https://api.openai.com/v1/audio/${kind}`;
    }

    function getChatEndpoint(provider = state.apiProvider) {
        return provider === 'groq'
            ? 'https://api.groq.com/openai/v1/chat/completions'
            : 'https://api.openai.com/v1/chat/completions';
    }

    function getGeminiGenerateEndpoint(model) {
        return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    }

    function getGeminiUploadEndpoint() {
        return 'https://generativelanguage.googleapis.com/upload/v1beta/files';
    }

    function persistProviderStore() {
        state.providerKeys = normalizeProviderKeyStore(state.providerKeys);
        localStorage.setItem('vt_provider_keys', JSON.stringify(state.providerKeys || { groq: [], openai: [], gemini: [] }));
    }

    function updateProviderVaultMeta(provider, element) {
        if (!element) return;
        const count = (state.providerKeys?.[provider] || []).filter(Boolean).length;
        element.textContent = count ? `${count} key${count > 1 ? 's' : ''} stored for ${provider}` : `No keys stored for ${provider}`;
    }

    function updateVaultMeta() {
        updateProviderVaultMeta(state.apiProvider, apiVaultMeta);
        updateProviderVaultMeta('gemini', geminiVaultMeta);
    }

    function clearSavedProviderKeys() {
        state.apiKey = '';
        state.providerKeys = normalizeProviderKeyStore({ groq: [], openai: [], gemini: [] });
        localStorage.removeItem('vt_api_key');
        localStorage.removeItem('vt_provider_keys');
        if (apiKeyInput) apiKeyInput.value = '';
        if (apiKeyVault) apiKeyVault.value = '';
        if (geminiKeyInput) geminiKeyInput.value = '';
        if (geminiKeyVault) geminiKeyVault.value = '';
        if (apiStatusLabel) apiStatusLabel.textContent = 'Not configured';
        if (apiStatusDot) apiStatusDot.className = 'api-status-dot';
        updateVaultMeta();
        updateTranscribeBtn();
        renderAssistantComposer();
        scheduleWorkspaceSave();
        toast('Saved provider keys cleared from this browser', 'success');
    }

    function setCacheStatus(message) {
        cacheStatus.textContent = message || 'Cache idle';
    }

    function escapeHtml(v) {
        return String(v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }

    function parseGlossary() {
        return (state.glossaryRaw || '')
            .split(/\n+/)
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {
                const parts = line.split(/=>|->|→/).map(s => s.trim());
                return parts.length >= 2 ? { from: parts[0], to: parts.slice(1).join(' => ') } : null;
            })
            .filter(Boolean);
    }

    function applyGlossaryToText(text = '') {
        let out = String(text || '');
        for (const rule of parseGlossary()) {
            if (!rule.from) continue;
            const escaped = rule.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            out = out.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), rule.to);
        }
        return out;
    }

    function cleanTranscriptLocal(text = '') {
        let out = String(text || '').replace(/\r/g, '');
        out = out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ');
        out = out.split('\n').map(s => s.trimEnd()).join('\n').trim();
        return applyGlossaryToText(out);
    }

    function redactSensitiveText(text = '') {
        return String(text || '')
            .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
            .replace(/\b(?:\+?\d[\d\s-]{7,}\d)\b/g, '[REDACTED_PHONE]')
            .replace(/\b(?:sk|gsk|rk|api)[-_][A-Za-z0-9_-]{10,}\b/gi, '[REDACTED_KEY]');
    }

    function normalizeSegment(seg = {}, idx = 0) {
        const startSec = Number.isFinite(seg.startSec) ? seg.startSec : (Number.isFinite(seg.start) ? seg.start : idx * 3);
        const endSec = Number.isFinite(seg.endSec) ? seg.endSec : (Number.isFinite(seg.end) ? seg.end : null);
        return {
            id: seg.id || `seg_${Date.now()}_${idx}`,
            text: applyGlossaryToText((seg.text || '').trim()),
            conf: typeof seg.conf === 'number' ? seg.conf : (typeof seg.confidence === 'number' ? seg.confidence : 0.85),
            time: seg.time || formatTimestamp(startSec || 0),
            lang: seg.lang || seg.language || '',
            created: seg.created || Date.now(),
            startSec: startSec || 0,
            endSec,
            speaker: seg.speaker || '',
            locked: !!seg.locked,
            source: String(seg.source || 'live'),
            provisional: !!seg.provisional,
            alternatives: Array.isArray(seg.alternatives) ? seg.alternatives.map(String).filter(Boolean).slice(0, 3) : [],
            reliability: Number.isFinite(seg.reliability) ? seg.reliability : 1,
            correctionStatus: String(seg.correctionStatus || ''),
            originalText: String(seg.originalText || ''),
            correctedAt: String(seg.correctedAt || ''),
            rawText: String(seg.rawText || seg.originalText || seg.text || ''),
            rawLanguage: String(seg.rawLanguage || seg.lang || seg.language || ''),
            qualityScore: Number.isFinite(seg.qualityScore) ? seg.qualityScore : 1,
            qualityFlags: Array.isArray(seg.qualityFlags) ? seg.qualityFlags.map(String).filter(Boolean) : []
        };
    }

    function persistCorrectionCache() {
        try {
            sessionStorage.setItem('vt_correction_cache', JSON.stringify(state.correctionCache || {}));
        } catch (e) { }
    }

    function translationLanguageCatalog() {
        return {
            en: 'English',
            hi: 'Hindi',
            ta: 'Tamil',
            te: 'Telugu',
            mr: 'Marathi',
            bn: 'Bengali',
            gu: 'Gujarati',
            kn: 'Kannada',
            ml: 'Malayalam',
            pa: 'Punjabi',
            ur: 'Urdu',
            es: 'Spanish',
            fr: 'French',
            de: 'German',
            ja: 'Japanese',
            zh: 'Mandarin',
            ar: 'Arabic',
            pt: 'Portuguese',
            ko: 'Korean',
            ru: 'Russian'
        };
    }

    function translationTargetLabelFor(code = 'en') {
        return translationLanguageCatalog()[code] || String(code || 'English').toUpperCase();
    }

    function createEmptyTranslationStats() {
        return {
            positive: 0,
            neutral: 0,
            negative: 0,
            dominant: 'No data',
            trend: 'Enable translation to start tracking'
        };
    }

    function normalizeTranslationStats(stats = {}) {
        return {
            positive: Math.max(0, Number(stats.positive || 0)),
            neutral: Math.max(0, Number(stats.neutral || 0)),
            negative: Math.max(0, Number(stats.negative || 0)),
            dominant: String(stats.dominant || 'No data'),
            trend: String(stats.trend || 'Enable translation to start tracking')
        };
    }

    function normalizeTranslationEntry(entry = {}, segment = null) {
        const sourceText = String(entry.sourceText || segment?.text || '').trim();
        const translatedText = String(entry.translatedText || entry.translation || '').trim();
        const sentiment = ['positive', 'neutral', 'negative'].includes(String(entry.sentiment || '').toLowerCase())
            ? String(entry.sentiment || '').toLowerCase()
            : 'neutral';
        return {
            segmentId: String(entry.segmentId || segment?.id || ''),
            sourceText,
            translatedText: translatedText || sourceText,
            sentiment,
            tone: String(entry.tone || '').trim(),
            status: ['pending', 'ready', 'error', 'disabled', 'degraded'].includes(String(entry.status || '').toLowerCase())
                ? String(entry.status || '').toLowerCase()
                : (translatedText ? 'ready' : 'pending'),
            targetLanguage: String(entry.targetLanguage || 'en'),
            provider: String(entry.provider || ''),
            model: String(entry.model || ''),
            error: String(entry.error || '').trim(),
            updatedAt: String(entry.updatedAt || '')
        };
    }

    function normalizeTranslationState(raw = {}) {
        const segmentResults = {};
        const sourceResults = raw && typeof raw.segmentResults === 'object' ? raw.segmentResults : {};
        Object.keys(sourceResults || {}).forEach(key => {
            const normalized = normalizeTranslationEntry(sourceResults[key]);
            if (normalized.segmentId) segmentResults[normalized.segmentId] = normalized;
        });
        return {
            enabled: !!raw.enabled,
            targetLanguage: String(raw.targetLanguage || 'en'),
            provider: String(raw.provider || ''),
            model: String(raw.model || ''),
            segmentResults,
            pendingQueue: Array.isArray(raw.pendingQueue) ? raw.pendingQueue.map(String).filter(Boolean) : [],
            isProcessing: !!raw.isProcessing,
            lastTranslatedSegmentIndex: Number.isFinite(raw.lastTranslatedSegmentIndex) ? raw.lastTranslatedSegmentIndex : -1,
            stats: normalizeTranslationStats(raw.stats || {}),
            lastError: String(raw.lastError || '').trim()
        };
    }

    function persistTranslationSettings() {
        localStorage.setItem('vt_translation_enabled', state.translation.enabled ? '1' : '0');
        localStorage.setItem('vt_translation_target', state.translation.targetLanguage || 'en');
    }

    function translationCacheKey(sourceText, targetLanguage, provider, model) {
        return `vt_tr::${provider || 'provider'}::${model || 'model'}::${targetLanguage || 'en'}::${hashPlainText(sourceText || '')}`;
    }

    function hashPlainText(text = '') {
        let hash = 2166136261;
        const value = String(text || '');
        for (let i = 0; i < value.length; i++) {
            hash ^= value.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(16);
    }

    function readTranslationCache(sourceText, targetLanguage, provider, model) {
        const raw = safeJsonParse(localStorage.getItem(translationCacheKey(sourceText, targetLanguage, provider, model)) || '', null);
        if (!raw || raw.sourceText !== String(sourceText || '').trim()) return null;
        return raw;
    }

    function saveTranslationCache(sourceText, targetLanguage, provider, model, payload) {
        const normalizedSource = String(sourceText || '').trim();
        if (!normalizedSource) return;
        localStorage.setItem(
            translationCacheKey(normalizedSource, targetLanguage, provider, model),
            JSON.stringify({
                sourceText: normalizedSource,
                targetLanguage,
                provider,
                model,
                translatedText: String(payload?.translatedText || '').trim(),
                sentiment: String(payload?.sentiment || 'neutral').toLowerCase(),
                tone: String(payload?.tone || '').trim(),
                updatedAt: new Date().toISOString()
            })
        );
    }

    function getTranslationResultForSegment(segmentOrId) {
        const segmentId = typeof segmentOrId === 'string' ? segmentOrId : segmentOrId?.id;
        if (!segmentId) return null;
        return state.translation?.segmentResults?.[segmentId] || null;
    }

    function clearTranslationQueue() {
        clearTimeout(translationFlushTimer);
        translationFlushTimer = null;
        state.translation.pendingQueue = [];
    }

    function resetTranslationSession({ keepSettings = true } = {}) {
        clearTranslationQueue();
        state.translation.segmentResults = {};
        state.translation.stats = createEmptyTranslationStats();
        state.translation.lastTranslatedSegmentIndex = -1;
        state.translation.lastError = '';
        state.translation.isProcessing = false;
        if (!keepSettings) {
            state.translation.enabled = false;
            state.translation.targetLanguage = 'en';
            persistTranslationSettings();
        }
        renderTranslationUi();
    }

    function syncTranslationResultsWithSegments() {
        const results = state.translation.segmentResults || {};
        const activeIds = new Set((state.segments || []).map(seg => seg.id));
        Object.keys(results).forEach(segmentId => {
            if (!activeIds.has(segmentId)) delete results[segmentId];
        });
        (state.segments || []).forEach(seg => {
            const existing = results[seg.id];
            if (existing && existing.sourceText !== seg.text) {
                delete results[seg.id];
            }
        });
    }

    function recomputeTranslationStats() {
        const stats = createEmptyTranslationStats();
        const readyEntries = (state.segments || [])
            .map(seg => state.translation.segmentResults?.[seg.id] || null)
            .filter(entry => entry && entry.status === 'ready' && entry.targetLanguage === state.translation.targetLanguage);
        readyEntries.forEach(entry => {
            if (entry.sentiment === 'positive') stats.positive += 1;
            else if (entry.sentiment === 'negative') stats.negative += 1;
            else stats.neutral += 1;
        });
        const dominantScore = [
            ['Positive', stats.positive],
            ['Neutral', stats.neutral],
            ['Negative', stats.negative]
        ].sort((a, b) => b[1] - a[1])[0];
        if ((dominantScore?.[1] || 0) > 0) stats.dominant = `${dominantScore[0]} leaning`;
        const recent = readyEntries.slice(-5).map(entry => entry.sentiment);
        if (!recent.length) stats.trend = state.translation.enabled ? 'Waiting for translated segments' : 'Enable translation to start tracking';
        else {
            const score = recent.reduce((sum, sentiment) => {
                if (sentiment === 'positive') return sum + 1;
                if (sentiment === 'negative') return sum - 1;
                return sum;
            }, 0);
            if (score >= 2) stats.trend = 'Recent tone is warming';
            else if (score <= -2) stats.trend = 'Recent tone is cooling';
            else stats.trend = 'Recent tone is mixed';
        }
        state.translation.stats = stats;
    }

    function translatedTextForSegment(seg) {
        const result = getTranslationResultForSegment(seg);
        if (!result) return '';
        if (result.status === 'pending') return '[Translating...]';
        if (result.status === 'error') return result.translatedText || '[Translation unavailable]';
        return result.translatedText || '';
    }

    function renderTranslatedSegments() {
        if (!translatedSegmentsView) return;
        syncTranslationResultsWithSegments();
        if (!state.translation.enabled) {
            translatedSegmentsView.innerHTML = '<div class="empty-state">Enable Live Translate to build translated segments and sentiment in this pane.</div>';
            return;
        }
        if (!state.segments.length) {
            translatedSegmentsView.innerHTML = '<div class="empty-state">No source segments yet. Start recording or transcribe a file first.</div>';
            return;
        }
        translatedSegmentsView.innerHTML = state.segments.map(seg => {
            const result = getTranslationResultForSegment(seg);
            const translated = translatedTextForSegment(seg);
            const sentiment = result?.sentiment || 'neutral';
            const tone = result?.tone ? escapeHtml(result.tone) : '';
            const status = result?.status || 'pending';
            const sentimentLabel = status === 'ready'
                ? sentiment
                : (status === 'error' ? 'retry needed' : 'pending');
            const body = translated || '[Waiting for translation]';
            return `
      <div class="segment translation-segment ${status}">
        <div class="translation-segment-body">
          <div class="segment-top">
            <span class="seg-time">${escapeHtml(seg.time)}</span>
            <span class="seg-badge">${escapeHtml(translationTargetLabelFor(state.translation.targetLanguage))}</span>
                            <span class="translation-sentiment-badge ${escapeHtml(sentiment)} ${escapeHtml(status)}">${escapeHtml(sentimentLabel)}</span>
            ${tone ? `<span class="translation-tone-chip">${tone}</span>` : ''}
          </div>
          <div class="translation-segment-text">${escapeHtml(body)}</div>
        </div>
      </div>
    `;
        }).join('');
    }

    function renderTranslationUi() {
        syncTranslationResultsWithSegments();
        recomputeTranslationStats();
        const targetLabel = translationTargetLabelFor(state.translation.targetLanguage);
        if (translationTargetLabel) translationTargetLabel.textContent = targetLabel;
        if (translationTargetSelect && translationTargetSelect.value !== state.translation.targetLanguage) {
            translationTargetSelect.value = state.translation.targetLanguage;
        }
        liveTranslateToggle?.classList.toggle('on', !!state.translation.enabled);
        if (translationPanel) translationPanel.classList.toggle('translation-disabled', !state.translation.enabled);
        let statusText = 'Disabled';
        let statusClass = 'disabled';
        if (state.translation.enabled && state.translation.isProcessing) {
            statusText = `Translating to ${targetLabel}`;
            statusClass = 'busy';
        } else if (state.translation.enabled && state.translation.lastError) {
            statusText = state.translation.lastError;
            statusClass = 'error';
        } else if (state.translation.enabled && state.segments.length) {
            statusText = `Ready in ${targetLabel}`;
            statusClass = 'ready';
        } else if (state.translation.enabled) {
            statusText = `Waiting for source speech`;
            statusClass = 'idle';
        }
        if (translationStatusText) translationStatusText.textContent = statusText;
        if (translationStatusDot) {
            translationStatusDot.className = `translation-status-dot ${statusClass}`;
        }
        if (translationDominantSentiment) translationDominantSentiment.textContent = state.translation.stats.dominant;
        if (translationTrendText) translationTrendText.textContent = state.translation.stats.trend;
        if (translationPositiveCount) translationPositiveCount.textContent = `${state.translation.stats.positive} positive`;
        if (translationNeutralCount) translationNeutralCount.textContent = `${state.translation.stats.neutral} neutral`;
        if (translationNegativeCount) translationNegativeCount.textContent = `${state.translation.stats.negative} negative`;
        if (translatedTranscript) {
            const text = !state.translation.enabled
                ? ''
                : cleanTranscriptLocal((state.segments || []).map(seg => {
                    const speaker = state.speakerMode && seg.speaker ? `${seg.speaker}: ` : '';
                    const body = translatedTextForSegment(seg);
                    return body ? `${speaker}${body}`.trim() : '';
                }).filter(Boolean).join('\n\n'));
            translatedTranscript.value = text;
        }
        renderTranslatedSegments();
        switchView(state.currentView || 'raw');
        syncRecordTranslationSplit();
    }

    function buildTranslationSystemPrompt() {
        return [
            'You translate spoken transcript segments faithfully and classify sentiment.',
            'Preserve names, numbers, product names, acronyms, and domain terms exactly when they should stay unchanged.',
            'Do not summarize, shorten, or embellish.',
            'Return JSON only when possible.',
            'If you cannot produce perfect JSON, still return the same fields in the clearest machine-readable structure you can.',
            'For each item, output: id, translatedText, sentiment, tone.',
            'sentiment must be one of: positive, neutral, negative.',
            'tone must be a very short phrase under 4 words.'
        ].join('\n');
    }

    function extractJsonPayload(text = '') {
        const raw = String(text || '').trim();
        if (!raw) return null;
        const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced?.[1]) {
            const parsed = safeJsonParse(fenced[1].trim(), null);
            if (parsed) return parsed;
        }
        const direct = safeJsonParse(raw, null);
        if (direct) return direct;
        const firstBrace = raw.indexOf('{');
        const lastBrace = raw.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return safeJsonParse(raw.slice(firstBrace, lastBrace + 1), null);
        }
        return null;
    }

    function parseTranslationResponse(text = '') {
        const payload = extractJsonPayload(text);
        if (payload) {
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload.items)) return payload.items;
            if (Array.isArray(payload.translations)) return payload.translations;
            if (Array.isArray(payload.results)) return payload.results;
            if (payload.id || payload.translatedText || payload.translation) return [payload];
        }
        const raw = String(text || '').trim();
        if (!raw) return [];
        return raw.split(/\n+/).map((line, idx) => {
            const cleaned = line.replace(/^[-*\d.\s]+/, '').trim();
            if (!cleaned) return null;
            const match = cleaned.match(/^(?<id>[^:]+):\s*(?<translation>.+?)(?:\s+\|\s*(?<sentiment>positive|neutral|negative))?(?:\s+\|\s*(?<tone>.+))?$/i);
            if (!match?.groups) return null;
            return {
                id: match.groups.id.trim() || `line_${idx}`,
                translatedText: match.groups.translation.trim(),
                sentiment: String(match.groups.sentiment || 'neutral').toLowerCase(),
                tone: String(match.groups.tone || '').trim()
            };
        }).filter(Boolean);
    }

    function setTranslationResultForSegment(segment, payload, meta = {}) {
        if (!segment?.id) return;
        const entry = normalizeTranslationEntry({
            segmentId: segment.id,
            sourceText: segment.text,
            translatedText: payload?.translatedText || payload?.translation || segment.text,
            sentiment: payload?.sentiment || 'neutral',
            tone: payload?.tone || '',
            status: payload?.status || 'ready',
            targetLanguage: state.translation.targetLanguage,
            provider: meta.provider || state.apiProvider,
            model: meta.model || getActiveChatModel(),
            error: payload?.error || '',
            updatedAt: new Date().toISOString()
        }, segment);
        state.translation.segmentResults[segment.id] = entry;
    }

    function applyTranslationBatch(items, requestItems, meta = {}) {
        const byId = new Map();
        items.forEach(item => {
            if (item?.id) byId.set(String(item.id), item);
        });
        requestItems.forEach((requestItem, idx) => {
            const segment = (state.segments || []).find(seg => seg.id === requestItem.segmentId);
            if (!segment) return;
            const responseItem = byId.get(requestItem.segmentId) || items[idx] || null;
            if (!responseItem) {
                setTranslationResultForSegment(segment, {
                    translatedText: segment.text,
                    sentiment: 'neutral',
                    tone: '',
                    status: 'error',
                    error: 'Translator returned an incomplete batch.'
                }, meta);
                return;
            }
            setTranslationResultForSegment(segment, responseItem, meta);
            saveTranslationCache(segment.text, state.translation.targetLanguage, meta.provider, meta.model, responseItem);
        });
        const lastId = requestItems[requestItems.length - 1]?.segmentId || '';
        const lastIndex = (state.segments || []).findIndex(seg => seg.id === lastId);
        if (lastIndex >= 0) state.translation.lastTranslatedSegmentIndex = lastIndex;
        state.translation.lastError = '';
        renderTranslationUi();
        scheduleWorkspaceSave();
    }

    function markSegmentsPending(segmentIds = []) {
        segmentIds.forEach(segmentId => {
            const segment = (state.segments || []).find(seg => seg.id === segmentId);
            if (!segment) return;
            state.translation.segmentResults[segment.id] = normalizeTranslationEntry({
                segmentId: segment.id,
                sourceText: segment.text,
                translatedText: getTranslationResultForSegment(segment)?.translatedText || '',
                sentiment: getTranslationResultForSegment(segment)?.sentiment || 'neutral',
                tone: getTranslationResultForSegment(segment)?.tone || '',
                status: 'pending',
                targetLanguage: state.translation.targetLanguage,
                provider: state.apiProvider,
                model: getActiveChatModel(),
                updatedAt: new Date().toISOString()
            }, segment);
        });
    }

    function queueTranslationForSegmentIds(segmentIds = [], options = {}) {
        const ids = [...new Set(segmentIds.map(String).filter(Boolean))].filter(segmentId => {
            const seg = (state.segments || []).find(item => item.id === segmentId);
            return !!(seg && String(seg.text || '').trim());
        });
        if (!ids.length) {
            renderTranslationUi();
            return;
        }
        if (!state.translation.enabled) {
            renderTranslationUi();
            return;
        }
        state.translation.provider = state.apiProvider;
        state.translation.model = getActiveChatModel();
        markSegmentsPending(ids);
        ids.forEach(id => {
            if (!state.translation.pendingQueue.includes(id)) state.translation.pendingQueue.push(id);
        });
        renderTranslationUi();
        if (options.immediate) {
            flushTranslationQueue();
            return;
        }
        clearTimeout(translationFlushTimer);
        translationFlushTimer = setTimeout(() => flushTranslationQueue(), TRANSLATION_DEBOUNCE_MS);
    }

    function queueTranslationBackfill(options = {}) {
        if (!state.translation.enabled) {
            renderTranslationUi();
            return;
        }
        const staleIds = (state.segments || []).filter(seg => {
            const result = getTranslationResultForSegment(seg);
            if (!result) return true;
            if (result.sourceText !== seg.text) return true;
            if (result.targetLanguage !== state.translation.targetLanguage) return true;
            return result.status === 'error';
        }).map(seg => seg.id);
        queueTranslationForSegmentIds(staleIds, options);
    }

    async function flushTranslationQueue() {
        clearTimeout(translationFlushTimer);
        translationFlushTimer = null;
        if (!state.translation.enabled || state.translation.isProcessing) {
            renderTranslationUi();
            return;
        }
        const pendingIds = [...new Set((state.translation.pendingQueue || []).map(String).filter(Boolean))];
        if (!pendingIds.length) {
            renderTranslationUi();
            return;
        }
        const keys = getProviderKeys();
        if (!keys.length) {
            state.translation.lastError = 'Translation needs an API key';
            state.translation.pendingQueue = [];
            renderTranslationUi();
            return;
        }
        const provider = state.apiProvider;
        const model = getActiveChatModel();
        const requestItems = pendingIds.map(segmentId => {
            const segment = (state.segments || []).find(seg => seg.id === segmentId);
            return segment ? { segmentId, text: segment.text, lang: segment.lang || state.detectedLanguage || 'auto' } : null;
        }).filter(Boolean);
        state.translation.pendingQueue = [];
        const uncachedItems = [];
        requestItems.forEach(item => {
            const cached = readTranslationCache(item.text, state.translation.targetLanguage, provider, model);
            const segment = (state.segments || []).find(seg => seg.id === item.segmentId);
            if (cached && segment) {
                setTranslationResultForSegment(segment, { ...cached, status: 'ready' }, { provider, model });
            } else {
                uncachedItems.push(item);
            }
        });
        if (!uncachedItems.length) {
            state.translation.lastError = '';
            renderTranslationUi();
            scheduleWorkspaceSave();
            return;
        }
        state.translation.isProcessing = true;
        state.translation.provider = provider;
        state.translation.model = model;
        renderTranslationUi();
        updateDiagnostics({
            provider,
            chatModel: model,
            translationEnabled: true,
            translationTarget: state.translation.targetLanguage
        }, `Translation batch started for ${uncachedItems.length} segment(s)`);
        try {
            const response = await providerRequest({
                url: getChatEndpoint(),
                responseType: 'json',
                purpose: 'translate-live-segments',
                buildBody: () => JSON.stringify({
                    model,
                    temperature: 0.1,
                    messages: [
                        { role: 'system', content: buildTranslationSystemPrompt() },
                        {
                            role: 'user',
                            content: JSON.stringify({
                                targetLanguage: {
                                    code: state.translation.targetLanguage,
                                    label: translationTargetLabelFor(state.translation.targetLanguage)
                                },
                                items: uncachedItems.map(item => ({
                                    id: item.segmentId,
                                    text: item.text,
                                    language: item.lang
                                }))
                            })
                        }
                    ]
                }),
                maxRetries: 2
            });
            const content = normalizeAssistantText(response?.choices?.[0]?.message?.content || '');
            const items = parseTranslationResponse(content);
            if (!items.length) throw new Error('Translator returned no usable structured items.');
            applyTranslationBatch(items, uncachedItems, { provider, model });
            updateDiagnostics({
                provider,
                chatModel: model,
                translationEnabled: true,
                translationTarget: state.translation.targetLanguage
            }, `Translation batch complete for ${uncachedItems.length} segment(s)`);
        } catch (err) {
            uncachedItems.forEach(item => {
                const segment = (state.segments || []).find(seg => seg.id === item.segmentId);
                if (!segment) return;
                setTranslationResultForSegment(segment, {
                    translatedText: getTranslationResultForSegment(segment)?.translatedText || segment.text,
                    sentiment: getTranslationResultForSegment(segment)?.sentiment || 'neutral',
                    tone: getTranslationResultForSegment(segment)?.tone || 'source text',
                    status: 'degraded',
                    error: err.message || 'Translation degraded to source text'
                }, { provider, model });
            });
            state.translation.lastError = err.message || 'Translation degraded';
            toast(`Translation warning: ${state.translation.lastError}`, 'warning', 3200);
            renderTranslationUi();
            scheduleWorkspaceSave();
        } finally {
            state.translation.isProcessing = false;
            renderTranslationUi();
        }
    }

    function confidenceClass(conf) {
        if (conf >= 0.85) return 'high';
        if (conf >= 0.6) return 'mid';
        return 'low';
    }

    function getCorrectionModel() {
        const active = String(getActiveChatModel() || '').trim();
        if (/gpt-oss-20b|llama-3\.1-8b-instant/i.test(active)) return active;
        return defaultCorrectionModel(state.apiProvider);
    }

    function isLikelyGarbledText(text = '') {
        const value = String(text || '').trim();
        if (!value) return true;
        const words = value.split(/\s+/).filter(Boolean);
        if (words.length <= 1 && value.length < 5) return true;
        if (/(.+)\1{2,}/i.test(value.replace(/\s+/g, ''))) return true;
        if (/([A-Za-z])\1{3,}/.test(value)) return true;
        if (/[?]{2,}|[.]{4,}/.test(value)) return true;
        return false;
    }

    function containsDevanagari(text = '') {
        return /[\u0900-\u097F]/.test(String(text || ''));
    }

    function containsLatin(text = '') {
        return /[A-Za-z]/.test(String(text || ''));
    }

    function isPunctuationOnlySegment(text = '') {
        const value = String(text || '').trim();
        if (!value) return true;
        return !/[\p{L}\p{N}]/u.test(value);
    }

    function countMeaningfulWords(text = '') {
        return String(text || '').trim().split(/\s+/).filter(Boolean).length;
    }

    function looksLikeIndicLanguage(code = '') {
        return ['hi', 'mr', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'pa', 'ur'].includes(normalizeLanguageCode(code));
    }

    function looksLikeScriptMismatch(text = '', language = '') {
        const lang = normalizeLanguageCode(language);
        const value = String(text || '').trim();
        if (!value) return false;
        if (!looksLikeIndicLanguage(lang)) return false;
        if (containsDevanagari(value)) return false;
        return containsLatin(value);
    }

    function countRepeatedTokens(text = '') {
        const words = String(text || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (!words.length) return 0;
        let repeated = 0;
        for (let i = 1; i < words.length; i++) {
            if (words[i] === words[i - 1]) repeated += 1;
        }
        return repeated;
    }

    function assessTranscriptSegmentQuality(segment = {}, context = {}) {
        const text = String(segment.text || '').trim();
        const words = countMeaningfulWords(text);
        const flags = [];
        let score = typeof segment.conf === 'number' ? Math.max(0, Math.min(1, segment.conf)) : 0.85;

        if (isPunctuationOnlySegment(text)) {
            flags.push('punctuation_only');
            score -= 0.8;
        }
        if (isLikelyGarbledText(text)) {
            flags.push('garbled_text');
            score -= 0.34;
        }
        if (looksLikeScriptMismatch(text, segment.lang || context.detectedLanguage || '')) {
            flags.push('script_mismatch');
            score -= 0.26;
        }
        if (words <= 2) {
            flags.push('very_short');
            score -= 0.12;
        }
        if (countRepeatedTokens(text) >= 2) {
            flags.push('repeated_tokens');
            score -= 0.18;
        }
        if (typeof segment.conf === 'number' && segment.conf < 0.72) {
            flags.push('low_confidence');
            score -= 0.16;
        }
        if (context.previousText && text && text.toLowerCase() === String(context.previousText || '').trim().toLowerCase()) {
            flags.push('duplicate_neighbor');
            score -= 0.24;
        }

        return {
            score: Math.max(0, Math.min(1, Number(score.toFixed(3)))),
            flags
        };
    }

    function mergeSegmentTexts(a = '', b = '') {
        const left = String(a || '').trim();
        const right = String(b || '').trim();
        if (!left) return right;
        if (!right) return left;
        if (left.toLowerCase() === right.toLowerCase()) return left;
        return `${left} ${right}`.replace(/\s+/g, ' ').trim();
    }

    function normalizeResultSegmentsForDisplay(result = {}) {
        const sourceSegments = Array.isArray(result.segments) ? result.segments : [];
        if (!sourceSegments.length) return [];
        const normalized = [];
        sourceSegments.forEach((seg, idx) => {
            const rawText = String(seg?.text || '').trim();
            const lang = String(seg?.language || result.language || '').trim();
            const next = normalizeSegment({
                id: seg.id || '',
                text: rawText,
                originalText: rawText,
                rawText,
                rawLanguage: lang,
                conf: seg.avg_logprob ? Math.exp(seg.avg_logprob) : (seg.confidence || 0.9),
                time: formatTimestamp(seg.start || 0),
                lang,
                startSec: seg.start,
                endSec: seg.end,
                source: 'file'
            }, idx);
            const quality = assessTranscriptSegmentQuality(next, {
                detectedLanguage: result.language || '',
                previousText: normalized[normalized.length - 1]?.text || ''
            });
            next.qualityScore = quality.score;
            next.qualityFlags = quality.flags;
            if (quality.flags.includes('punctuation_only')) return;
            if (quality.flags.includes('duplicate_neighbor') && normalized.length) {
                normalized[normalized.length - 1].endSec = next.endSec || normalized[normalized.length - 1].endSec;
                return;
            }
            if (quality.flags.includes('garbled_text') && quality.flags.includes('very_short') && normalized.length) {
                const prev = normalized[normalized.length - 1];
                if ((next.startSec - prev.endSec) <= 1.2 || !Number.isFinite(prev.endSec)) {
                    prev.endSec = next.endSec || prev.endSec;
                    return;
                }
            }
            normalized.push(next);
        });
        return normalized;
    }

    function getLanguageSpreadFromSegments(segments = []) {
        const counts = {};
        (segments || []).forEach(seg => {
            const code = normalizeLanguageCode(seg?.lang || seg?.rawLanguage || '');
            if (!code) return;
            counts[code] = (counts[code] || 0) + 1;
        });
        return counts;
    }

    function buildTranscriptTextFromSegments(segments = []) {
        return cleanTranscriptLocal((segments || []).map(seg => {
            const speaker = state.speakerMode && seg.speaker ? `${seg.speaker}: ` : '';
            return `${speaker}${seg.text || ''}`.trim();
        }).filter(Boolean).join('\n\n'));
    }

    function shouldRunMultilingualRepair(result = {}, segments = [], options = {}) {
        if (options.translate) return false;
        if (!segments.length) return false;
        if (!getProviderKeys().length) return false;
        const spread = getLanguageSpreadFromSegments(segments);
        const suspicious = segments.filter(seg => (seg.qualityFlags || []).some(flag => ['garbled_text', 'script_mismatch', 'duplicate_neighbor', 'low_confidence'].includes(flag)));
        const scriptMismatchCount = segments.filter(seg => (seg.qualityFlags || []).includes('script_mismatch')).length;
        const mixed = Object.keys(spread).length > 1;
        const suspiciousRatio = suspicious.length / Math.max(segments.length, 1);
        return mixed || scriptMismatchCount > 0 || suspicious.length >= 2 || suspiciousRatio >= 0.18;
    }

    function buildMultilingualRepairPrompt(batch = [], allSegments = [], meta = {}) {
        return [
            'You repair multilingual speech-to-text transcript segments for preserve-original mode.',
            'This recording may switch between Marathi, Hindi, and English within the same discussion.',
            'Keep Marathi and Hindi in Devanagari script whenever recoverable.',
            'Keep English technical terms, URLs, domain names, acronyms, and product terms in English.',
            'Do not translate everything into English.',
            'Preserve meaning and timing alignment. Only rewrite the segment text, not the timestamps.',
            'If a segment is only punctuation/noise and should disappear, set "drop": true.',
            'Return JSON only in the form {"items":[{"id":"...", "text":"...", "language":"...", "drop":false}]}',
            meta.exampleHint ? `Regression note: ${meta.exampleHint}` : ''
        ].filter(Boolean).join('\n');
    }

    function parseMultilingualRepairResponse(text = '') {
        const payload = extractJsonPayload(text);
        if (payload) {
            if (Array.isArray(payload.items)) return payload.items;
            if (Array.isArray(payload.results)) return payload.results;
            if (Array.isArray(payload)) return payload;
        }
        return [];
    }

    async function requestMultilingualRepairBatch(batch = [], allSegments = []) {
        const model = getCorrectionModel();
        const response = await providerRequest({
            url: getChatEndpoint(),
            responseType: 'json',
            purpose: 'multilingual-transcript-repair',
            buildBody: () => JSON.stringify({
                model,
                temperature: 0.08,
                messages: [
                    {
                        role: 'system',
                        // Regression target: mixed Marathi/Hindi/English audio must not collapse into English-only drift,
                        // repeated filler fragments, or lost Devanagari script during preserve-original transcription.
                        content: buildMultilingualRepairPrompt(batch, allSegments, {
                            exampleHint: 'Previous failures included English-only drift, loss of Marathi/Hindi script, gibberish fragments, and repeated lines.'
                        })
                    },
                    {
                        role: 'user',
                        content: JSON.stringify({
                            detectedLanguage: state.detectedLanguage || '',
                            selectedLanguage: getWhisperLang() || 'auto',
                            transcriptContext: buildTranscriptTextFromSegments(allSegments.slice(0, 40)).slice(0, 9000),
                            items: batch.map(item => {
                                const idx = allSegments.findIndex(seg => seg.id === item.id);
                                const prev = idx > 0 ? allSegments[idx - 1] : null;
                                const next = idx >= 0 && idx < allSegments.length - 1 ? allSegments[idx + 1] : null;
                                return {
                                    id: item.id,
                                    languageHint: item.lang || item.rawLanguage || '',
                                    start: item.startSec || 0,
                                    end: item.endSec || 0,
                                    text: item.rawText || item.originalText || item.text,
                                    previous: prev ? (prev.text || prev.rawText || '') : '',
                                    next: next ? (next.text || next.rawText || '') : '',
                                    qualityFlags: item.qualityFlags || []
                                };
                            })
                        })
                    }
                ]
            }),
            maxRetries: 1
        });
        return {
            model,
            items: parseMultilingualRepairResponse(normalizeAssistantText(response?.choices?.[0]?.message?.content || ''))
        };
    }

    async function repairMultilingualResultSegments(result = {}, segments = [], options = {}) {
        if (!shouldRunMultilingualRepair(result, segments, options)) return { segments, applied: false, spread: getLanguageSpreadFromSegments(segments) };
        const candidates = segments.filter(seg => (seg.qualityFlags || []).some(flag => ['garbled_text', 'script_mismatch', 'low_confidence'].includes(flag)));
        if (!candidates.length) return { segments, applied: false, spread: getLanguageSpreadFromSegments(segments) };
        const repaired = segments.map(seg => ({ ...seg }));
        const byId = new Map(repaired.map(seg => [seg.id, seg]));
        const chunks = [];
        for (let i = 0; i < candidates.length; i += 8) chunks.push(candidates.slice(i, i + 8));
        let appliedCount = 0;
        for (const chunk of chunks) {
            try {
                const response = await requestMultilingualRepairBatch(chunk, repaired);
                (response.items || []).forEach(item => {
                    const segment = byId.get(String(item?.id || ''));
                    if (!segment) return;
                    if (item?.drop) {
                        segment._drop = true;
                        appliedCount += 1;
                        return;
                    }
                    const nextText = cleanTranscriptLocal(String(item?.text || '').trim());
                    if (!nextText) return;
                    if (nextText !== segment.text) {
                        segment.originalText = segment.originalText || segment.text;
                        segment.text = nextText;
                        segment.source = 'corrected';
                        segment.correctionStatus = 'done';
                        segment.correctedAt = new Date().toISOString();
                        segment.lang = String(item?.language || segment.lang || '').trim() || segment.lang;
                        segment.qualityFlags = (segment.qualityFlags || []).filter(flag => !['garbled_text', 'script_mismatch', 'low_confidence'].includes(flag));
                        appliedCount += 1;
                    }
                });
            } catch (err) {
                updateDiagnostics({ multilingualRepairError: err.message || 'unknown' }, 'Multilingual repair batch failed');
            }
        }
        const cleaned = repaired.filter(seg => !seg._drop);
        cleaned.forEach((seg, idx) => {
            const quality = assessTranscriptSegmentQuality(seg, {
                detectedLanguage: result.language || '',
                previousText: cleaned[idx - 1]?.text || ''
            });
            seg.qualityScore = quality.score;
            seg.qualityFlags = quality.flags;
        });
        return {
            segments: cleaned,
            applied: appliedCount > 0,
            repairedCount: appliedCount,
            spread: getLanguageSpreadFromSegments(cleaned)
        };
    }

    function getCorrectionCacheKey(segment) {
        return [
            state.apiProvider,
            getCorrectionModel(),
            segment.lang || state.detectedLanguage || 'auto',
            String(segment.text || '').trim()
        ].join('::');
    }

    function shouldRouteSegmentToCorrection(segment) {
        if (!segment?.id || !getProviderKeys().length) return false;
        if (segment.locked || segment.source === 'corrected') return false;
        if (segment.correctionStatus === 'done' || segment.correctionStatus === 'running') return false;
        const text = String(segment.text || '').trim();
        if (!text) return false;
        const words = text.split(/\s+/).filter(Boolean);
        const lowConfidence = Number(segment.conf || 0) < 0.74;
        const unstableLive = Number(segment.reliability || 1) < 0.72 || state.liveHealth.consecutiveErrors > 1 || state.liveHealth.consecutiveRestarts > 1;
        const lowContent = words.length <= 2 && Number(segment.conf || 0) < 0.82;
        const alternativesDisagree = Array.isArray(segment.alternatives) && segment.alternatives.length > 1
            && new Set(segment.alternatives.map(item => String(item || '').trim().toLowerCase()).filter(Boolean)).size > 1;
        return lowConfidence || unstableLive || lowContent || alternativesDisagree || isLikelyGarbledText(text);
    }

    async function requestTranscriptCorrection(segment, tier = 'fast') {
        const model = tier === 'heavy' && state.apiProvider === 'groq'
            ? 'llama-3.3-70b-versatile'
            : getCorrectionModel();
        const history = state.correctionHistory.slice(-3).join('\n');
        const response = await providerRequest({
            url: getChatEndpoint(),
            responseType: 'json',
            purpose: tier === 'heavy' ? 'reconstruct-transcript-segment' : 'correct-transcript-segment',
            buildBody: () => JSON.stringify({
                model,
                temperature: tier === 'heavy' ? 0.2 : 0.05,
                messages: [
                    {
                        role: 'system',
                        content: [
                            'You repair speech-to-text transcript segments.',
                            'Return only the corrected transcript text.',
                            'Preserve meaning, names, and numbers.',
                            'Do not explain your answer.',
                            'If the text already looks correct, return it unchanged.'
                        ].join('\n')
                    },
                    {
                        role: 'user',
                        content: [
                            `Language hint: ${segment.lang || state.detectedLanguage || 'auto'}`,
                            history ? `Recent transcript context:\n${history}` : '',
                            `Transcript segment:\n${segment.text}`
                        ].filter(Boolean).join('\n\n')
                    }
                ]
            }),
            maxRetries: 1
        });
        return normalizeAssistantText(response?.choices?.[0]?.message?.content || '').trim();
    }

    async function runSelectiveCorrectionForSegment(segmentId) {
        const segment = (state.segments || []).find(seg => seg.id === segmentId);
        if (!segment || !shouldRouteSegmentToCorrection(segment)) return;
        const cacheKey = getCorrectionCacheKey(segment);
        if (state.correctionCache?.[cacheKey]) {
            const cached = String(state.correctionCache[cacheKey] || '').trim();
            if (cached && cached !== segment.text) {
                segment.originalText = segment.originalText || segment.text;
                segment.text = cached;
                segment.source = 'corrected';
                segment.provisional = false;
                segment.correctionStatus = 'done';
                segment.correctedAt = new Date().toISOString();
                renderSegments();
                rebuildTranscriptFromSegments();
                queueTranslationForSegmentIds([segment.id], { immediate: true });
            }
            return;
        }
        segment.correctionStatus = 'running';
        renderSegments();
        try {
            const fastCandidate = await requestTranscriptCorrection(segment, 'fast');
            let finalCandidate = fastCandidate;
            if (fastCandidate && isLikelyGarbledText(fastCandidate) && state.apiProvider === 'groq') {
                finalCandidate = await requestTranscriptCorrection({ ...segment, text: fastCandidate }, 'heavy');
            }
            finalCandidate = cleanTranscriptLocal(finalCandidate || segment.text);
            if (!finalCandidate) {
                segment.correctionStatus = 'skipped';
                return;
            }
            state.correctionCache[cacheKey] = finalCandidate;
            persistCorrectionCache();
            state.correctionHistory.push(finalCandidate);
            if (state.correctionHistory.length > 5) state.correctionHistory = state.correctionHistory.slice(-5);
            if (finalCandidate !== segment.text) {
                segment.originalText = segment.originalText || segment.text;
                segment.text = finalCandidate;
                segment.source = 'corrected';
                segment.provisional = false;
                segment.correctedAt = new Date().toISOString();
                markLiveHealth(0.05, 'Selective correction applied', 'corrected');
                queueTranslationForSegmentIds([segment.id], { immediate: true });
            }
            segment.correctionStatus = 'done';
            renderSegments();
            rebuildTranscriptFromSegments();
            scheduleWorkspaceSave();
        } catch (err) {
            segment.correctionStatus = 'error';
            updateDiagnostics({ correctionError: err.message || 'unknown' }, 'Selective correction failed');
        } finally {
            renderSegments();
        }
    }

    function queueSelectiveCorrectionForSegment(segmentId) {
        if (!segmentId || !getProviderKeys().length) return;
        if (!state.correctionQueue.includes(segmentId)) state.correctionQueue.push(segmentId);
        if (state.correctionBusy) return;
        state.correctionBusy = true;
        queueMicrotask(async () => {
            try {
                while (state.correctionQueue.length) {
                    const nextId = state.correctionQueue.shift();
                    await runSelectiveCorrectionForSegment(nextId);
                }
            } finally {
                state.correctionBusy = false;
            }
        });
    }

    function syncSegmentTimes() {
        state.segments.forEach((seg, idx) => {
            seg.time = formatTimestamp(seg.startSec || 0);
            if (idx < state.segments.length - 1 && !Number.isFinite(seg.endSec)) {
                seg.endSec = state.segments[idx + 1].startSec || null;
            }
        });
        if (state.segments.length) {
            const last = state.segments[state.segments.length - 1];
            if (!Number.isFinite(last.endSec)) last.endSec = state.audioDurationSec || ((last.startSec || 0) + 3);
        }
    }

    function renderSegments() {
        syncSegmentTimes();
        if (!state.segments.length) {
            segView.innerHTML = '<div class="empty-state">No segments yet. Use live dictation or file transcription first.</div>';
            updateStats();
            return;
        }
        segView.innerHTML = '';
        state.segments.forEach((seg, idx) => {
            const wrap = document.createElement('div');
            wrap.className = 'segment editable';
            wrap.dataset.index = idx;
            wrap.innerHTML = `
                        <div class="segment-top">
                            <button class="seg-time-btn" data-act="seek">${escapeHtml(seg.time)}</button>
                            <span class="seg-badge">${escapeHtml(seg.lang || 'UNSET')}</span>
                            <span class="seg-badge">${escapeHtml(seg.source || 'live').toUpperCase()}</span>
                            ${seg.provisional ? '<span class="seg-badge">PROVISIONAL</span>' : ''}
                            ${seg.correctionStatus === 'running' ? '<span class="seg-badge">FIXING</span>' : ''}
                            <span class="seg-conf ${confidenceClass(seg.conf)}">${Math.round((seg.conf || 0) * 100)}%</span>
                            <button class="seg-lock ${seg.locked ? 'locked' : ''}" data-act="lock">${seg.locked ? 'Locked' : 'Lock'}</button>
                        </div>
                        <div class="seg-actions">
                            <select class="seg-speaker" data-act="speaker">
                                <option value="" ${!seg.speaker ? 'selected' : ''}>No speaker</option>
                                <option value="Speaker A" ${seg.speaker === 'Speaker A' ? 'selected' : ''}>Speaker A</option>
                                <option value="Speaker B" ${seg.speaker === 'Speaker B' ? 'selected' : ''}>Speaker B</option>
                                <option value="Speaker C" ${seg.speaker === 'Speaker C' ? 'selected' : ''}>Speaker C</option>
                                <option value="Narrator" ${seg.speaker === 'Narrator' ? 'selected' : ''}>Narrator</option>
                            </select>
                            <button class="seg-action" data-act="split">Split</button>
                            <button class="seg-action" data-act="merge-up" ${idx === 0 ? 'disabled' : ''}>Merge Up</button>
                            <button class="seg-action warn" data-act="delete">Delete</button>
                        </div>
                        <textarea class="seg-editor" ${seg.locked ? 'readonly' : ''}>${escapeHtml(seg.text)}</textarea>
                    `;
            const editor = wrap.querySelector('.seg-editor');
            editor.addEventListener('input', () => {
                if (state.segments[idx].locked) return;
                state.segments[idx].text = editor.value;
                delete state.translation.segmentResults[state.segments[idx].id];
                rebuildTranscriptFromSegments();
                queueTranslationForSegmentIds([state.segments[idx].id]);
            });
            wrap.querySelector('[data-act="speaker"]').addEventListener('change', (e) => {
                state.segments[idx].speaker = e.target.value;
                rebuildTranscriptFromSegments();
            });
            wrap.querySelector('[data-act="seek"]').addEventListener('click', () => {
                if (fileAudioPlayer && fileAudioPlayer.src) {
                    fileAudioPlayer.currentTime = state.segments[idx].startSec || 0;
                    fileAudioPlayer.play().catch(() => { });
                } else {
                    toast(`Segment starts at ${state.segments[idx].time}`, 'info');
                }
            });
            wrap.querySelector('[data-act="lock"]').addEventListener('click', () => {
                state.segments[idx].locked = !state.segments[idx].locked;
                renderSegments();
                rebuildTranscriptFromSegments();
            });
            wrap.querySelector('[data-act="split"]').addEventListener('click', () => {
                if (state.segments[idx].locked) return;
                const txt = state.segments[idx].text || '';
                const parts = txt.split(/(?<=[.!?])\s+/);
                if (parts.length < 2) { toast('Nothing obvious to split here', 'info'); return; }
                const first = parts.shift();
                const second = parts.join(' ');
                const base = state.segments[idx];
                const mid = (Number(base.startSec || 0) + Number(base.endSec || (base.startSec || 0) + 2)) / 2;
                state.segments.splice(idx, 1,
                    normalizeSegment({ ...base, text: first, endSec: mid }, idx),
                    normalizeSegment({ ...base, text: second, startSec: mid, time: formatTimestamp(mid), id: '' }, idx + 1)
                );
                renderSegments();
                rebuildTranscriptFromSegments();
                queueTranslationBackfill({ immediate: true });
            });
            wrap.querySelector('[data-act="merge-up"]').addEventListener('click', () => {
                if (idx === 0) return;
                const prev = state.segments[idx - 1];
                prev.text = `${prev.text} ${state.segments[idx].text}`.trim();
                prev.endSec = state.segments[idx].endSec;
                state.segments.splice(idx, 1);
                renderSegments();
                rebuildTranscriptFromSegments();
                queueTranslationBackfill({ immediate: true });
            });
            wrap.querySelector('[data-act="delete"]').addEventListener('click', () => {
                state.segments.splice(idx, 1);
                renderSegments();
                rebuildTranscriptFromSegments();
                queueTranslationBackfill({ immediate: true });
            });
            segView.appendChild(wrap);
        });
        updateStats();
        renderTranslationUi();
        scheduleWorkspaceSave();
    }

    function rebuildTranscriptFromSegments(keepCursor = false) {
        syncSegmentTimes();
        const text = state.segments.map(seg => {
            const speaker = state.speakerMode && seg.speaker ? `${seg.speaker}: ` : '';
            return `${speaker}${seg.text}`.trim();
        }).filter(Boolean).join('\n\n');
        transcript.value = cleanTranscriptLocal(text);
        state.confirmedText = transcript.value;
        updateStats();
        if (!keepCursor) transcript.scrollTop = 0;
        renderTranslationUi();
        scheduleWorkspaceSave();
    }

    function writeWorkspaceToStorage() {
        const payload = getWorkspacePayload();
        const serialized = JSON.stringify(payload);
        safeLocalStorageSet(WORKSPACE_STORAGE_KEY, serialized);
        workspaceStatus.textContent = `Saved ${new Date().toLocaleTimeString()}`;
    }

    function scheduleWorkspaceSave() {
        if (!state.autosaveEnabled) return;
        clearTimeout(state.workspaceSaveTimer);
        state.workspaceSaveTimer = setTimeout(writeWorkspaceToStorage, 350);
    }

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

    function transcriptCacheKey(key) { return `vt_tc::${key}`; }
    function partialKey(key) { return `${transcriptCacheKey(key)}::partial`; }
    function readTranscriptCache(key) { return safeJsonParse(localStorage.getItem(transcriptCacheKey(key)) || '', null); }
    function saveTranscriptCache(key, payload) { localStorage.setItem(transcriptCacheKey(key), JSON.stringify(payload)); }
    function readPartialProgress(key) { return safeJsonParse(localStorage.getItem(partialKey(key)) || '', null); }
    function savePartialProgress(key, payload) { localStorage.setItem(partialKey(key), JSON.stringify(payload)); }
    function clearPartialProgress(key) { localStorage.removeItem(partialKey(key)); }

    async function hashArrayBuffer(arrayBuf) {
        const hash = await crypto.subtle.digest('SHA-256', arrayBuf);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function requestWithProvider({
        provider = state.apiProvider,
        url,
        buildBody,
        responseType = 'json',
        signal,
        purpose = 'request',
        maxRetries = 2,
        extraHeaders = null,
        syncPrimaryKey = provider === state.apiProvider
    }) {
        const keys = getProviderKeys(provider);
        if (!keys.length) throw new Error(provider === 'gemini' ? 'No Gemini API key configured' : 'No API key configured');
        let lastErr = null;
        const timeoutMs = getProviderTimeoutMs();
        for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
            const apiKey = keys[keyIndex];
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                let body = buildBody();
                const headers = provider === 'gemini'
                    ? { 'x-goog-api-key': apiKey }
                    : { 'Authorization': 'Bearer ' + apiKey };
                if (extraHeaders) Object.assign(headers, extraHeaders);
                if (typeof body === 'string') headers['Content-Type'] = 'application/json';
                try {
                    const resp = await fetchWithTimeout(
                        fetch,
                        url,
                        { method: 'POST', headers, body, signal },
                        { timeoutMs, timeoutMessage: `${purpose} timed out after ${timeoutMs}ms` }
                    );
                    if (resp.ok) {
                        const diagPatch = { provider, retries: attempt, cacheKey: state.cacheKey || '' };
                        if (purpose === 'transcribe-audio') {
                            diagPatch.audioModel = provider === 'gemini' ? 'gemini-2.0-flash-lite' : getEffectiveAudioModel({ translate: false });
                            diagPatch.audioTask = 'transcribe';
                        } else if (purpose === 'translate-audio') {
                            diagPatch.audioModel = getEffectiveAudioModel({ translate: true });
                            diagPatch.audioTask = 'translate-en';
                        } else if (purpose === 'api-test') {
                            diagPatch.audioModel = getEffectiveAudioModel();
                            diagPatch.audioTask = 'api-test';
                        }
                        updateDiagnostics(diagPatch, `${purpose} success via key ${keyIndex + 1}`);
                        if (responseType === 'response') return resp;
                        return responseType === 'json' ? await resp.json() : await resp.text();
                    }
                    const rawError = await resp.text().catch(() => '');
                    const err = safeJsonParse(rawError, null);
                    const message = err?.error?.message || err?.message || rawError || `API error ${resp.status}`;
                    const retryable = resp.status === 429 || resp.status >= 500;
                    lastErr = new Error(message);
                    if (!retryable || attempt >= maxRetries) break;
                    const wait = Math.min(4000, 500 * Math.pow(2, attempt)) + Math.floor(Math.random() * 200);
                    updateDiagnostics({ provider, retries: attempt + 1 }, `${purpose} retry ${attempt + 1} after ${resp.status}`);
                    await new Promise(r => setTimeout(r, wait));
                } catch (err) {
                    lastErr = err;
                    if (isRequestTimeoutError(err)) {
                        updateDiagnostics({ provider, errorType: 'timeout', timeoutMs }, `${purpose} timed out after ${timeoutMs}ms`);
                        throw err;
                    }
                    if (signal?.aborted || isAbortError(err)) throw err;
                    if (attempt >= maxRetries) break;
                    const wait = Math.min(4000, 500 * Math.pow(2, attempt)) + Math.floor(Math.random() * 200);
                    updateDiagnostics({ provider, retries: attempt + 1, errorType: 'network' }, `${purpose} network retry ${attempt + 1}`);
                    await new Promise(r => setTimeout(r, wait));
                }
            }
        }
        throw lastErr || new Error('Provider request failed');
    }

    async function providerRequest({ url, buildBody, responseType = 'json', signal, purpose = 'request', maxRetries = 2 }) {
        return requestWithProvider({
            provider: state.apiProvider,
            url,
            buildBody,
            responseType,
            signal,
            purpose,
            maxRetries
        });
    }

    async function callChatModel(task, rawText, { button } = {}) {
        const fullText = String(rawText || '').trim();
        if (!fullText) { toast('Transcript is empty', 'warning'); return; }
        const keys = getProviderKeys();
        if (!keys.length) { toast('API key required', 'warning'); return; }
        const model = getActiveChatModel();
        const importedMemory = getImportedMemoryContext({ maxChars: 9000 });
        const styleInstruction = getOutputStyleInstruction();

        // Smart truncation for large transcripts to stay within model context limits
        const MAX_TRANSCRIPT_CHARS = 120000; // ~30K tokens safe limit
        let text = fullText;
        let wasTruncated = false;
        if (fullText.length > MAX_TRANSCRIPT_CHARS) {
            wasTruncated = true;
            const keepStart = Math.floor(MAX_TRANSCRIPT_CHARS * 0.7);
            const keepEnd = Math.floor(MAX_TRANSCRIPT_CHARS * 0.25);
            text = fullText.slice(0, keepStart).trim()
                + '\n\n[... TRANSCRIPT TRUNCATED - ' + ((fullText.length - keepStart - keepEnd) / 1000).toFixed(0) + 'K characters omitted for model context limits ...]\n\n'
                + fullText.slice(-keepEnd).trim();
            toast(`Transcript is very long (${(fullText.length / 1000).toFixed(0)}K chars). Auto-truncated to fit model context.`, 'warning', 4000);
        }

        if (button) button.disabled = true;
        state.aiBusy = true;
        try {
            const result = await providerRequest({
                url: getChatEndpoint(),
                responseType: 'json',
                purpose: task?.name || 'chat-task',
                buildBody: () => JSON.stringify({
                    model,
                    temperature: 0.2,
                    messages: [
                        { role: 'system', content: task.system },
                        { role: 'system', content: `Current output style: ${styleInstruction}` },
                        ...(importedMemory ? [{
                            role: 'system',
                            content: `${getTaskMemoryGuidance(task?.name)}\n\n${importedMemory}`
                        }] : []),
                        { role: 'user', content: `${task.user}\n\nTranscript:\n${text}` }
                    ]
                }),
                maxRetries: 2
            });
            const out = extractFinalAiOutputText(result?.choices?.[0]?.message?.content || '');
            aiOutput.value = out.trim();
            state.aiOutput = aiOutput.value;
            sessionStorage.setItem('vt_ai_output', state.aiOutput);
            updateDiagnostics({ chatModel: model }, `${task?.name || 'chat-task'} complete`);
            scheduleWorkspaceSave();
            const suffix = wasTruncated ? ' (transcript was auto-truncated)' : '';
            toast((task?.doneMessage || 'AI output ready') + suffix, 'success');
        } catch (err) {
            const msg = String(err.message || '');
            // Detect context-length errors from various providers
            if (/context.*(length|limit|too (long|large)|exceed|overflow|maximum)/i.test(msg)
                || /token.*(limit|exceed|too many)/i.test(msg)
                || /413|request.*too.*large/i.test(msg)) {
                toast(`Transcript is too long for ${model}. Try a model with a larger context window, or transcribe shorter audio.`, 'error', 6000);
                aiOutput.value = `⚠ Context limit exceeded\n\nThe transcript (${(fullText.length / 1000).toFixed(0)}K characters) is too large for the selected model (${model}).\n\nSuggestions:\n• Use a model with a larger context window\n• Record shorter sessions\n• Split long audio files before transcribing`;
            } else {
                toast(msg || 'AI request failed', 'error');
            }
        } finally {
            state.aiBusy = false;
            if (button) button.disabled = false;
        }
    }

    async function askTranscriptQuestion(question, { button } = {}) {
        const fullTranscript = String(transcript?.value || '').trim();
        const prompt = String(question || '').trim();
        if (!fullTranscript) { toast('Transcript is empty', 'warning'); return; }
        if (!prompt) { toast('Ask a transcript question first', 'warning'); return; }
        if (!getProviderKeys().length) { toast('API key required', 'warning'); return; }
        const model = getActiveChatModel();
        const importedMemory = getImportedMemoryContext({ maxChars: 9000 });
        const activePack = getActiveMemoryPack();

        // Smart truncation for large transcripts
        const MAX_TRANSCRIPT_CHARS = 120000;
        let transcriptText = fullTranscript;
        if (fullTranscript.length > MAX_TRANSCRIPT_CHARS) {
            const keepStart = Math.floor(MAX_TRANSCRIPT_CHARS * 0.7);
            const keepEnd = Math.floor(MAX_TRANSCRIPT_CHARS * 0.25);
            transcriptText = fullTranscript.slice(0, keepStart).trim()
                + '\n\n[... TRANSCRIPT TRUNCATED ...]\n\n'
                + fullTranscript.slice(-keepEnd).trim();
            toast(`Transcript auto-truncated for model context limits`, 'warning', 3000);
        }

        if (button) button.disabled = true;
        state.aiBusy = true;
        try {
            const result = await providerRequest({
                url: getChatEndpoint(),
                responseType: 'json',
                purpose: 'ask-transcript',
                buildBody: () => JSON.stringify({
                    model,
                    temperature: 0.2,
                    messages: [
                        {
                            role: 'system',
                            content: [
                                'You answer questions about a transcript.',
                                'Use the transcript as the source of current truth.',
                                'Use imported memory only as background context for user preferences, terminology, and ongoing projects.',
                                `Current output style: ${getOutputStyleInstruction()}`
                            ].join('\n')
                        },
                        ...(importedMemory ? [{
                            role: 'system',
                            content: `Active memory pack: ${activePack?.name || 'Primary'}\n\n${importedMemory}`
                        }] : []),
                        {
                            role: 'user',
                            content: `Question:\n${prompt}\n\nTranscript:\n${transcriptText}`
                        }
                    ]
                }),
                maxRetries: 2
            });
            const out = extractFinalAiOutputText(result?.choices?.[0]?.message?.content || '');
            aiOutput.value = out.trim();
            state.aiOutput = aiOutput.value;
            sessionStorage.setItem('vt_ai_output', state.aiOutput);
            updateDiagnostics({ chatModel: model }, 'ask-transcript complete');
            scheduleWorkspaceSave();
            toast('Transcript answer ready', 'success');
        } catch (err) {
            const msg = String(err.message || '');
            if (/context.*(length|limit|too (long|large)|exceed|overflow|maximum)/i.test(msg)
                || /token.*(limit|exceed|too many)/i.test(msg)
                || /413|request.*too.*large/i.test(msg)) {
                toast(`Transcript too long for ${model}. Try a model with larger context.`, 'error', 5000);
            } else {
                toast(msg || 'Transcript question failed', 'error');
            }
        } finally {
            state.aiBusy = false;
            if (button) button.disabled = false;
        }
    }

    function getImportedMemoryContext({ maxChars = 9000 } = {}) {
        ensureMemoryPackStore();
        const raw = normalizeImportedMemory(state.memoryRaw || '');
        if (!raw) return '';
        const compact = raw.length > maxChars
            ? `${raw.slice(0, maxChars).trim()}\n\n[Imported memory truncated for token control]`
            : raw;
        const activePack = getActiveMemoryPack();
        return [
            `Imported user memory from pack: ${activePack?.name || 'Primary'}`,
            'Use this for preferences, ongoing projects, terminology, and stable background context.',
            'If transcript or runtime state conflicts with memory, trust the transcript/runtime state first.',
            '',
            compact
        ].join('\n');
    }

    function renderMemoryUi() {
        ensureMemoryPackStore();
        if (memoryPromptExport) memoryPromptExport.value = MEMORY_IMPORT_PROMPT;
        if (memoryPackSelect) {
            memoryPackSelect.innerHTML = (state.memoryPacks || []).map(pack => `<option value="${escapeHtml(pack.id)}">${escapeHtml(pack.name)}</option>`).join('');
            memoryPackSelect.value = state.activeMemoryPackId || state.memoryPacks?.[0]?.id || '';
        }
        if (memoryInput && document.activeElement !== memoryInput) memoryInput.value = state.memoryRaw || '';
        if (outputStyleSelect) outputStyleSelect.value = state.outputStyle || 'default';
        const imported = normalizeImportedMemory(state.memoryRaw || '');
        const activePack = getActiveMemoryPack();
        if (memoryStatusChip) {
            memoryStatusChip.textContent = imported
                ? `${activePack?.name || 'Memory'} loaded - ${formatRelativeMemoryTime(state.memoryImportedAt)}`
                : 'No memory loaded';
        }
        if (memoryPackMeta) {
            memoryPackMeta.textContent = `Active pack: ${activePack?.name || 'Primary'}. Use separate packs for Client A, Startup, Personal, Research, or any other workflow.`;
        }
        if (memoryMeta) {
            memoryMeta.textContent = imported
                ? `Imported ${imported.length.toLocaleString()} characters into ${activePack?.name || 'this pack'}. AI Output and Verba Assistant will use it automatically. Last updated ${formatRelativeMemoryTime(state.memoryImportedAt)}.`
                : 'No imported memory yet. Once saved, it will ground summaries, action items, prompt packs, AI clean, and assistant replies.';
        }
        if (aiContextNote) {
            const styleLabel = outputStyleSelect?.selectedOptions?.[0]?.textContent || 'Default';
            aiContextNote.textContent = `AI Output uses the ${activePack?.name || 'Primary'} memory pack and ${styleLabel} style automatically.`;
        }
    }

    function persistMemoryStore() {
        persistMemoryPacksStore();
    }

    function setImportedMemory(rawText, { announce = true } = {}) {
        const normalized = normalizeImportedMemory(rawText);
        ensureMemoryPackStore();
        const active = getActiveMemoryPack();
        if (active) {
            active.raw = normalized;
            active.importedAt = normalized ? new Date().toISOString() : '';
        }
        syncActiveMemoryPackState();
        persistMemoryStore();
        renderMemoryUi();
        renderAssistantMessages();
        scheduleWorkspaceSave();
        if (announce) {
            toast(normalized ? 'Memory imported' : 'Memory cleared', normalized ? 'success' : 'info');
        }
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // EVENT LISTENERS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    const ASSISTANT_KB = `
Verba is a single-file browser transcription workspace with recording, file transcription, cleanup tools, export tools, and AI chat.
You are allowed to answer both Verba-specific questions and normal general questions.
When the user asks about this app, use the runtime state and the details below.
When the user asks a general question, answer directly and clearly instead of refusing.
Do not let general chat override the app's primary functions or controls; stay concise and practical.
Do not use markdown formatting in replies.
Do not use asterisks for emphasis, headings, or bullet points.
Do not output markdown tables.
Write like a practical human assistant using plain sentences, short paragraphs, and numbered steps only when useful.

Modes:
- Live uses browser speech recognition with interim text and final segments.
- Quality records microphone audio, then sends audio to the selected provider for transcription.
- File uploads local audio, supports normalization, transcript cache, and translate-to-English.

Provider defaults:
- Groq-first.
- Groq transcription uses whisper-large-v3-turbo by default.
- Groq translate-to-English forces whisper-large-v3.
- Recommended Groq chat model: openai/gpt-oss-120b.
- Faster fallback: openai/gpt-oss-20b.
- Free-tier planning reference for this app: roughly 30 requests per minute, roughly 6,000 to 14,400 tokens per minute, and roughly 14,400 requests per day.

User profile and operating context:
- The user builds AI automation systems with n8n, APIs, RAG pipelines, and document-processing flows.
- Their stack includes Docker, n8n, local LLMs, Groq/OpenAI-compatible APIs, MinIO, and vector or database systems.
- Their projects include AI chatbots, document analyzers, database chat systems, file-intelligence pipelines, and automation agents.
- They prefer production-ready architecture, deep debugging, cost and token efficiency, and scalable backend workflows.
- They are learning cloud hosting, deployment, DNS, load balancing, and scaling public multi-user apps.
- Their goal is production-grade AI backend systems and automation platforms that can run locally or in the cloud.

When answering architecture or implementation questions for this user:
- optimize for reliability, cost, throughput, and maintainability
- account for Groq free-tier rate limits and avoid burst-heavy designs
- suggest batching, chunking, caching, queues, and concurrency control when relevant
- prefer faster models for high-volume automation steps and stronger models for planning, debugging, and final synthesis

Key controls and tools:
- Language selector affects live recognition and speech-to-text language.
- Punct toggles smart punctuation.
- Auto-Copy triggers after silence when enabled.
- Presets change recommended behavior.
- Speaker labels affect transcript rebuild and subtitle-style exports.
- Imported Memory lets the user paste exported long-term context that AI Output and Verba Assistant can reuse.
- Advanced transcript tools include glossary apply, local cleanup, redaction, workspace save/export/import, and cache clear.
- AI Output includes AI Clean, Summary, Action Items, and Prompt Pack.
- Exports include TXT, SRT, VTT, JSON, Markdown, CSV, and Workspace JSON.
- Keyboard shortcuts include Space, Ctrl+C, Ctrl+D, Ctrl+O, Ctrl+U, Ctrl+Enter, Ctrl+Z, Ctrl+Delete, Ctrl+Shift+Q, and Ctrl+Shift+P.

Preferred answer style:
- concise
- operational
- step-by-step when user asks how to do something
- mention current runtime state when relevant
- answer general questions normally when they are not about the app
- never use markdown stars or bold markers
`.trim();

    function getAssistantRuntimeSummary() {
        return [
            `mode=${state.mode}`,
            `audio_provider=${state.apiProvider}`,
            `assistant_provider=${getActiveAssistantProvider()}`,
            `language=${langSelect.value || 'auto'}`,
            `smart_punctuation=${state.smartPunctEnabled ? 'on' : 'off'}`,
            `auto_copy=${state.autoCopyEnabled ? 'on' : 'off'}`,
            `speaker_labels=${state.speakerMode ? 'on' : 'off'}`,
            `preset=${state.preset}`,
            `autosave=${state.autosaveEnabled ? 'on' : 'off'}`,
            `memory=${state.memoryRaw ? 'loaded' : 'none'}`,
            `memory_pack=${getActiveMemoryPack()?.name || 'Primary'}`,
            `output_style=${state.outputStyle || 'default'}`,
            `recording=${state.isRecording ? 'active' : 'idle'}`,
            `normalize=${$('optNormalize')?.checked ? 'on' : 'off'}`,
            `file_language_mode=${getUploadedFileLanguageMode()}`,
            `transcript_cache=${$('optUseCache')?.checked ? 'on' : 'off'}`,
            `detected_language=${state.detectedLanguage || 'unknown'}`,
            `segments=${String(state.segments?.length || 0)}`,
            `cache=${state.diagnostics?.cacheHit ? 'hit' : (state.cacheKey ? 'ready' : 'idle')}`,
            `audio_model=${getEffectiveAudioModel({ translate: shouldTranslateUploadedFile() })}`,
            `chat_model=${getActiveChatModel()}`,
            `assistant_model=${getActiveAssistantModel()}`
        ].join('\n');
    }

    function normalizeAssistantAttachmentMeta(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const name = String(raw.name || '').trim();
        if (!name) return null;
        const mimeType = inferAttachmentMimeType(raw) || String(raw.mimeType || '').trim() || 'application/octet-stream';
        const kind = raw.kind
            || (mimeType === 'application/pdf' ? 'pdf' : (mimeType.startsWith('image/') ? 'image' : 'text'));
        const meta = {
            id: String(raw.id || ''),
            kind,
            name,
            mimeType,
            size: Math.max(0, Number(raw.size || 0) || 0),
            provider: String(raw.provider || '')
        };
        if (raw.fileUri) meta.fileUri = String(raw.fileUri);
        if (raw.fileName) meta.fileName = String(raw.fileName);
        if (raw.uploadedAt) meta.uploadedAt = Number(raw.uploadedAt || 0) || 0;
        if (raw.textContent) meta.textContent = String(raw.textContent);
        return meta;
    }

    function normalizeAssistantAttachmentList(raw) {
        if (Array.isArray(raw)) {
            return raw
                .map(item => normalizeAssistantAttachmentMeta(item))
                .filter(Boolean);
        }
        const fromSingle = normalizeAssistantAttachmentMeta(raw);
        return fromSingle ? [fromSingle] : [];
    }

    function canReuseGeminiFileReference(attachment) {
        if (!attachment?.fileUri) return false;
        const uploadedAt = Number(attachment?.uploadedAt || 0);
        if (!uploadedAt) return false;
        return Date.now() - uploadedAt < (25 * 60 * 1000);
    }

    function cloneAssistantMessage(msg) {
        const attachments = normalizeAssistantAttachmentList(msg?.attachments || msg?.attachment);
        return {
            role: msg?.role === 'user' ? 'user' : 'assistant',
            content: String(msg?.content || '').trim(),
            ts: Number(msg?.ts || Date.now()),
            ...(attachments.length ? { attachments } : {})
        };
    }

    function createAssistantMessage(role, content, extras = {}) {
        const cleaned = role === 'assistant'
            ? normalizeAssistantText(content)
            : String(content || '').trim();
        const message = {
            role: role === 'user' ? 'user' : 'assistant',
            content: cleaned,
            ts: Number(extras.ts || Date.now())
        };
        const attachments = normalizeAssistantAttachmentList(extras.attachments || extras.attachment);
        if (attachments.length) message.attachments = attachments;
        return message;
    }

    function createAssistantConversation(seedMessages = null, seedTitle = 'New chat') {
        const now = Date.now();
        const messages = Array.isArray(seedMessages) && seedMessages.length
            ? seedMessages.map(msg => cloneAssistantMessage(msg))
            : [getAssistantWelcomeMessage()];
        return {
            id: `chat_${now}_${Math.random().toString(36).slice(2, 8)}`,
            title: seedTitle,
            createdAt: now,
            updatedAt: now,
            messages
        };
    }

    function deriveAssistantConversationTitle(messages = []) {
        const firstUser = (messages || []).find(msg => msg?.role === 'user' && String(msg.content || '').trim());
        const raw = firstUser ? String(firstUser.content || '').replace(/\s+/g, ' ').trim() : '';
        if (!raw) return 'New chat';
        return raw.length > 52 ? `${raw.slice(0, 52).trim()}...` : raw;
    }

    function normalizeAssistantConversation(conv, index = 0) {
        const now = Date.now();
        const messages = Array.isArray(conv?.messages) && conv.messages.length
            ? conv.messages
                .filter(Boolean)
                .map((msg, msgIndex) => cloneAssistantMessage({ ...msg, ts: Number(msg?.ts || (now + msgIndex)) }))
            : [getAssistantWelcomeMessage()];
        return {
            id: String(conv?.id || `chat_${now}_${index}`),
            title: String(conv?.title || deriveAssistantConversationTitle(messages) || 'New chat'),
            createdAt: Number(conv?.createdAt || messages[0]?.ts || now),
            updatedAt: Number(conv?.updatedAt || messages[messages.length - 1]?.ts || now),
            messages
        };
    }

    function getCurrentAssistantConversation() {
        return (state.assistant.conversations || []).find(conv => conv.id === state.assistant.currentConversationId) || null;
    }

    function persistAssistantConversations() {
        const serialized = Array.isArray(state.assistant.conversations)
            ? state.assistant.conversations.map(conv => ({
                ...conv,
                messages: Array.isArray(conv?.messages) ? conv.messages.map(msg => cloneAssistantMessage(msg)) : [getAssistantWelcomeMessage()]
            }))
            : [];
        localStorage.setItem('vt_assistant_conversations', JSON.stringify(serialized));
        localStorage.setItem('vt_assistant_current', state.assistant.currentConversationId || '');
    }

    function syncAssistantMessagesFromCurrentConversation() {
        const current = getCurrentAssistantConversation();
        state.assistant.messages = current?.messages?.map(msg => cloneAssistantMessage(msg)) || [getAssistantWelcomeMessage()];
        localStorage.setItem('vt_assistant_thread', JSON.stringify((state.assistant.messages || []).map(msg => cloneAssistantMessage(msg))));
    }

    function ensureAssistantConversationStore() {
        const normalized = (Array.isArray(state.assistant.conversations) ? state.assistant.conversations : [])
            .map((conv, index) => normalizeAssistantConversation(conv, index))
            .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
        const legacyThread = Array.isArray(state.assistant.messages) ? state.assistant.messages.filter(Boolean) : [];
        if (!normalized.length) {
            normalized.push(normalizeAssistantConversation({
                id: `chat_${Date.now()}_legacy`,
                title: deriveAssistantConversationTitle(legacyThread) || 'New chat',
                messages: legacyThread.length ? legacyThread : [getAssistantWelcomeMessage()]
            }));
        }
        state.assistant.conversations = normalized;
        if (!state.assistant.currentConversationId || !state.assistant.conversations.some(conv => conv.id === state.assistant.currentConversationId)) {
            state.assistant.currentConversationId = state.assistant.conversations[0]?.id || '';
        }
        syncAssistantMessagesFromCurrentConversation();
        persistAssistantConversations();
    }

    function persistAssistantThread() {
        const current = getCurrentAssistantConversation();
        if (current) {
            current.messages = Array.isArray(state.assistant.messages)
                ? state.assistant.messages.map(msg => cloneAssistantMessage(msg))
                : [getAssistantWelcomeMessage()];
            current.title = deriveAssistantConversationTitle(current.messages);
            current.updatedAt = Date.now();
        }
        localStorage.setItem('vt_assistant_thread', JSON.stringify((state.assistant.messages || []).map(msg => cloneAssistantMessage(msg))));
        persistAssistantConversations();
    }

    function persistAssistantUi() {
        localStorage.setItem('vt_assistant_ui', JSON.stringify({
            isOpen: !!state.assistant.isOpen,
            minimized: !!state.assistant.minimized,
            maximized: !!state.assistant.maximized,
            showHistory: !!state.assistant.showHistory,
            unread: Number(state.assistant.unread || 0)
        }));
    }

    function sanitizeAssistantUiState(ui) {
        const raw = ui && typeof ui === 'object' ? ui : {};
        return {
            isOpen: !!raw.isOpen && !raw.minimized,
            minimized: !!raw.minimized || !raw.isOpen,
            maximized: false,
            showHistory: !!raw.showHistory,
            unread: Math.max(0, Number(raw.unread || 0) || 0)
        };
    }

    function getAssistantRobotBadgeMarkup() {
        return `
                    <div class="robot-3d assistant-robot-badge">
                        <div class="robot-antenna">
                            <div class="robot-antenna-dot"></div>
                            <div class="robot-antenna-stem"></div>
                        </div>
                        <div class="robot-head">
                            <div class="robot-ear robot-ear-l"></div>
                            <div class="robot-eye"><div class="robot-pupil"></div></div>
                            <div class="robot-ear robot-ear-r"></div>
                        </div>
                        <div class="robot-neck"></div>
                        <div class="robot-base">
                            <div class="robot-base-shoulder"></div>
                            <div class="robot-base-body">
                                <div class="robot-led robot-led-1"></div>
                                <div class="robot-led robot-led-2"></div>
                                <div class="robot-led robot-led-3"></div>
                            </div>
                        </div>
                        <div class="robot-shadow"></div>
                    </div>
                `;
    }

    function setAssistantDraft(value) {
        state.assistant.draft = value;
        sessionStorage.setItem('vt_assistant_draft', value);
    }

    function getAssistantWelcomeMessage() {
        return createAssistantMessage(
            'assistant',
            'I can help with this Verba workspace and also answer general questions. Ask about models, prompts, coding, writing, exports, recording flow, or anything else you need.'
        );
    }

    function ensureAssistantThread() {
        ensureAssistantConversationStore();
    }

    function assistantEscapedHtml(text) {
        return escapeHtml(String(text || '')).replace(/\n/g, '<br>');
    }

    function parseAssistantThinking(rawText) {
        const raw = String(rawText || '').replace(/\r\n/g, '\n');
        const thinkMatches = [...raw.matchAll(/<think>([\s\S]*?)<\/think>/gi)];
        if (thinkMatches.length) {
            const thinking = thinkMatches
                .map(match => normalizeAssistantText(match[1] || ''))
                .filter(Boolean)
                .join('\n\n');
            const output = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            return { thinking, output };
        }
        if (/^\s*<think>/i.test(raw) && !/<\/think>/i.test(raw)) {
            return {
                thinking: normalizeAssistantText(raw.replace(/^\s*<think>/i, '').trim()),
                output: ''
            };
        }
        return { thinking: '', output: raw.trim() };
    }

    function renderAssistantTextBlockHtml(text) {
        const normalized = normalizeAssistantText(text);
        return normalized ? `<div class="assistant-rich-text">${assistantEscapedHtml(normalized)}</div>` : '';
    }

    function renderAssistantCodeBlockHtml(code, language = '') {
        const safeCode = String(code || '').replace(/\s+$/, '');
        const safeLanguage = String(language || '').trim();
        const encoded = escapeHtml(safeCode);
        const encodedAttr = encodeURIComponent(safeCode);
        return `
                    <div class="assistant-code-block">
                        <div class="assistant-code-head">
                            <span class="assistant-code-lang">${escapeHtml(safeLanguage || 'Code')}</span>
                            <button class="assistant-code-copy" type="button" data-copy-code="${encodedAttr}">Copy code</button>
                        </div>
                        <pre><code>${encoded}</code></pre>
                    </div>
                `;
    }

    function renderAssistantStructuredHtml(text) {
        const raw = String(text || '').replace(/\r\n/g, '\n');
        if (!raw.trim()) return '';
        const parts = raw.split(/```([^\n`]*)\n([\s\S]*?)```/g);
        let html = '';
        for (let i = 0; i < parts.length; i++) {
            if (i % 3 === 0) {
                html += renderAssistantTextBlockHtml(parts[i]);
            } else if ((i % 3) === 1) {
                const language = parts[i];
                const code = parts[i + 1] || '';
                html += renderAssistantCodeBlockHtml(code, language);
                i += 1;
            }
        }
        return html || renderAssistantTextBlockHtml(raw);
    }

    function renderAssistantResponseHtml(rawText) {
        const parsed = parseAssistantThinking(rawText);
        const thinkingHtml = parsed.thinking
            ? `
                        <div class="assistant-think-block">
                            <div class="assistant-think-head">
                                <span class="assistant-thinking-label">Thinking...</span>
                                <div class="assistant-thinking-dots" aria-hidden="true">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                            <div class="assistant-think-body">${assistantEscapedHtml(parsed.thinking)}</div>
                        </div>
                    `
            : '';
        const outputHtml = parsed.output ? renderAssistantStructuredHtml(parsed.output) : '';
        return `${thinkingHtml}${outputHtml}`;
    }

    function normalizeAssistantResponsePayload(text) {
        return String(text || '')
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function extractFinalAiOutputText(text) {
        const parsed = parseAssistantThinking(text);
        const base = String(parsed.output || text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        return normalizeAssistantText(base).trim();
    }

    function normalizeAssistantText(text) {
        return String(text || '')
            .replace(/\r\n/g, '\n')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/__(.*?)__/g, '$1')
            .replace(/^\s*[-*]\s+/gm, '')
            .replace(/^\s*\d+\.\s*\*\*(.*?)\*\*/gm, (m, inner) => `${inner}`)
            .replace(/\|/g, ' ')
            .replace(/[ \t]{2,}/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function describeAssistantAttachment(meta) {
        const attachment = normalizeAssistantAttachmentMeta(meta);
        if (!attachment) return '';
        const size = attachment.size ? ` - ${formatFileSize(attachment.size)}` : '';
        return `${attachment.name}${size}`;
    }

    function describeAssistantAttachmentList(raw) {
        const attachments = normalizeAssistantAttachmentList(raw);
        if (!attachments.length) return '';
        if (attachments.length === 1) return describeAssistantAttachment(attachments[0]);
        const pdfCount = attachments.filter(item => item.kind === 'pdf').length;
        const imageCount = attachments.filter(item => item.kind === 'image').length;
        const textCount = attachments.filter(item => item.kind === 'text').length;
        const parts = [];
        if (imageCount) parts.push(`${imageCount} image${imageCount === 1 ? '' : 's'}`);
        if (pdfCount) parts.push(`${pdfCount} PDF${pdfCount === 1 ? '' : 's'}`);
        if (textCount) parts.push(`${textCount} text file${textCount === 1 ? '' : 's'}`);
        return `${parts.join(' + ')} attached`;
    }

    function getDefaultAssistantPromptForAttachment(attachment) {
        const attachments = normalizeAssistantAttachmentList(attachment);
        if (!attachments.length) return '';
        const hasPdf = attachments.some(item => item.kind === 'pdf');
        const hasText = attachments.some(item => item.kind === 'text');
        return hasPdf
            ? 'Please analyze this PDF and summarize the important content.'
            : hasText
                ? 'Please analyze these attached files and summarize the important content.'
                : attachments.length > 1
                    ? 'Please analyze these images and extract the important details and any readable text.'
                    : 'Please analyze this image and extract the important details and any readable text.';
    }

    function clearAssistantAttachment(options = {}) {
        state.assistant.pendingAttachment = null;
        if (assistantFileInput) assistantFileInput.value = '';
        if (!options.silent) renderAssistantComposer();
    }

    function renderAssistantComposer() {
        const modelOption = getActiveAssistantModelOption();
        const pendingAttachments = normalizeAssistantAttachmentList(state.assistant.pendingAttachment);
        const pendingAttachment = pendingAttachments[0] || null;
        const draftValue = String(assistantInput?.value || state.assistant.draft || '').trim();
        const requestOption = getAssistantOptionForRequest(pendingAttachments, draftValue);
        const providerLabel = getAssistantProviderLabel(modelOption.provider);
        const capabilityLabel = modelOption.supportsPdf
            ? 'Images + PDFs'
            : modelOption.supportsImages
                ? 'Images'
                : 'Text only';
        const routingLabel = modelOption.id === 'assistant:max'
            ? ` | routes to ${requestOption.label.replace(/^Groq - /, '').replace(/^Gemini - /, 'Gemini ')}`
            : pendingAttachment && requestOption.provider === 'gemini' && modelOption.provider !== 'gemini'
                ? ` | attachment via Gemini ${requestOption.model}`
                : '';

        if (assistantModelSelect) assistantModelSelect.value = modelOption.id;
        if (assistantModelMeta) assistantModelMeta.textContent = `${providerLabel} | ${modelOption.label.replace(/^.+? - /, '')} | ${capabilityLabel}${routingLabel}`;
        if (assistantFileInput) assistantFileInput.accept = assistantAttachmentAccept(modelOption);
        if (assistantAttachmentPreview) assistantAttachmentPreview.hidden = !pendingAttachments.length;
        if (assistantAttachmentKind && pendingAttachments.length) {
            const hasPdf = pendingAttachments.some(item => item.kind === 'pdf');
            const hasText = pendingAttachments.some(item => item.kind === 'text');
            assistantAttachmentKind.textContent = pendingAttachments.length > 1
                ? `${pendingAttachments.length} files`
                : (hasPdf ? 'PDF' : (hasText ? 'File' : 'Image'));
        }
        if (assistantAttachmentMeta && pendingAttachments.length) assistantAttachmentMeta.textContent = describeAssistantAttachmentList(pendingAttachments);
        if (assistantAttachBtn) {
            const canAttach = !state.assistant.isSending;
            assistantAttachBtn.disabled = !canAttach;
            assistantAttachBtn.title = !canAttach
                ? 'Wait for the current assistant request to finish'
                : getProviderKeys('gemini').length
                    ? `Add photos, PDFs, and files. Gemini analysis model: ${getConfiguredGeminiAnalysisModel()}`
                    : modelOption.supportsPdf
                        ? 'Add photos, PDFs, and files'
                        : modelOption.supportsImages
                            ? 'Add photos and files. Switch to Gemini for PDFs'
                            : 'Add files';
            assistantAttachBtn.setAttribute('aria-label', assistantAttachBtn.title);
        }
        if (assistantMicBtn) {
            const supported = !!assistantRecognition;
            assistantMicBtn.disabled = !supported || !!state.assistant.isSending;
            assistantMicBtn.classList.toggle('listening', !!state.assistant.isListening);
            assistantMicBtn.setAttribute('aria-pressed', state.assistant.isListening ? 'true' : 'false');
            assistantMicBtn.setAttribute('aria-label', state.assistant.isListening ? 'Stop voice input' : 'Start voice input');
            assistantMicBtn.title = !supported
                ? 'Voice input is not supported in this browser'
                : state.assistant.isListening
                    ? 'Stop voice input'
                    : 'Voice input (English)';
        }
        if (assistantSend) {
            assistantSend.disabled = !!state.assistant.isSending || (!draftValue && !pendingAttachments.length);
            assistantSend.classList.toggle('loading', !!state.assistant.isSending);
            assistantSend.classList.toggle('sending', !!state.assistant.isSending);
            assistantSend.setAttribute(
                'aria-label',
                state.assistant.isSending
                    ? (pendingAttachments.length ? 'Processing attachment and sending assistant message' : 'Sending assistant message')
                    : 'Send assistant message'
            );
            assistantSend.title = state.assistant.isSending
                ? (pendingAttachments.length ? 'Processing attachment...' : 'Sending...')
                : 'Send';
        }
    }

    async function handleAssistantFileSelection(fileList) {
        const files = Array.isArray(fileList) ? fileList : Array.from(fileList || []).filter(Boolean);
        if (!files.length) return;
        const existing = Array.isArray(state.assistant.pendingAttachment)
            ? [...state.assistant.pendingAttachment]
            : (state.assistant.pendingAttachment ? [state.assistant.pendingAttachment] : []);
        const nextAttachments = [...existing];
        for (const file of files) {
            const mimeType = inferAttachmentMimeType(file);
            if (!['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain', 'text/markdown', 'text/csv', 'application/json'].includes(mimeType)) {
                toast('Supported assistant files: PNG, JPG, JPEG, WEBP, PDF, TXT, MD, CSV, JSON.', 'warning', 3600);
                return;
            }
            if ((file.size || 0) > ASSISTANT_ATTACHMENT_MAX_BYTES) {
                toast(`Assistant attachments are limited to ${formatFileSize(ASSISTANT_ATTACHMENT_MAX_BYTES)}.`, 'warning', 3600);
                return;
            }
            nextAttachments.push({ ...buildAssistantAttachmentMeta(file), file });
        }
        const requestOption = getAssistantOptionForRequest(nextAttachments, String(assistantInput?.value || state.assistant.draft || '').trim());
        if (!canAssistantModelUseAttachment(requestOption, nextAttachments)) {
            toast('The selected assistant model does not support that file type.', 'warning', 3200);
            return;
        }
        if (requestOption.provider === 'gemini') {
            toast(`Attachments will use Gemini analysis model: ${requestOption.model}`, 'info', 3200);
        }
        state.assistant.pendingAttachment = nextAttachments;
        renderAssistantComposer();
        if (assistantInput) assistantInput.focus();
    }

    function getLastAssistantReply() {
        const msgs = state.assistant.messages || [];
        for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i]?.role === 'assistant' && msgs[i]?.content) return msgs[i].content;
        }
        return '';
    }

    function formatAssistantConversationTime(ts) {
        const time = Number(ts || 0);
        if (!time) return 'Recent';
        const diffMs = Date.now() - time;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 7) return `${diffDay}d ago`;
        return new Date(time).toLocaleDateString();
    }

    function renderAssistantHistoryList() {
        if (!assistantHistoryList) return;
        const conversations = [...(state.assistant.conversations || [])]
            .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
        if (!conversations.length) {
            assistantHistoryList.innerHTML = '<div class="assistant-history-empty">No chats yet. Start a new chat and it will appear here.</div>';
            return;
        }
        assistantHistoryList.innerHTML = conversations.map(conv => {
            const activeClass = conv.id === state.assistant.currentConversationId ? ' active' : '';
            const convId = escapeHtml(conv.id);
            const title = escapeHtml(conv.title || 'New chat');
            const meta = escapeHtml(formatAssistantConversationTime(conv.updatedAt));
            return '' +
                '<div class="assistant-history-item' + activeClass + '" data-conversation-id="' + convId + '">' +
                '<div class="assistant-history-copy">' +
                '<div class="assistant-history-name">' + title + '</div>' +
                '<div class="assistant-history-meta">' + meta + '</div>' +
                '</div>' +
                '<button class="assistant-history-delete" type="button" data-delete-conversation="' + convId + '" aria-label="Delete conversation">' +
                '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>' +
                '</button>' +
                '</div>';
        }).join('');
    }

    function selectAssistantConversation(conversationId) {
        if (!conversationId) return;
        persistAssistantThread();
        const next = (state.assistant.conversations || []).find(conv => conv.id === conversationId);
        if (!next) return;
        state.assistant.currentConversationId = conversationId;
        state.assistant.showHistory = false;
        syncAssistantMessagesFromCurrentConversation();
        persistAssistantConversations();
        persistAssistantUi();
        renderAssistantMessages();
        if (state.assistant.isOpen) setTimeout(() => assistantInput.focus(), 60);
    }

    function createNewAssistantConversation() {
        persistAssistantThread();
        const conv = createAssistantConversation([getAssistantWelcomeMessage()]);
        state.assistant.conversations = [conv, ...(state.assistant.conversations || [])];
        state.assistant.currentConversationId = conv.id;
        state.assistant.showHistory = false;
        syncAssistantMessagesFromCurrentConversation();
        persistAssistantConversations();
        persistAssistantUi();
        clearAssistantAttachment({ silent: true });
        renderAssistantMessages();
        setAssistantDraft('');
        if (assistantInput) assistantInput.value = '';
        if (state.assistant.isOpen) setTimeout(() => assistantInput.focus(), 60);
    }

    function deleteAssistantConversation(conversationId) {
        if (!conversationId) return;
        state.assistant.conversations = (state.assistant.conversations || []).filter(conv => conv.id !== conversationId);
        if (!state.assistant.conversations.length) {
            const fresh = createAssistantConversation([getAssistantWelcomeMessage()]);
            state.assistant.conversations = [fresh];
        }
        if (!state.assistant.conversations.some(conv => conv.id === state.assistant.currentConversationId)) {
            state.assistant.currentConversationId = state.assistant.conversations[0]?.id || '';
        }
        syncAssistantMessagesFromCurrentConversation();
        persistAssistantConversations();
        persistAssistantUi();
        clearAssistantAttachment({ silent: true });
        renderAssistantMessages();
    }

    function renderAssistantMessages() {
        const msgs = Array.isArray(state.assistant.messages) ? state.assistant.messages : [];
        const messageMarkup = msgs.map(msg => {
            const role = msg.role === 'user' ? 'user' : 'assistant';
            const rawContent = String(msg.content || '');
            const isError = role === 'assistant' && /^Assistant error:/i.test(rawContent.trim());
            const displayText = role === 'assistant'
                ? renderAssistantResponseHtml(rawContent || '')
                : assistantEscapedHtml(rawContent);
            const attachments = normalizeAssistantAttachmentList(msg.attachments || msg.attachment);
            const attachmentMarkup = attachments.length
                ? attachments.map(attachment => `<div class="assistant-message-attachment verba-attachment-chip"><span class="assistant-message-attachment-kind">${escapeHtml(attachment.kind === 'pdf' ? 'PDF' : (attachment.kind === 'text' ? 'File' : 'Image'))}</span><span class="assistant-message-attachment-name">${escapeHtml(describeAssistantAttachment(attachment))}</span></div>`).join('')
                : '';
            if (role === 'user') {
                return `
      <div class="assistant-message user verba-msg-user">
        <div class="assistant-bubble msg-bubble">${attachmentMarkup}${displayText}</div>
      </div>`;
            }
            return `
      <div class="assistant-message assistant verba-msg-assistant${isError ? ' error' : ''}">
        <div class="assistant-avatar-dot msg-avatar" aria-hidden="true">${getAssistantRobotBadgeMarkup()}</div>
        <div class="assistant-bubble msg-bubble">${attachmentMarkup}${displayText}</div>
      </div>`;
        }).join('');
        assistantMessages.innerHTML = messageMarkup;
        assistantEmpty.style.display = msgs.length ? 'none' : '';
        hideTypingIndicator();
        if (state.assistant.isSending) showTypingIndicator();
        animateAssistantMessageEdges(msgs);
        smoothScrollChat();
        const unread = Number(state.assistant.unread || 0);
        assistantUnread.textContent = unread > 9 ? '9+' : String(unread);
        assistantUnread.classList.toggle('visible', unread > 0);
        assistantRuntimeMeta.textContent = `${state.mode} mode | audio ${state.apiProvider.toUpperCase()} ready | assistant ${getAssistantProviderLabel(getActiveAssistantProvider())} | ${getActiveMemoryPack()?.name || 'Primary'} memory`;
        renderAssistantComposer();
        renderAssistantHistoryList();
        assistantLauncher.classList.toggle('open', !!state.assistant.isOpen);
        assistantShell.classList.toggle('open', !!state.assistant.isOpen);
        assistantShell.classList.toggle('maximized', !!state.assistant.maximized);
        assistantPanel.hidden = !state.assistant.isOpen;
        if (assistantHistoryPanel) assistantHistoryPanel.hidden = !state.assistant.showHistory;
        assistantHistoryBtn?.classList.toggle('active', !!state.assistant.showHistory);
        if (assistantMaxBtn) assistantMaxBtn.title = state.assistant.maximized ? 'Restore assistant' : 'Expand assistant';
        if (assistantMaxBtn) assistantMaxBtn.setAttribute('aria-label', state.assistant.maximized ? 'Restore assistant' : 'Expand assistant');
    }

    function smoothScrollChat() {
        const chat = assistantMessages;
        if (!chat) return;
        const target = chat.scrollHeight;
        const start = chat.scrollTop;
        const diff = target - start;
        if (diff <= 0) return;
        const duration = Math.min(400, diff * 0.5);
        let startTime = null;
        const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            chat.scrollTop = start + diff * easeOutCubic(progress);
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function showTypingIndicator() {
        const chat = assistantMessages;
        if (!chat || document.getElementById('verba-typing')) return;
        const el = document.createElement('div');
        el.id = 'verba-typing';
        el.className = 'verba-typing-row';
        el.innerHTML = `
      <div class="assistant-avatar-dot msg-avatar verba-typing-avatar" aria-hidden="true">${getAssistantRobotBadgeMarkup()}</div>
      <div class="verba-typing-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>`;
        chat.appendChild(el);
        smoothScrollChat();
    }

    function hideTypingIndicator() {
        document.getElementById('verba-typing')?.remove();
    }

    function animateAssistantMessageEdges(msgs) {
        if (!assistantMessages) return;
        const userMessages = assistantMessages.querySelectorAll('.assistant-message.user');
        const assistantRows = assistantMessages.querySelectorAll('.assistant-message.assistant');
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg?.role === 'user') {
            const lastUser = userMessages[userMessages.length - 1];
            if (lastUser) lastUser.style.animation = 'msgSlideRight 280ms cubic-bezier(0.34,1.56,0.64,1) forwards';
        }
        if (lastMsg?.role === 'assistant') {
            const lastAssistant = assistantRows[assistantRows.length - 1];
            if (lastAssistant) {
                lastAssistant.style.animation = 'msgSlideLeft 280ms cubic-bezier(0.34,1.56,0.64,1) forwards';
                const avatar = lastAssistant.querySelector('.msg-avatar');
                if (avatar) avatar.style.animation = 'msgSlideLeft 280ms 40ms cubic-bezier(0.34,1.56,0.64,1) both';
            }
        }
    }

    function setAssistantOpen(isOpen) {
        if (!isOpen) {
            if (state.assistant.isListening && assistantRecognition) {
                try { assistantRecognition.stop(); } catch (e) { }
            }
            state._assistantScrollObserver?.disconnect();
            state._assistantScrollObserver = null;
            state.assistant.maximized = false;
            if (assistantPanel && !assistantPanel.hidden) {
                assistantPanel.classList.remove('verba-panel-open');
                assistantPanel.classList.add('verba-panel-closing');
                setTimeout(() => {
                    assistantPanel.classList.remove('verba-panel-closing');
                    state.assistant.isOpen = false;
                    state.assistant.minimized = true;
                    persistAssistantUi();
                    renderAssistantMessages();
                }, 200);
                return;
            }
        }
        state.assistant.isOpen = !!isOpen;
        state.assistant.minimized = !isOpen;
        if (isOpen) {
            state.assistant.unread = 0;
        }
        persistAssistantUi();
        renderAssistantMessages();
        if (isOpen && assistantPanel) {
            assistantPanel.classList.remove('verba-panel-closing');
            assistantPanel.classList.remove('verba-panel-open');
            requestAnimationFrame(() => {
                assistantPanel.classList.add('verba-panel-open');
                setTimeout(() => assistantPanel.classList.remove('verba-panel-open'), 350);
            });
            setTimeout(() => assistantInput.focus(), 60);
        }
    }

    function toggleAssistantMaximized(force) {
        state.assistant.maximized = typeof force === 'boolean' ? force : !state.assistant.maximized;
        if (state.assistant.maximized && !state.assistant.isOpen) {
            state.assistant.isOpen = true;
            state.assistant.minimized = false;
        }
        persistAssistantUi();
        renderAssistantMessages();
    }

    function pushAssistantMessage(role, content, extras = {}) {
        const message = createAssistantMessage(role, content, extras);
        state.assistant.messages.push(message);
        persistAssistantThread();
        renderAssistantMessages();
        return message;
    }

    function getAssistantPromptContext() {
        const importedMemory = getImportedMemoryContext({ maxChars: 7000 });
        return {
            system: `You are Verba Assistant.\n${ASSISTANT_KB}\n\nCurrent runtime state:\n${getAssistantRuntimeSummary()}\n\nPreferred output style:\n${getOutputStyleInstruction()}\n\nWhen generating code, always output the complete implementation without truncating or summarizing. Never say "rest of code here" or "continues below". For documents, use proper headings, sections and formatting. Prioritize completeness over brevity.`,
            memory: importedMemory
                ? `Use the imported user memory below as long-term context for preferences, projects, terminology, and stable background facts. Do not let it override transcript text or current runtime state when they conflict.\n\n${importedMemory}`
                : ''
        };
    }

    function getAssistantGenerationConfig() {
        return {
            temperature: 0.3,
            topP: 0.95,
            maxTokens: 8192,
            frequencyPenalty: 0,
            presencePenalty: 0
        };
    }

    function getAttachmentAnalysisInstruction(attachments = null) {
        const normalized = normalizeAssistantAttachmentList(attachments);
        if (!normalized.length) return '';
        const hasPdf = normalized.some(item => item.kind === 'pdf');
        const hasText = normalized.some(item => item.kind === 'text');
        return hasPdf
            ? 'The latest user message includes attached PDFs. You must inspect the attached documents directly, perform OCR where needed, extract the visible text, tables, form fields, values, dates, names, totals, and key facts, then answer from the attachment contents instead of asking the user to provide the data manually.'
            : hasText
                ? 'The latest user message includes attached text-like files. You must read the attached file contents directly, preserve structure where useful, extract important fields, tables, values, sections, and key facts, then answer from the file contents instead of asking the user to provide the data manually.'
                : 'The latest user message includes attached images. You must inspect the attached images directly, perform OCR where needed, extract all readable text, tables, form fields, values, dates, names, totals, and key facts, then answer from the image contents instead of asking the user to provide the data manually.';
    }

    function buildAssistantPromptMessages(currentAttachment = null) {
        const thread = (state.assistant.messages || [])
            .filter(msg => msg && (msg.role === 'user' || msg.role === 'assistant'))
            .slice(-8)
            .map((msg, index, arr) => {
                const attachments = normalizeAssistantAttachmentList(msg.attachments || msg.attachment);
                const isLatestAttachment = currentAttachment && msg.role === 'user' && index === arr.length - 1;
                const effectiveAttachments = isLatestAttachment
                    ? normalizeAssistantAttachmentList(currentAttachment)
                    : attachments;
                if (effectiveAttachments.length) {
                    const textAttachmentBlocks = effectiveAttachments
                        .filter(item => item?.kind === 'text' && item?.textContent)
                        .map(item => ({
                            type: 'text',
                            text: `Attached file: ${item.name}\n\n${String(item.textContent || '').slice(0, 200000)}`
                        }));
                    return {
                        role: msg.role,
                        content: [
                            { type: 'text', text: String(msg.content || getDefaultAssistantPromptForAttachment(effectiveAttachments)) },
                            ...textAttachmentBlocks,
                            ...effectiveAttachments
                                .filter(item => item?.dataUrl)
                                .map(item => ({ type: 'image_url', image_url: { url: item.dataUrl } }))
                        ]
                    };
                }
                return { role: msg.role, content: String(msg.content || '') };
            });
        const promptContext = getAssistantPromptContext();
        return [
            {
                role: 'system',
                content: promptContext.system
            },
            ...(getAttachmentAnalysisInstruction(currentAttachment) ? [{
                role: 'system',
                content: getAttachmentAnalysisInstruction(currentAttachment)
            }] : []),
            ...(promptContext.memory ? [{
                role: 'system',
                content: promptContext.memory
            }] : []),
            ...thread
        ];
    }

    function buildGeminiAssistantContents(currentAttachment = null) {
        return (state.assistant.messages || [])
            .filter(msg => msg && (msg.role === 'user' || msg.role === 'assistant'))
            .slice(-8)
            .map((msg, index, arr) => {
                const isLatestAttachment = currentAttachment && msg.role === 'user' && index === arr.length - 1;
                const storedAttachments = normalizeAssistantAttachmentList(msg.attachments || msg.attachment);
                const attachmentsForMessage = isLatestAttachment
                    ? normalizeAssistantAttachmentList(currentAttachment)
                    : storedAttachments.filter(item => (item?.kind === 'text' && item?.textContent) || canReuseGeminiFileReference(item));
                const parts = [];
                const text = String(msg.content || '').trim();
                if (text) parts.push({ text });
                attachmentsForMessage.forEach(attachmentForMessage => {
                    if (attachmentForMessage?.kind === 'text' && attachmentForMessage?.textContent) {
                        parts.push({
                            text: `Attached file: ${attachmentForMessage.name}\n\n${String(attachmentForMessage.textContent || '').slice(0, 200000)}`
                        });
                        return;
                    }
                    if (!attachmentForMessage?.fileUri) return;
                    parts.push({
                        file_data: {
                            mime_type: attachmentForMessage.mimeType,
                            file_uri: attachmentForMessage.fileUri
                        }
                    });
                });
                if (!parts.length) return null;
                return {
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts
                };
            })
            .filter(Boolean);
    }

    function buildAssistantAttachmentMeta(file, provider = '') {
        const mimeType = inferAttachmentMimeType(file);
        return {
            id: `assistant_att_${Date.now()}_${++assistantAttachmentSeq}`,
            name: String(file?.name || 'attachment'),
            size: Math.max(0, Number(file?.size || 0) || 0),
            mimeType,
            kind: attachmentKindFromMimeType(mimeType),
            provider
        };
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('Could not read the selected file.'));
            reader.readAsDataURL(file);
        });
    }

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('Could not read the selected text file.'));
            reader.readAsText(file);
        });
    }

    function loadImageElementFromFile(file) {
        return new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const image = new Image();
            image.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(image);
            };
            image.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Could not decode the selected image.'));
            };
            image.src = objectUrl;
        });
    }

    async function normalizeAssistantImageFile(file) {
        const mimeType = inferAttachmentMimeType(file);
        if (!mimeType.startsWith('image/')) return file;
        if (typeof document === 'undefined') return file;
        try {
            const image = await loadImageElementFromFile(file);
            const width = Math.max(1, Number(image.naturalWidth || image.width || 0));
            const height = Math.max(1, Number(image.naturalHeight || image.height || 0));
            if (!width || !height) return file;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { alpha: false });
            if (!ctx) return file;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(image, 0, 0, width, height);
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!(blob instanceof Blob) || !blob.size) return file;
            const baseName = String(file?.name || 'image').replace(/\.[^.]+$/, '');
            return new File([blob], `${baseName}.png`, { type: 'image/png' });
        } catch (err) {
            console.warn('Assistant image normalization skipped:', err);
            return file;
        }
    }

    async function prepareAssistantAttachmentForProvider(attachment, provider) {
        const attachments = Array.isArray(attachment) ? attachment : normalizeAssistantAttachmentList(attachment);
        if (!attachments.length) return [];
        if (provider === 'gemini') {
            throw new Error('Gemini attachments must be uploaded with an API key.');
        }
        return Promise.all(attachments.map(async item => {
            const cached = item.id ? assistantAttachmentCache.get(item.id) : null;
            if (cached && cached.provider === provider) return { ...cached };
            if (item.kind === 'text') {
                const textContent = item.file ? await readFileAsText(item.file) : String(item.textContent || '');
                const prepared = {
                    ...normalizeAssistantAttachmentMeta({
                        ...item,
                        textContent
                    }),
                    provider,
                    textContent
                };
                if (item.id) assistantAttachmentCache.set(item.id, prepared);
                return prepared;
            }
            if (item.kind !== 'image') {
                throw new Error('This model only supports image or text attachments.');
            }
            const normalizedFile = item.file ? await normalizeAssistantImageFile(item.file) : item.file;
            const dataUrl = await readFileAsDataUrl(normalizedFile);
            const prepared = {
                ...normalizeAssistantAttachmentMeta({
                    ...item,
                    mimeType: inferAttachmentMimeType(normalizedFile) || item.mimeType
                }),
                provider,
                dataUrl,
                file: item.file || normalizedFile
            };
            if (item.id) assistantAttachmentCache.set(item.id, prepared);
            return prepared;
        }));
    }

    function startAssistantVoiceInput() {
        if (!assistantRecognition) {
            toast('Voice input is not supported here', 'warning');
            return;
        }
        if (state.isRecording) {
            toast('Stop the main recording first', 'warning');
            return;
        }
        if (state.assistant.isListening) return;
        assistantDictationBase = String(assistantInput?.value || '').trim();
        assistantDictationFinal = '';
        assistantRecognition.lang = 'en-US';
        try {
            assistantRecognition.start();
            state.assistant.isListening = true;
            renderAssistantMessages();
            if (assistantInput) assistantInput.focus();
        } catch (e) {
            console.warn('Assistant voice input start failed:', e);
            state.assistant.isListening = false;
            renderAssistantMessages();
            toast('Assistant voice input unavailable', 'warning');
        }
    }

    function stopAssistantVoiceInput() {
        state.assistant.isListening = false;
        if (assistantRecognition) {
            try { assistantRecognition.stop(); } catch (e) { }
        }
        renderAssistantMessages();
    }

    async function uploadGeminiFileWithKey(file, apiKey, signal) {
        const mimeType = inferAttachmentMimeType(file) || 'application/octet-stream';
        const timeoutMs = getProviderTimeoutMs();
        const startResp = await fetchWithTimeout(
            fetch,
            getGeminiUploadEndpoint(),
            {
                method: 'POST',
                headers: {
                    'x-goog-api-key': apiKey,
                    'X-Goog-Upload-Protocol': 'resumable',
                    'X-Goog-Upload-Command': 'start',
                    'X-Goog-Upload-Header-Content-Length': String(file.size || 0),
                    'X-Goog-Upload-Header-Content-Type': mimeType,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({}),
                signal
            },
            { timeoutMs, timeoutMessage: `Gemini upload start timed out after ${timeoutMs}ms` }
        );
        if (!startResp.ok) {
            const raw = await startResp.text().catch(() => '');
            const err = safeJsonParse(raw, null);
            throw new Error(err?.error?.message || err?.message || raw || `Gemini upload failed (${startResp.status})`);
        }
        const uploadUrl = startResp.headers.get('x-goog-upload-url');
        if (!uploadUrl) throw new Error('Gemini upload URL was not returned.');
        const uploadResp = await fetchWithTimeout(
            fetch,
            uploadUrl,
            {
                method: 'POST',
                headers: {
                    'X-Goog-Upload-Command': 'upload, finalize',
                    'X-Goog-Upload-Offset': '0',
                    'Content-Type': mimeType
                },
                body: file,
                signal
            },
            { timeoutMs, timeoutMessage: `Gemini upload timed out after ${timeoutMs}ms` }
        );
        const raw = await uploadResp.text().catch(() => '');
        const payload = safeJsonParse(raw, null);
        if (!uploadResp.ok) {
            throw new Error(payload?.error?.message || payload?.message || raw || `Gemini upload failed (${uploadResp.status})`);
        }
        const uploaded = payload?.file || payload;
        if (!uploaded?.uri) throw new Error('Gemini did not return a usable file reference.');
        return {
            uri: String(uploaded.uri),
            mimeType: String(uploaded.mimeType || mimeType),
            displayName: String(uploaded.displayName || file.name || 'attachment')
        };
    }

    async function prepareGeminiAttachment(attachment, signal, options = {}) {
        const attachments = Array.isArray(attachment) ? attachment : normalizeAssistantAttachmentList(attachment);
        if (!attachments.length) return [];
        const keys = getProviderKeys('gemini');
        if (!keys.length) throw new Error('Gemini API key required for file analysis.');
        return Promise.all(attachments.map(async item => {
            const cached = item?.id ? assistantAttachmentCache.get(item.id) : null;
            if (!options.forceUpload && cached && cached.provider === 'gemini' && (cached.fileUri || cached.textContent)) return { ...cached };
            if (item.kind === 'text') {
                const textContent = item.file ? await readFileAsText(item.file) : String(item.textContent || '');
                const prepared = {
                    ...normalizeAssistantAttachmentMeta({
                        ...item,
                        provider: 'gemini',
                        textContent
                    }),
                    provider: 'gemini',
                    textContent,
                    file: item.file || null
                };
                if (item.id) assistantAttachmentCache.set(item.id, prepared);
                return prepared;
            }
            let lastErr = null;
            for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
                try {
                    const normalizedFile = item.kind === 'image' && item.file
                        ? await normalizeAssistantImageFile(item.file)
                        : item.file;
                    const uploaded = await uploadGeminiFileWithKey(normalizedFile, keys[keyIndex], signal);
                    const prepared = {
                        ...normalizeAssistantAttachmentMeta({
                            ...item,
                            provider: 'gemini',
                            fileUri: uploaded.uri,
                            mimeType: uploaded.mimeType,
                            fileName: normalizedFile?.name || item.name,
                            uploadedAt: Date.now()
                        }),
                        file: item.file || normalizedFile
                    };
                    if (item.id) assistantAttachmentCache.set(item.id, prepared);
                    return prepared;
                } catch (err) {
                    lastErr = err;
                }
            }
            throw lastErr || new Error('Gemini file upload failed.');
        }));
    }

    function extractGeminiText(result) {
        const parts = Array.isArray(result?.candidates?.[0]?.content?.parts)
            ? result.candidates[0].content.parts
            : [];
        return parts
            .map(part => String(part?.text || '').trim())
            .filter(Boolean)
            .join('\n\n')
            .trim();
    }

    function isGeminiExpiredFileError(error) {
        const message = String(error?.message || error || '').toLowerCase();
        return message.includes('do not have permission to access the file')
            || message.includes('you do not have permission to access the file')
            || message.includes('may not exist');
    }

    async function requestGeminiAssistantReply(model, preparedAttachment, signal, options = {}) {
        const keys = getProviderKeys('gemini');
        if (!keys.length) throw new Error('Gemini API key required for file analysis.');
        const promptContext = getAssistantPromptContext();
        const generation = getAssistantGenerationConfig();
        const attachmentInstruction = getAttachmentAnalysisInstruction(preparedAttachment);
        let lastErr = null;
        for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
            try {
                recordGeminiUsage(model);
                const timeoutMs = getProviderTimeoutMs();
                const resp = await fetchWithTimeout(
                    fetch,
                    getGeminiGenerateEndpoint(model),
                    {
                        method: 'POST',
                        headers: {
                            'x-goog-api-key': keys[keyIndex],
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            system_instruction: {
                                parts: [{ text: [promptContext.system, attachmentInstruction, promptContext.memory].filter(Boolean).join('\n\n') }]
                            },
                            generationConfig: {
                                temperature: generation.temperature,
                                topP: generation.topP,
                                maxOutputTokens: generation.maxTokens
                            },
                            contents: buildGeminiAssistantContents(preparedAttachment)
                        }),
                        signal
                    },
                    { timeoutMs, timeoutMessage: `Gemini assistant request timed out after ${timeoutMs}ms` }
                );
                const raw = await resp.text().catch(() => '');
                const payload = safeJsonParse(raw, null);
                if (!resp.ok) {
                    throw new Error(payload?.error?.message || payload?.message || raw || `Gemini request failed (${resp.status})`);
                }
                updateDiagnostics({ provider: 'gemini', chatModel: model }, `assistant-chat success via Gemini key ${keyIndex + 1}`);
                return payload;
            } catch (err) {
                lastErr = err;
                if (isRequestTimeoutError(err)) {
                    updateDiagnostics({ provider: 'gemini', chatModel: model, errorType: 'timeout', timeoutMs: getProviderTimeoutMs() }, 'assistant-chat timed out via Gemini');
                    throw err;
                }
                if (signal?.aborted || isAbortError(err)) throw err;
            }
        }
        const rawPreparedAttachments = Array.isArray(preparedAttachment)
            ? preparedAttachment
            : (preparedAttachment ? [preparedAttachment] : []);
        if (!options.retriedExpiredFiles && isGeminiExpiredFileError(lastErr) && rawPreparedAttachments.some(item => item?.file)) {
            const refreshedAttachments = await prepareGeminiAttachment(preparedAttachment, signal, { forceUpload: true });
            updateDiagnostics({ provider: 'gemini', chatModel: model }, 'assistant-chat retry after Gemini file re-upload');
            return requestGeminiAssistantReply(model, refreshedAttachments, signal, { retriedExpiredFiles: true });
        }
        throw lastErr || new Error('Gemini assistant request failed.');
    }

    async function askAssistant(question) {
        const pendingAttachment = Array.isArray(state.assistant.pendingAttachment)
            ? state.assistant.pendingAttachment.map(item => ({ ...item }))
            : (state.assistant.pendingAttachment && typeof state.assistant.pendingAttachment === 'object'
                ? [{ ...state.assistant.pendingAttachment }]
                : []);
        const text = String(question || '').trim();
        const finalText = text || getDefaultAssistantPromptForAttachment(pendingAttachment);
        const modelOption = getAssistantOptionForRequest(pendingAttachment, finalText);
        const provider = modelOption.provider;
        if (!finalText && !pendingAttachment.length) return;
        if (state.assistant.isListening) stopAssistantVoiceInput();
        if (pendingAttachment.length && !canAssistantModelUseAttachment(modelOption, pendingAttachment)) {
            toast(modelOption.provider === 'gemini'
                ? 'Configured Gemini analysis model does not support that attachment.'
                : 'Selected model does not support that attachment.', 'warning', 3400);
            return;
        }
        if (!getProviderKeys(provider).length) {
            pushAssistantMessage('assistant', provider === 'gemini'
                ? 'Gemini API key required. Open API Configuration, save a Gemini key, then try the file or image again.'
                : `API key required for ${getAssistantProviderLabel(provider)}. Open API Configuration, save a key, then ask again.`);
            toast(`${getAssistantProviderLabel(provider)} key required`, 'warning');
            return;
        }
        state.assistant.isSending = true;
        renderAssistantComposer();
        assistantModelMeta.textContent = `${getAssistantProviderLabel(provider)} | thinking...`;
        showTypingIndicator();
        try {
            let preparedAttachment = [];
            if (pendingAttachment.length) {
                preparedAttachment = provider === 'gemini'
                    ? await prepareGeminiAttachment(pendingAttachment)
                    : await prepareAssistantAttachmentForProvider(pendingAttachment, provider);
            }
            setAssistantDraft('');
            if (assistantInput) assistantInput.value = '';
            clearAssistantAttachment({ silent: true });
            pushAssistantMessage('user', finalText, { attachments: preparedAttachment });
            assistantModelMeta.textContent = `${getAssistantProviderLabel(provider)} | thinking...`;
            const model = modelOption.model;
            const generation = getAssistantGenerationConfig();
            let out = '';
            if (provider === 'gemini') {
                const result = await requestGeminiAssistantReply(model, preparedAttachment);
                out = normalizeAssistantResponsePayload(extractGeminiText(result));
            } else {
                const result = await requestWithProvider({
                    provider,
                    url: getChatEndpoint(provider),
                    responseType: 'json',
                    purpose: 'assistant-chat',
                    buildBody: () => JSON.stringify({
                        model,
                        temperature: generation.temperature,
                        top_p: generation.topP,
                        max_tokens: generation.maxTokens,
                        frequency_penalty: generation.frequencyPenalty,
                        presence_penalty: generation.presencePenalty,
                        messages: buildAssistantPromptMessages(preparedAttachment)
                    }),
                    maxRetries: 2,
                    syncPrimaryKey: provider === state.apiProvider
                });
                out = normalizeAssistantResponsePayload(result?.choices?.[0]?.message?.content || '');
            }
            hideTypingIndicator();
            pushAssistantMessage('assistant', out || 'I could not generate a grounded answer for that app question.');
            updateDiagnostics({ provider, chatModel: model }, 'assistant reply ready');
            if (!state.assistant.isOpen) state.assistant.unread = Math.min(9, Number(state.assistant.unread || 0) + 1);
        } catch (err) {
            hideTypingIndicator();
            pushAssistantMessage('assistant', `Assistant error: ${err.message || 'request failed'}`);
        } finally {
            hideTypingIndicator();
            state.assistant.isSending = false;
            persistAssistantUi();
            renderAssistantMessages();
        }
    }

    function toggleRecordingFromUi() {
        state.isRecording ? stopRecording() : startRecording();
    }

    // Primary recorder triggers
    micBtn?.addEventListener('click', toggleRecordingFromUi);
    orbTrigger?.addEventListener('click', (e) => {
        toggleRecordingFromUi();
    });
    orbTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleRecordingFromUi();
        }
    });
    captureOrbStage?.addEventListener('click', () => {
        toggleRecordingFromUi();
    });
    captureOrbStage?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleRecordingFromUi();
        }
    });

    assistantLauncher?.addEventListener('click', () => {
        setAssistantOpen(!state.assistant.isOpen);
    });

    assistantLauncher?.addEventListener('mousemove', (e) => {
        const rect = assistantLauncher.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) - 0.5;
        const y = ((e.clientY - rect.top) / rect.height) - 0.5;
        assistantLauncher.style.setProperty('--assistant-tilt-x', `${(x * 10).toFixed(2)}deg`);
        assistantLauncher.style.setProperty('--assistant-tilt-y', `${(-y * 10).toFixed(2)}deg`);
    });

    assistantLauncher?.addEventListener('mouseleave', () => {
        assistantLauncher.style.setProperty('--assistant-tilt-x', '0deg');
        assistantLauncher.style.setProperty('--assistant-tilt-y', '0deg');
    });

    // ── Global cursor tracking: robot head + pupil follow mouse ──
    (function initRobotTracking() {
        function updateRobot(cx, cy) {
            if (!assistantLauncher) return;
            const rect = assistantLauncher.getBoundingClientRect();
            const robotCX = rect.left + rect.width / 2;
            const robotCY = rect.top + rect.height / 2;
            const dx = cx - robotCX;
            const dy = cy - robotCY;
            const maxD = Math.max(window.innerWidth, window.innerHeight) * 0.6;
            const t = Math.min(1, Math.sqrt(dx * dx + dy * dy) / maxD);
            const ry = (dx / window.innerWidth) * 22 * t;
            const rx = -(dy / window.innerHeight) * 15 * t;
            const px = Math.max(-3.5, Math.min(3.5, dx / window.innerWidth * 22));
            const py = Math.max(-3.5, Math.min(3.5, dy / window.innerHeight * 15));
            assistantLauncher.style.setProperty('--robot-rx', rx.toFixed(2) + 'deg');
            assistantLauncher.style.setProperty('--robot-ry', ry.toFixed(2) + 'deg');
            assistantLauncher.style.setProperty('--robot-px', px.toFixed(2) + 'px');
            assistantLauncher.style.setProperty('--robot-py', py.toFixed(2) + 'px');
            document.documentElement.style.setProperty('--assistant-robot-rx', rx.toFixed(2) + 'deg');
            document.documentElement.style.setProperty('--assistant-robot-ry', ry.toFixed(2) + 'deg');
            document.documentElement.style.setProperty('--assistant-robot-px', px.toFixed(2) + 'px');
            document.documentElement.style.setProperty('--assistant-robot-py', py.toFixed(2) + 'px');
        }
        document.addEventListener('mousemove', (e) => updateRobot(e.clientX, e.clientY));
        // Touch support
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) updateRobot(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
    })();

    function submitAssistantDraft() {
        if (state.assistant.isSending) return;
        askAssistant(assistantInput?.value || '');
    }

    assistantInput?.addEventListener('input', () => {
        setAssistantDraft(assistantInput.value);
        renderAssistantComposer();
    });
    assistantInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitAssistantDraft();
        }
    });
    assistantMessages?.addEventListener('click', (e) => {
        const copyBtn = e.target?.closest?.('.assistant-code-copy');
        if (!copyBtn) return;
        const encoded = copyBtn.getAttribute('data-copy-code') || '';
        let code = '';
        try {
            code = decodeURIComponent(encoded);
        } catch (err) {
            code = encoded;
        }
        if (!code) return;
        copyToClipboard(code, () => toast('Code copied', 'success'));
    });
    ['dragover', 'dragenter'].forEach(evt => {
        assistantInputWrap?.addEventListener(evt, (e) => {
            if (assistantAttachBtn?.disabled) return;
            e.preventDefault();
            assistantInputWrap.classList.add('drag-over');
        });
    });
    ['dragleave', 'drop'].forEach(evt => {
        assistantInputWrap?.addEventListener(evt, () => {
            assistantInputWrap.classList.remove('drag-over');
        });
    });
    assistantInputWrap?.addEventListener('drop', (e) => {
        if (assistantAttachBtn?.disabled) return;
        e.preventDefault();
        const files = Array.from(e.dataTransfer?.files || []).filter(Boolean);
        if (files.length) handleAssistantFileSelection(files);
    });
    assistantInput?.addEventListener('paste', (e) => {
        if (assistantAttachBtn?.disabled) return;
        const items = Array.from(e.clipboardData?.items || []);
        const files = items
            .filter(item => item.kind === 'file')
            .map(item => item.getAsFile())
            .filter(Boolean);
        if (!files.length) return;
        e.preventDefault();
        handleAssistantFileSelection(files);
    });

    assistantSend?.addEventListener('click', submitAssistantDraft);
    assistantAttachBtn?.addEventListener('click', () => {
        if (assistantAttachBtn.disabled) return;
        if (assistantFileInput) {
            assistantFileInput.value = '';
            assistantFileInput.click();
        }
    });
    ['dragover', 'dragenter'].forEach(evt => {
        assistantAttachBtn?.addEventListener(evt, (e) => {
            if (assistantAttachBtn.disabled) return;
            e.preventDefault();
            assistantAttachBtn.classList.add('drag-over');
        });
    });
    ['dragleave', 'drop'].forEach(evt => {
        assistantAttachBtn?.addEventListener(evt, () => {
            assistantAttachBtn.classList.remove('drag-over');
        });
    });
    assistantAttachBtn?.addEventListener('drop', (e) => {
        if (assistantAttachBtn.disabled) return;
        e.preventDefault();
        const files = Array.from(e.dataTransfer?.files || []).filter(Boolean);
        if (files.length) handleAssistantFileSelection(files);
    });
    assistantFileInput?.addEventListener('change', () => {
        const files = Array.from(assistantFileInput.files || []).filter(Boolean);
        if (files.length) handleAssistantFileSelection(files);
    });
    assistantAttachmentRemove?.addEventListener('click', () => {
        clearAssistantAttachment();
        toast('Attachment removed', 'info');
    });
    assistantMicBtn?.addEventListener('click', () => {
        if (state.assistant.isListening) {
            stopAssistantVoiceInput();
            return;
        }
        startAssistantVoiceInput();
    });

    assistantHistoryBtn?.addEventListener('click', () => {
        state.assistant.showHistory = !state.assistant.showHistory;
        if (!state.assistant.isOpen) {
            state.assistant.isOpen = true;
            state.assistant.minimized = false;
            state.assistant.unread = 0;
        }
        persistAssistantUi();
        renderAssistantMessages();
    });

    assistantQuickNewBtn?.addEventListener('click', () => {
        createNewAssistantConversation();
        toast('Started a new chat', 'success');
    });

    assistantNewChatBtn?.addEventListener('click', () => {
        createNewAssistantConversation();
        toast('Started a new chat', 'success');
    });

    assistantHistoryList?.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('[data-delete-conversation]');
        if (deleteBtn) {
            e.stopPropagation();
            deleteAssistantConversation(deleteBtn.getAttribute('data-delete-conversation'));
            toast('Conversation deleted', 'info');
            return;
        }
        const item = e.target.closest('[data-conversation-id]');
        if (!item) return;
        selectAssistantConversation(item.getAttribute('data-conversation-id'));
    });

    assistantMinBtn?.addEventListener('click', () => setAssistantOpen(false));
    assistantMaxBtn?.addEventListener('click', () => toggleAssistantMaximized());
    assistantCloseBtn?.addEventListener('click', () => setAssistantOpen(false));
    assistantClearBtn?.addEventListener('click', () => {
        state.assistant.messages = [getAssistantWelcomeMessage()];
        clearAssistantAttachment({ silent: true });
        persistAssistantThread();
        renderAssistantMessages();
        toast('Assistant thread cleared', 'info');
    });
    assistantCopyLastBtn?.addEventListener('click', () => {
        const messages = state?.assistant?.messages || [];
        const fullChat = messages
            .filter(m => m.role !== 'system')
            .map(m => {
                const role = m.role === 'user' ? 'You' : 'Verba';
                return `${role}:\n${m.content || m.text || ''}`;
            })
            .join('\n\n---\n\n');

        if (!fullChat.trim()) {
            toast('Nothing to copy');
            return;
        }

        navigator.clipboard.writeText(fullChat)
            .then(() => toast('Full chat copied'))
            .catch(() => {
                if (typeof legacyCopy === 'function') legacyCopy(fullChat, () => toast('Full chat copied'));
                else toast('Copy failed');
            });
    });
    document.querySelectorAll('#assistantQuickPrompts .assistant-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const prompt = btn.dataset.prompt || '';
            if (!prompt) return;
            if (!state.assistant.isOpen) setAssistantOpen(true);
            setAssistantDraft(prompt);
            assistantInput.value = prompt;
            renderAssistantComposer();
            askAssistant(prompt);
        });
    });

    // Language change
    langSelect.addEventListener('change', () => {
        if (state.isRecording && state.mode === 'realtime') {
            forceStop();
            setTimeout(startRecording, 200);
            toast('Language changed - restarting...', 'info');
        }
        state.liveHealth.activeLanguage = langSelect.value || 'auto';
        updateDiagnostics({ liveLanguage: state.liveHealth.activeLanguage }, 'Live language policy updated');
    });

    // Punctuation toggle
    punctBtn.addEventListener('click', () => {
        state.smartPunctEnabled = !state.smartPunctEnabled;
        punctBtn.classList.toggle('on', state.smartPunctEnabled);
        toast(state.smartPunctEnabled ? 'Smart punctuation on' : 'Smart punctuation off', 'info');
    });

    // Auto-copy toggle
    autoCopyBtn.addEventListener('click', () => {
        state.autoCopyEnabled = !state.autoCopyEnabled;
        autoCopyBtn.classList.toggle('on', state.autoCopyEnabled);
        if (!state.autoCopyEnabled) {
            clearAutoCopyCountdown();
            autoCopyBtn.classList.remove('auto-copy-active');
        }
        toast(state.autoCopyEnabled ? `Auto-copy on - fires after ${AUTO_COPY_DELAY / 1000}s silence` : 'Auto-copy off', 'info');
    });

    syncUploadedFileLanguageModeUi();
    refreshTopDownloadAction();
    refreshExportCards();
    fileLanguageModeInputs.forEach((input) => {
        input.addEventListener('change', () => {
            syncUploadedFileLanguageModeUi();
            refreshTopDownloadAction();
            refreshExportCards();
            const mode = getUploadedFileLanguageMode();
            updateDiagnostics({ fileLanguageMode: mode }, `Uploaded file mode set to ${mode === 'translate' ? 'translate to English' : 'preserve originals'}`);
        });
    });

    // Copy button
    $('copyBtn').addEventListener('click', () => {
        const text = transcript.value.trim();
        if (!text) { toast('Nothing to copy yet', 'warning'); return; }
        copyToClipboard(text, () => {
            addToHistory(text);
            saveUndo(transcript.value);
            clearTranscript();
            const btn = $('copyBtn');
            btn.classList.add('success');
            setTimeout(() => btn.classList.remove('success'), 1600);
            toast('Copied & cleared - Ctrl+Z to recover', 'success');
        });
    });

    topDownloadBtn?.addEventListener('click', (e) => {
        if (topDownloadBtn.classList.contains('is-disabled')) {
            e.stopPropagation();
            topDownloadDropdown?.classList.remove('open');
            topDownloadBtn.setAttribute('aria-expanded', 'false');
            toast('Nothing to download yet', 'warning');
            return;
        }
        e.stopPropagation();
        const nextOpen = !topDownloadDropdown?.classList.contains('open');
        topDownloadDropdown?.classList.toggle('open', nextOpen);
        topDownloadBtn.setAttribute('aria-expanded', String(!!nextOpen));
    });

    topDownloadMenu?.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    topDownloadDropdown?.addEventListener('click', (e) => {
        const btn = e.target.closest('.download-option');
        if (!btn) return;
        e.stopPropagation();
        topDownloadDropdown.classList.remove('open');
        topDownloadBtn.setAttribute('aria-expanded', 'false');
        downloadTranscriptFormat(btn.dataset.format);
    });

    exportCardButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (button.disabled) return;
            const format = button.dataset.format;
            const success = downloadTranscriptFormat(format);
            if (!success) return;
            const card = button.closest('.export-card');
            card?.classList.add('is-downloaded');
            button.textContent = 'Downloaded';
            setTimeout(() => {
                card?.classList.remove('is-downloaded');
                if (!button.disabled) button.textContent = 'Download';
            }, 1400);
        });
    });

    // Close dropdown on outside click
    document.addEventListener('click', () => {
        topDownloadDropdown?.classList.remove('open');
        topDownloadBtn?.setAttribute('aria-expanded', 'false');
    });

    // Clear button
    $('clearBtn').addEventListener('click', () => {
        const text = transcript.value.trim();
        if (!text && !state.segments.length) { toast('Already empty', 'info'); return; }
        saveUndo(transcript.value);
        clearTranscript();
        toast('Cleared - Ctrl+Z to recover', 'info');
    });

    // History button
    historyBtn.addEventListener('click', () => {
        setWorkspaceView('tools', { persist: true, closeMobile: false });
        const open = historyPanel.classList.toggle('visible');
        historyBtn.classList.toggle('open', open);
        if (open) renderHistory();
    });

    $('historyClearBtn').addEventListener('click', () => {
        state.copyHistory = [];
        sessionStorage.removeItem('vt_history');
        renderHistory();
        toast('History cleared', 'info');
    });

    // Transcript input
    transcript.addEventListener('input', () => {
        state.confirmedText = transcript.value;
        syncCaptureTranscript();
        updateStats();
        refreshExportCards();
        scheduleWorkspaceSave();
    });

    // â”€â”€â”€ API Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    apiHeader.addEventListener('click', () => {
        setApiPanelOpen(!apiPanel.classList.contains('open'));
    });
    helpBtn?.addEventListener('click', () => openHelpModal());
    helpCloseBtn?.addEventListener('click', () => closeHelpModal());
    helpModalOverlay?.addEventListener('click', (e) => {
        if (e.target === helpModalOverlay) closeHelpModal();
    });

    // Load saved values
    ensureMemoryPackStore();
    state.chatModel = remapDeprecatedGroqModel(state.chatModel);
    state.assistant.model = remapDeprecatedGroqModel(state.assistant.model);
    apiProvider.value = state.apiProvider;
    audioModelInput.value = state.audioModel || defaultAudioModel(state.apiProvider);
    chatModelInput.value = getActiveChatModel();
    syncChatModelSelectors();
    glossaryInput.value = state.glossaryRaw;
    presetSelect.value = state.preset;
    speakerModeToggle.classList.toggle('on', state.speakerMode);
    autosaveToggle.classList.toggle('on', state.autosaveEnabled);
    apiKeyVault.value = (state.providerKeys[state.apiProvider] || []).join('\n');
    if (geminiKeyInput) geminiKeyInput.value = state.providerKeys.gemini?.[0] || '';
    if (geminiKeyVault) geminiKeyVault.value = (state.providerKeys.gemini || []).join('\n');
    populateGeminiModelControls();
    updateVaultMeta();
    if (state.aiOutput) {
        state.aiOutput = extractFinalAiOutputText(state.aiOutput);
        aiOutput.value = state.aiOutput;
    }
    if (outputStyleSelect) outputStyleSelect.value = state.outputStyle || 'default';
    renderMemoryUi();
    setMemoryToolsOpen(false);
    const activeProviderPrimaryKey = state.providerKeys[state.apiProvider]?.[0] || state.apiKey || '';
    state.apiKey = activeProviderPrimaryKey;
    if (state.apiKey) {
        apiKeyInput.value = state.apiKey;
        apiStatusDot.className = 'api-status-dot connected';
        apiStatusLabel.textContent = 'Key saved';
        state.apiConnected = true;
    }
    syncApiKeyToggleButton();
    syncGeminiKeyToggleButton();

    apiProvider.addEventListener('change', () => {
        const previousProvider = state.apiProvider;
        state.apiProvider = apiProvider.value;
        localStorage.setItem('vt_provider', apiProvider.value);
        if (!state.audioModel || state.audioModel === defaultAudioModel('groq') || state.audioModel === defaultAudioModel('openai')) {
            state.audioModel = defaultAudioModel(state.apiProvider);
            audioModelInput.value = state.audioModel;
            localStorage.setItem('vt_audio_model', state.audioModel);
        }
        if (!state.chatModel || state.chatModel === defaultChatModel(previousProvider)) {
            setChatModel(defaultChatModel(state.apiProvider), { skipRender: true, skipSave: true });
        }
        chatModelInput.placeholder = state.apiProvider === 'groq'
            ? 'Groq recommendation: openai/gpt-oss-120b'
            : 'OpenAI recommendation: gpt-4o-mini';
        populateChatModelControls();
        state.apiKey = state.providerKeys[state.apiProvider]?.[0] || '';
        localStorage.setItem('vt_api_key', state.apiKey);
        apiKeyInput.value = state.apiKey;
        apiKeyVault.value = (state.providerKeys[state.apiProvider] || []).join('\n');
        updateVaultMeta();
        state.apiConnected = false;
        apiStatusDot.className = 'api-status-dot';
        apiStatusLabel.textContent = getProviderKeys().length ? 'Key saved - retest' : 'Not configured';
        renderAssistantMessages();
        updateTranscribeBtn();
        scheduleWorkspaceSave();
    });

    $('apiKeySave').addEventListener('click', () => {
        state.apiKey = apiKeyInput.value.trim();
        safeLocalStorageSet('vt_api_key', state.apiKey);
        const providerKeys = (state.providerKeys[state.apiProvider] || []).filter(Boolean).filter(key => key !== state.apiKey);
        state.providerKeys[state.apiProvider] = state.apiKey ? [state.apiKey, ...providerKeys] : providerKeys;
        persistProviderStore();
        apiKeyVault.value = (state.providerKeys[state.apiProvider] || []).join('\n');
        updateVaultMeta();
        if (state.apiKey) {
            apiStatusLabel.textContent = 'Key saved';
            apiStatusDot.className = 'api-status-dot connected';
            const btn = $('apiKeySave');
            btn.classList.add('saved');
            btn.textContent = 'Saved';
            setTimeout(() => { btn.classList.remove('saved'); btn.textContent = 'Save'; }, 1500);
        } else {
            apiStatusLabel.textContent = 'Not configured';
            apiStatusDot.className = 'api-status-dot';
        }
        updateTranscribeBtn();
        scheduleWorkspaceSave();
    });

    apiKeyToggleBtn.addEventListener('click', () => {
        apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
        syncApiKeyToggleButton();
    });

    $('apiKeyTest').addEventListener('click', testApiKey);
    $('apiKeysClear')?.addEventListener('click', clearSavedProviderKeys);

    geminiKeySaveBtn?.addEventListener('click', () => {
        const next = String(geminiKeyInput?.value || '').trim();
        const existing = (state.providerKeys.gemini || []).filter(Boolean).filter(key => key !== next);
        state.providerKeys.gemini = next ? [next, ...existing] : existing;
        persistProviderStore();
        if (geminiKeyInput) geminiKeyInput.value = state.providerKeys.gemini?.[0] || '';
        if (geminiKeyVault) geminiKeyVault.value = (state.providerKeys.gemini || []).join('\n');
        updateVaultMeta();
        if (geminiKeySaveBtn) {
            geminiKeySaveBtn.classList.add('saved');
            geminiKeySaveBtn.textContent = next ? 'Saved' : 'Cleared';
            setTimeout(() => { geminiKeySaveBtn.classList.remove('saved'); geminiKeySaveBtn.textContent = 'Save'; }, 1500);
        }
        toast(next ? 'Gemini key saved locally' : 'Gemini key cleared', 'success');
        renderAssistantComposer();
    });

    geminiKeyToggleBtn?.addEventListener('click', () => {
        geminiKeyInput.type = geminiKeyInput.type === 'password' ? 'text' : 'password';
        syncGeminiKeyToggleButton();
    });

    geminiKeyTestBtn?.addEventListener('click', testGeminiKey);

    geminiModelSelect?.addEventListener('change', () => {
        state.geminiAnalysisModel = geminiModelSelect.value || defaultGeminiAnalysisModel();
        localStorage.setItem('vt_gemini_analysis_model', state.geminiAnalysisModel);
        populateGeminiModelControls();
        renderAssistantComposer();
        toast(`Gemini analysis model set to ${state.geminiAnalysisModel}`, 'success');
    });

    geminiUsageResetBtn?.addEventListener('click', () => {
        resetGeminiUsage();
        toast('Gemini usage meter reset for this model', 'success');
    });

    geminiVaultSaveBtn?.addEventListener('click', () => {
        const lines = (geminiKeyVault?.value || '').split(/\n+/).map(v => v.trim()).filter(Boolean);
        state.providerKeys.gemini = [...new Set(lines)];
        persistProviderStore();
        if (geminiKeyInput) geminiKeyInput.value = state.providerKeys.gemini?.[0] || '';
        if (geminiKeyVault) geminiKeyVault.value = (state.providerKeys.gemini || []).join('\n');
        updateVaultMeta();
        toast('Gemini key vault saved locally', 'success');
        renderAssistantComposer();
    });

    $('apiVaultSave').addEventListener('click', () => {
        const lines = (apiKeyVault.value || '').split(/\n+/).map(v => v.trim()).filter(Boolean);
        state.providerKeys[state.apiProvider] = [...new Set(lines)];
        persistProviderStore();
        updateVaultMeta();
        updateTranscribeBtn();
        toast('Key vault saved locally', 'success');
    });

    audioModelInput.addEventListener('input', () => {
        state.audioModel = audioModelInput.value.trim();
        localStorage.setItem('vt_audio_model', state.audioModel);
        scheduleWorkspaceSave();
    });

    chatModelInput.addEventListener('input', () => {
        setChatModel(chatModelInput.value);
    });

    chatModelSelect?.addEventListener('change', () => {
        if (chatModelSelect.value === '__custom__') {
            chatModelInput.focus();
            chatModelInput.select();
            syncChatModelSelectors();
            return;
        }
        setChatModel(chatModelSelect.value);
    });

    assistantModelSelect?.addEventListener('change', () => {
        setAssistantModel(assistantModelSelect.value);
    });

    memoryInput?.addEventListener('input', () => {
        const draft = normalizeImportedMemory(memoryInput.value || '');
        if (memoryMeta) {
            memoryMeta.textContent = draft
                ? `Ready to import ${draft.length.toLocaleString()} characters. Once saved, AI Output and Verba Assistant will start using it.`
                : 'No imported memory yet. Once saved, it will ground summaries, action items, prompt packs, AI clean, and assistant replies.';
        }
    });

    memoryPackSelect?.addEventListener('change', () => {
        setActiveMemoryPack(memoryPackSelect.value);
    });

    createMemoryPackBtn?.addEventListener('click', () => {
        createMemoryPack(memoryPackNameInput?.value || '');
    });

    deleteMemoryPackBtn?.addEventListener('click', () => {
        deleteActiveMemoryPack();
    });

    copyMemoryPromptBtn?.addEventListener('click', () => {
        copyToClipboard(MEMORY_IMPORT_PROMPT, () => toast('Memory prompt copied', 'success'));
    });

    importMemoryBtn?.addEventListener('click', () => {
        const raw = memoryInput?.value || '';
        const normalized = normalizeImportedMemory(raw);
        if (!normalized) {
            toast('Paste exported memory before importing', 'warning');
            return;
        }
        setImportedMemory(normalized);
    });

    clearMemoryBtn?.addEventListener('click', () => {
        if (!state.memoryRaw && !(memoryInput?.value || '').trim()) {
            toast('No memory to clear', 'info');
            return;
        }
        if (memoryInput) memoryInput.value = '';
        setImportedMemory('', { announce: true });
    });

    memoryToolsToggle?.addEventListener('click', () => {
        const open = memoryToolsToggle.getAttribute('aria-expanded') === 'true';
        setMemoryToolsOpen(!open);
    });

    outputStyleSelect?.addEventListener('change', () => {
        state.outputStyle = outputStyleSelect.value || 'default';
        localStorage.setItem('vt_output_style', state.outputStyle);
        renderMemoryUi();
        renderAssistantMessages();
        scheduleWorkspaceSave();
        toast(`Output style: ${outputStyleSelect.selectedOptions?.[0]?.textContent || 'Default'}`, 'info');
    });

    askTranscriptInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (state.aiBusy) return;
            askTranscriptQuestion(askTranscriptInput.value, { button: askTranscriptBtn });
        }
    });

    askTranscriptBtn?.addEventListener('click', () => {
        if (state.aiBusy) return;
        askTranscriptQuestion(askTranscriptInput?.value || '', { button: askTranscriptBtn });
    });

    glossaryInput.addEventListener('input', () => {
        state.glossaryRaw = glossaryInput.value;
        localStorage.setItem('vt_glossary', state.glossaryRaw);
        scheduleWorkspaceSave();
    });

    // â”€â”€â”€ File Upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    ['dragover', 'dragenter'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, () => {
            dropZone.classList.remove('drag-over');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) handleFileSelect(fileInput.files[0]);
    });

    function handleFileSelect(file) {
        // Validate
        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
            toast('File too large - max 500MB', 'error');
            return;
        }

        const mediaTypes = ['audio/', 'video/'];
        const isMedia = mediaTypes.some(t => file.type.startsWith(t)) || /\.(mp3|wav|m4a|flac|ogg|webm|mp4|aac|wma|opus|mov|mkv|avi|amr|3gp)$/i.test(file.name);
        if (!isMedia) {
            toast('Please upload a supported audio or video file', 'error');
            return;
        }

        state.uploadedFile = file;
        if (state.uploadedFileUrl) URL.revokeObjectURL(state.uploadedFileUrl);
        state.fileHash = '';
        state.cacheKey = '';

        // Show file info
        fileName.textContent = file.name;
        fileMeta.innerHTML = `<span>${formatFileSize(file.size)}</span>`;

        // Set audio player
        const url = URL.createObjectURL(file);
        state.uploadedFileUrl = url;
        fileAudioPlayer.src = url;
        if (transcriptHeaderMedia) transcriptHeaderMedia.hidden = false;
        fileAudioPlayer.onloadedmetadata = () => {
            const dur = fileAudioPlayer.duration;
            fileMeta.innerHTML += `<span>${fmtTime(dur * 1000)}</span>`;
        };

        dropZone.style.display = 'none';
        fileInfo.classList.add('visible');
        audioAnalysisEl.classList.remove('visible');
        refreshTopDownloadAction();
        setCacheStatus('Ready for new file');
        updateTranscribeBtn();
        scheduleWorkspaceSave();
    }

    $('fileRemoveBtn').addEventListener('click', () => {
        state.uploadedFile = null;
        state.uploadedAudioBuffer = null;
        if (state.uploadedFileUrl) URL.revokeObjectURL(state.uploadedFileUrl);
        state.uploadedFileUrl = '';
        state.audioAnalysis = null;
        state.fileHash = '';
        state.cacheKey = '';
        fileInput.value = '';
        fileAudioPlayer.src = '';
        if (transcriptHeaderMedia) transcriptHeaderMedia.hidden = true;
        fileInfo.classList.remove('visible');
        audioAnalysisEl.classList.remove('visible');
        dropZone.style.display = '';
        refreshTopDownloadAction();
        updateTranscribeBtn();
    });

    transcribeBtn.addEventListener('click', processUploadedFile);

    progressCancel.addEventListener('click', () => {
        if (state.abortController) {
            state.abortController.abort();
        }
    });

    presetSelect.addEventListener('change', () => {
        state.preset = presetSelect.value;
        localStorage.setItem('vt_preset', state.preset);
        const preset = state.preset;
        if (preset === 'dictation') {
            state.smartPunctEnabled = true;
            state.autoCopyEnabled = true;
            state.speakerMode = false;
        } else if (preset === 'meeting') {
            state.smartPunctEnabled = true;
            state.autoCopyEnabled = false;
            state.speakerMode = true;
        } else if (preset === 'subtitle') {
            state.smartPunctEnabled = true;
            state.autoCopyEnabled = false;
            state.speakerMode = false;
            setMode('file');
        } else if (preset === 'interview') {
            state.smartPunctEnabled = true;
            state.autoCopyEnabled = false;
            state.speakerMode = true;
        } else if (preset === 'voice-notes') {
            state.smartPunctEnabled = true;
            state.autoCopyEnabled = true;
            state.speakerMode = false;
        }
        punctBtn.classList.toggle('on', state.smartPunctEnabled);
        autoCopyBtn.classList.toggle('on', state.autoCopyEnabled);
        speakerModeToggle.classList.toggle('on', state.speakerMode);
        rebuildTranscriptFromSegments();
        scheduleWorkspaceSave();
        toast(`Preset applied: ${preset}`, 'success');
        updateDiagnostics({ preset });
    });

    speakerModeToggle.addEventListener('click', () => {
        state.speakerMode = !state.speakerMode;
        localStorage.setItem('vt_speaker_mode', state.speakerMode ? '1' : '0');
        speakerModeToggle.classList.toggle('on', state.speakerMode);
        rebuildTranscriptFromSegments(true);
    });

    autosaveToggle.addEventListener('click', () => {
        state.autosaveEnabled = !state.autosaveEnabled;
        safeLocalStorageSet('vt_autosave', state.autosaveEnabled ? '1' : '0');
        autosaveToggle.classList.toggle('on', state.autosaveEnabled);
        if (state.autosaveEnabled) writeWorkspaceToStorage();
        toast(state.autosaveEnabled ? 'Workspace autosave enabled' : 'Workspace autosave disabled', 'info');
    });

    liveTranslateToggle?.addEventListener('click', () => {
        state.translation.enabled = !state.translation.enabled;
        state.translation.lastError = '';
        persistTranslationSettings();
        renderTranslationUi();
        scheduleWorkspaceSave();
        if (state.translation.enabled && !getProviderKeys().length) {
            state.translation.lastError = 'Translation needs an API key';
            renderTranslationUi();
            toast('Add an API key to translate live segments', 'warning', 3200);
            return;
        }
        if (!state.translation.enabled) {
            clearTranslationQueue();
            toast('Live Translate disabled', 'info');
            return;
        }
        toast(`Live Translate enabled for ${translationTargetLabelFor(state.translation.targetLanguage)}`, 'success');
        queueTranslationBackfill({ immediate: true });
    });

    translationTargetSelect?.addEventListener('change', () => {
        const next = translationTargetSelect.value || 'en';
        if (next === state.translation.targetLanguage) return;
        state.translation.targetLanguage = next;
        state.translation.lastError = '';
        state.translation.segmentResults = {};
        state.translation.stats = createEmptyTranslationStats();
        persistTranslationSettings();
        renderTranslationUi();
        scheduleWorkspaceSave();
        if (state.translation.enabled) {
            toast(`Translation target: ${translationTargetLabelFor(next)}`, 'info');
            queueTranslationBackfill({ immediate: true });
        }
        syncAiOutputTranslateUi();
    });

    rebuildTranscriptBtn.addEventListener('click', () => rebuildTranscriptFromSegments(true));

    $('diagToggleBtn').addEventListener('click', () => {
        diagnosticsPanel.classList.toggle('visible');
    });

    $('applyGlossaryBtn').addEventListener('click', () => {
        state.segments = state.segments.map((seg, idx) => normalizeSegment({ ...seg, text: applyGlossaryToText(seg.text) }, idx));
        transcript.value = cleanTranscriptLocal(transcript.value);
        state.confirmedText = transcript.value;
        renderSegments();
        rebuildTranscriptFromSegments();
        queueTranslationBackfill({ immediate: true });
        toast('Glossary applied', 'success');
    });

    $('cleanLocalBtn').addEventListener('click', () => {
        transcript.value = cleanTranscriptLocal(transcript.value);
        state.confirmedText = transcript.value;
        updateStats();
        scheduleWorkspaceSave();
        toast('Transcript cleaned locally', 'success');
    });

    $('redactBtn').addEventListener('click', () => {
        transcript.value = redactSensitiveText(transcript.value);
        aiOutput.value = redactSensitiveText(aiOutput.value);
        state.segments = state.segments.map((seg, idx) => normalizeSegment({ ...seg, text: redactSensitiveText(seg.text) }, idx));
        renderSegments();
        rebuildTranscriptFromSegments();
        queueTranslationBackfill({ immediate: true });
        toast('Sensitive patterns redacted', 'success');
    });

    $('saveWorkspaceBtn').addEventListener('click', () => {
        writeWorkspaceToStorage();
        toast('Workspace saved locally', 'success');
    });

    $('exportWorkspaceBtn').addEventListener('click', () => {
        const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        downloadFile(generateWorkspaceJSON(), `workspace-${ts}.json`, 'application/json;charset=utf-8');
        toast('Workspace exported', 'success');
    });

    $('importWorkspaceBtn').addEventListener('click', () => workspaceFileInput.click());
    workspaceFileInput.addEventListener('change', async () => {
        const file = workspaceFileInput.files[0];
        if (!file) return;
        try {
            const parsed = parseWorkspacePayload(await file.text(), { maxBytes: DEFAULT_MAX_WORKSPACE_BYTES });
            safeLocalStorageSet(WORKSPACE_STORAGE_KEY, JSON.stringify(parsed));
            restoreWorkspaceIfAny();
            toast('Workspace imported', 'success');
        } catch (err) {
            const message = err instanceof WorkspaceValidationError ? err.message : (err.message || 'Invalid workspace JSON');
            workspaceStatus.textContent = 'Workspace import rejected';
            updateDiagnostics({ workspaceImport: 'rejected' }, `Workspace import rejected: ${message}`);
            toast('Workspace import rejected: ' + message, 'error');
        } finally {
            workspaceFileInput.value = '';
        }
    });

    $('clearCacheBtn').addEventListener('click', () => {
        Object.keys(localStorage).filter(k => k.startsWith('vt_tc::')).forEach(k => localStorage.removeItem(k));
        Object.keys(localStorage).filter(k => k.startsWith('vt_tr::')).forEach(k => localStorage.removeItem(k));
        Object.keys(localStorage).filter(k => k.includes('::partial')).forEach(k => localStorage.removeItem(k));
        setCacheStatus('Transcript and translation caches cleared');
        toast('Transcript and translation caches cleared', 'info');
    });

    function buildPromptPackTask() {
        const preset = state.preset || 'dictation';
        const taskMap = {
            prompt: {
                doneMessage: 'Prompt pack ready',
                system: 'You convert rough spoken notes into a strong prompt for a reasoning model. Optimize for clarity, constraints, deliverables, and production-grade output.',
                user: 'Convert this transcript into a paste-ready prompt for ChatGPT/Claude. Include: Goal, Context, Constraints, Required Output, Non-negotiables, and the raw notes at the end.'
            },
            build: {
                doneMessage: 'Build spec ready',
                system: 'You turn spoken engineering notes into a production-grade build specification.',
                user: 'Convert this transcript into a structured BUILD brief with sections: Goal, Scope, Architecture, Ownership Boundaries, Data Contracts, Scaling Risks, Rate Limit Risks, Minimal Build, Production Build, and Final Implementation Notes.'
            },
            debug: {
                doneMessage: 'Debug report ready',
                system: 'You turn spoken debugging notes into a root-cause-first engineering report.',
                user: 'Convert this transcript into a DEBUG report with sections: System Summary, Failure Location, Root Cause, Immediate Fix, Structural Fix, Production-safe Fix, and Validation Steps.'
            },
            docs: {
                doneMessage: 'Docs notes ready',
                system: 'You convert spoken notes into clean operational documentation.',
                user: 'Convert this transcript into documentation-ready notes with sections: Objective, Scope, Assumptions, Steps, Validation, Risks, and Handoff Notes.'
            }
        };
        const fallback = {
            doneMessage: 'Prompt pack ready',
            system: 'You convert rough spoken notes into a strong prompt for a reasoning model. Optimize for clarity, constraints, deliverables, and production-grade output.',
            user: 'Convert this transcript into a paste-ready prompt for ChatGPT/Claude. Include: Goal, Context, Constraints, Required Output, Non-negotiables, and the raw notes at the end.'
        };
        const cfg = taskMap[preset] || fallback;
        return { name: `prompt-pack-${preset}`, ...cfg };
    }

    const aiTasks = {
        clean: {
            name: 'ai-clean',
            doneMessage: 'AI clean complete',
            system: 'You clean transcripts for final use. Preserve meaning, keep technical terms exact, and improve readability.',
            user: 'Rewrite this transcript into a clean, readable version. Keep it faithful. Preserve domain terms and important details.'
        },
        summary: {
            name: 'summary',
            doneMessage: 'Summary ready',
            system: 'You summarize spoken transcripts into operational notes. Keep it concise and structured.',
            user: 'Create a crisp summary with sections: Overview, Key Points, Risks, Open Questions.'
        },
        actions: {
            name: 'action-items',
            doneMessage: 'Action items ready',
            system: 'You extract execution-oriented action items from transcripts. Be precise and concrete.',
            user: 'Extract action items, decisions, next steps, and owners if mentioned. Use bullet points.'
        }
    };

    $('cleanAiBtn').addEventListener('click', () => callChatModel(aiTasks.clean, transcript.value, { button: $('cleanAiBtn') }));
    $('summaryBtn').addEventListener('click', () => callChatModel(aiTasks.summary, transcript.value, { button: $('summaryBtn') }));
    $('actionItemsBtn').addEventListener('click', () => callChatModel(aiTasks.actions, transcript.value, { button: $('actionItemsBtn') }));
    $('promptPackBtn').addEventListener('click', () => callChatModel(buildPromptPackTask(), transcript.value, { button: $('promptPackBtn') }));
    translateAiOutputBtn?.addEventListener('click', () => translateAiOutputToTarget({ button: translateAiOutputBtn }));

    $('copyAiOutputBtn').addEventListener('click', () => {
        const text = aiOutput.value.trim();
        if (!text) { toast('No AI output yet', 'warning'); return; }
        copyToClipboard(text, () => toast('AI output copied', 'success'));
    });

    $('clearAiOutputBtn').addEventListener('click', () => {
        aiOutput.value = '';
        sessionStorage.setItem('vt_ai_output', '');
        scheduleWorkspaceSave();
    });

    const handleSidebarToggle = (forceMobileOpen = null) => {
        try {
            if (isCompactSidebarViewport()) {
                if (typeof forceMobileOpen === 'boolean') setSidebarMobileOpen(forceMobileOpen);
                else setSidebarMobileOpen(!state.sidebarMobileOpen);
                return;
            }
            setSidebarCollapsed(!state.sidebarCollapsed);
        } catch (err) {
            console.warn('Sidebar toggle failed', err);
        }
    };

    workspaceSidebarBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSidebarToggle();
    });
    topbarControlsBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setTopbarMobileDrawerOpen(!topbarMobileDrawer?.classList.contains('open'));
    });
    workspaceSidebarFab?.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSidebarToggle(true);
    });
    workspaceSidebarCloseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSidebarToggle(false);
    });
    workspaceSidebarCollapseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSidebarToggle(isCompactSidebarViewport() ? false : null);
    });
    workspaceSidebarBackdrop?.addEventListener('click', () => setSidebarMobileOpen(false));
    document.addEventListener('click', (e) => {
        if (!isCompactSidebarViewport() || !topbarMobileDrawer?.classList.contains('open')) return;
        if (topbarMobileDrawer.contains(e.target) || topbarControlsBtn?.contains(e.target)) return;
        setTopbarMobileDrawerOpen(false);
    });
    sidebarCollapseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSidebarToggle();
    });
    sidebarResetBtn?.addEventListener('click', () => setSidebarWidth(280));
    sidebarWidthRange?.addEventListener('input', (e) => setSidebarWidth(e.target.value));
    workspaceNavButtons.forEach((btn) => btn.addEventListener('click', () => navigateToWorkspaceView(btn.dataset.view || 'transcript')));

    function syncAiOutputExpandUi() {
        const expanded = aiOutput?.classList.contains('is-expanded');
        if (expandAiOutputBtn) {
            expandAiOutputBtn.textContent = expanded ? 'Collapse' : 'Expand';
            expandAiOutputBtn.setAttribute('aria-pressed', expanded ? 'true' : 'false');
        }
    }

    function syncAiOutputTranslateUi() {
        if (!translateAiOutputBtn) return;
        const targetCode = translationTargetSelect?.value || 'en';
        translateAiOutputBtn.textContent = `Translate to ${translationTargetLabelFor(targetCode)}`;
    }

    async function translateAiOutputToTarget({ button } = {}) {
        const sourceText = String(aiOutput?.value || '').trim();
        if (!sourceText) { toast('AI output is empty', 'warning'); return; }
        if (!getProviderKeys().length) { toast('API key required', 'warning'); return; }
        const targetCode = translationTargetSelect?.value || normalizeLanguageCode(state.detectedLanguage || getWhisperLang() || '') || 'en';
        const targetLabel = translationTargetLabelFor(targetCode);
        const model = getCorrectionModel();
        if (button) button.disabled = true;
        state.aiBusy = true;
        try {
            const result = await providerRequest({
                url: getChatEndpoint(),
                responseType: 'json',
                purpose: 'translate-ai-output',
                buildBody: () => JSON.stringify({
                    model,
                    temperature: 0.1,
                    messages: [
                        {
                            role: 'system',
                            content: [
                                `Translate the text into ${targetLabel}.`,
                                'Preserve meaning exactly.',
                                'Keep names, numbers, product names, and technical terms unchanged where appropriate.',
                                'Do not summarize, explain, or add notes.',
                                'Return only the translated final text.'
                            ].join('\n')
                        },
                        {
                            role: 'user',
                            content: sourceText
                        }
                    ]
                }),
                maxRetries: 2
            });
            const out = extractFinalAiOutputText(result?.choices?.[0]?.message?.content || '');
            aiOutput.value = out.trim();
            state.aiOutput = aiOutput.value;
            sessionStorage.setItem('vt_ai_output', state.aiOutput);
            toast(`AI output translated to ${targetLabel}`, 'success');
            scheduleWorkspaceSave();
            updateDiagnostics({ chatModel: model, aiOutputTarget: targetCode }, 'AI output translated');
        } catch (err) {
            toast(err.message || 'AI output translation failed', 'error');
        } finally {
            state.aiBusy = false;
            if (button) button.disabled = false;
        }
    }

    aiOutput.addEventListener('input', () => {
        sessionStorage.setItem('vt_ai_output', aiOutput.value);
        scheduleWorkspaceSave();
    });

    expandAiOutputBtn?.addEventListener('click', () => {
        aiOutput?.classList.toggle('is-expanded');
        syncAiOutputExpandUi();
    });
    syncAiOutputExpandUi();
    syncAiOutputTranslateUi();

    captureSourceSelect?.addEventListener('change', () => {
        setCaptureSource(captureSourceSelect.value);
        if (!state.isRecording) updateCaptureOrbStatus();
    });

    captureHelpToggle?.addEventListener('click', () => {
        setCaptureHelpOpen(!state.captureHelpOpen);
        renderCaptureUi();
    });

    shortcutsToggle?.addEventListener('click', () => {
        const open = shortcutsToggle.getAttribute('aria-expanded') === 'true';
        setShortcutsOpen(!open);
    });

    aiOutputToggle?.addEventListener('click', () => {
        const open = aiOutputToggle.getAttribute('aria-expanded') === 'true';
        setAiOutputOpen(!open);
    });

    function updateDiagnostics(patch = {}, logLine = '') {
        state.diagnostics = {
            ...(state.diagnostics || {}),
            browserFamily: runtimeCapabilities.browserFamily,
            platformFamily: runtimeCapabilities.platformFamily,
            captureSource: state.captureSource,
            captureMode: state.mode,
            hasDisplayMedia: runtimeCapabilities.hasDisplayMedia,
            recorderMimeType: state.recorderMimeType || 'auto',
            liveRecognitionAvailable: runtimeCapabilities.hasSpeechRecognition,
            qualityCaptureAvailable: runtimeCapabilities.supportsMicQuality,
            isSecureContext: runtimeCapabilities.isSecureContext,
            translationEnabled: !!state.translation.enabled,
            translationTarget: state.translation.targetLanguage || 'en',
            translationBusy: !!state.translation.isProcessing,
            ...(patch || {}),
            updatedAt: new Date().toISOString()
        };
        sessionStorage.setItem('vt_diag', JSON.stringify(state.diagnostics));
        const entries = [
            ['Browser', state.diagnostics.browserFamily || runtimeCapabilities.browserFamily],
            ['Platform', state.diagnostics.platformFamily || runtimeCapabilities.platformFamily],
            ['Capture source', state.diagnostics.captureSource || state.captureSource || 'mic'],
            ['Capture mode', state.diagnostics.captureMode || state.mode || 'realtime'],
            ['Live ready', state.diagnostics.liveRecognitionAvailable ? 'YES' : 'NO'],
            ['Quality ready', state.diagnostics.qualityCaptureAvailable ? 'YES' : 'NO'],
            ['Display capture', state.diagnostics.hasDisplayMedia ? 'YES' : 'NO'],
            ['Recorder mime', state.diagnostics.recorderMimeType || 'auto'],
            ['Provider', state.diagnostics.provider || state.apiProvider || 'UNKNOWN'],
            ['Audio model', state.diagnostics.audioModel || getApiModel() || 'UNKNOWN'],
            ['Audio task', state.diagnostics.audioTask || 'transcribe'],
            ['Chat model', state.diagnostics.chatModel || getActiveChatModel() || 'UNKNOWN'],
            ['Preset', state.diagnostics.preset || state.preset || 'UNKNOWN'],
            ['Detected lang', state.detectedLanguage || state.diagnostics.detectedLanguage || 'UNKNOWN'],
            ['Translate', state.diagnostics.translationEnabled ? `ON -> ${translationTargetLabelFor(state.diagnostics.translationTarget || 'en')}` : 'OFF'],
            ['Translate busy', state.diagnostics.translationBusy ? 'YES' : 'NO'],
            ['Multilingual repair', state.diagnostics.multilingualRepairApplied ? `YES (${state.diagnostics.multilingualRepairSegments || 0})` : (state.diagnostics.multilingualRepair || 'NO')],
            ['Language spread', state.diagnostics.multilingualLanguageSpread || 'unknown'],
            ['Segments', String(state.segments?.length || 0)],
            ['Duration', state.audioDurationSec ? `${state.audioDurationSec.toFixed(1)}s` : 'UNKNOWN'],
            ['Retries', String(state.diagnostics.retries || 0)],
            ['Cache', state.diagnostics.cacheHit ? 'HIT' : (state.diagnostics.cacheKey ? 'READY' : 'MISS')],
            ['File hash', state.fileHash || state.diagnostics.fileHash || 'UNKNOWN']
        ];
        diagGrid.innerHTML = entries.map(([label, value]) => `<div class="diag-card"><div class="diag-label">${escapeHtml(label)}</div><div class="diag-value">${escapeHtml(String(value))}</div></div>`).join('');
        if (logLine) {
            const ts = new Date().toLocaleTimeString();
            diagLog.value = `[${ts}] ${logLine}\n` + (diagLog.value || '');
        }
    }

    function setStatus(main, sub) {
        statusMain.textContent = normalizeUiText(main);
        statusSub.textContent = normalizeUiText(sub);
        if (orbStatusMain) orbStatusMain.textContent = normalizeUiText(main);
    }

    function clearNoSpeechTimer() {
        clearTimeout(state.noSpeechTimer);
        if (state.isRecording) {
            const active = getActiveStatusForCurrentState();
            statusSub.textContent = active.sub;
        }
    }

    function startQualityRecording() {
        if (!canUseQualityMode()) {
            state.captureHelpOpen = true;
            renderCaptureUi();
            toast('This capture source is not available in this browser. Open Capture Help for the fallback path.', 'warning', 4200);
            return;
        }
        acquireCaptureStream(state.captureSource).then(stream => {
            state.recordedChunks = [];
            state.recorderMimeType = pickRecorderMimeType();
            const options = state.recorderMimeType ? { mimeType: state.recorderMimeType } : {};
            state.mediaRecorder = new MediaRecorder(stream, options);
            updateDiagnostics({
                captureSource: state.captureSource,
                captureMode: 'quality',
                recorderMimeType: state.recorderMimeType || 'default'
            }, `Quality capture ready via ${state.captureSource}`);

            state.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) state.recordedChunks.push(e.data);
            };

            state.mediaRecorder.onstop = async () => {
                const outputType = state.mediaRecorder?.mimeType || state.recorderMimeType || 'audio/webm';
                const blob = new Blob(state.recordedChunks, { type: outputType });
                stopActiveCaptureTracks();

                if (!getProviderKeys().length) {
                    toast('API key required for Quality mode transcription', 'warning');
                    interimEl.textContent = 'Interim transcription appears here as you speak...';
                    interimEl.classList.add('idle-hint');
                    updateCaptureInterim('');
                    setCaptureOrbActive(false);
                    const ready = getReadyStatusForCurrentState();
                    setStatus(ready.main, ready.sub);
                    return;
                }

                setStatus('Processing recording...', 'Sending captured audio to speech-to-text');
                interimEl.textContent = 'Transcribing your recording...';
                interimEl.classList.remove('idle-hint');
                updateCaptureInterim('Transcribing your recording...');
                setCaptureOrbActive(false);

                try {
                    const arrayBuf = await blob.arrayBuffer();
                    const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
                    let decoded;
                    try {
                        decoded = await tempCtx.decodeAudioData(arrayBuf);
                    } finally {
                        Promise.resolve(tempCtx.close()).catch(() => { });
                    }
                    const analysis = analyzeAudio(decoded);
                    const processed = await processAudioBuffer(decoded, analysis, true);
                    const resampled = await resampleTo16k(processed);
                    const maxChunkBytes = 24 * 1024 * 1024;
                    const chunks = chunkWavBlob(resampled, maxChunkBytes);
                    const wLang = getWhisperLang();
                    const result = await transcribeBlobThroughPipeline(blob, { language: wLang, normalize: true });
                    displayFileResult(result);
                    if (result.language) syncDetectedLanguage(result.language, { announceMismatch: true });
                    toast(`Transcribed - ${result.text.split(/\s+/).length} words`, 'success');
                    scheduleWorkspaceSave();
                } catch (err) {
                    const message = /decode|encoding|format/i.test(String(err?.message || ''))
                        ? 'Recorder format could not be decoded here. Try File mode or Chrome or Edge for meeting capture.'
                        : `Transcription error: ${err.message}`;
                    toast(message, 'error', 4200);
                }

                interimEl.textContent = 'Interim transcription appears here as you speak...';
                interimEl.classList.add('idle-hint');
                updateCaptureInterim('');
                orbTrigger?.setAttribute('aria-pressed', 'false');
                const ready = getReadyStatusForCurrentState();
                setStatus(ready.main, ready.sub);
                updateDiagnostics({ captureSource: state.captureSource, captureMode: state.mode }, 'Quality capture finished');
            };

            state.mediaRecorder.start(1000);
            state.isRecording = true;
            recPanel.classList.add('recording');
            micOuter?.classList.add('recording');
            setCaptureOrbActive(true);
            orbTrigger?.setAttribute('aria-pressed', 'true');
            const active = getActiveStatusForCurrentState('quality', state.captureSource);
            setStatus(active.main, active.sub);
            interimEl.textContent = state.captureSource === 'mic'
                ? 'Recording audio for quality transcription...'
                : `Recording ${getCaptureSourceLabel(state.captureSource).toLowerCase()} for transcription...`;
            interimEl.classList.remove('idle-hint');
            updateCaptureInterim(interimEl.textContent);
            startTimer();
            startAudioVisualizer(stream);
        }).catch(err => {
            state.captureHelpOpen = true;
            renderCaptureUi();
            toast(err.message || 'Recording could not start', 'error', 4200);
        });
    }

    function stopQualityRecording() {
        if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
            state.mediaRecorder.stop();
        }
        state.isRecording = false;
        recPanel.classList.remove('recording');
        micOuter?.classList.remove('recording');
        setCaptureOrbActive(false);
        orbTrigger?.setAttribute('aria-pressed', 'false');
        updateCaptureInterim('');
        stopTimer();
        stopAudio();
    }

    function setMode(mode, options = {}) {
        if (state.isRecording) forceStop();
        let nextMode = mode;
        if (nextMode === 'realtime' && state.captureSource !== 'mic') {
            setCaptureSource('mic', { silent: true, keepHelp: false });
            if (!options.silent) {
                toast('Switched capture source to Microphone for Live mode.', 'info', 3200);
            }
        }
        if (nextMode === 'realtime' && !canUseLiveMode()) {
            if (!options.silent) {
                toast('Live mode is limited in this browser. Switched to Quality.', 'warning', 3600);
            }
            nextMode = canUseQualityMode('mic') ? 'quality' : 'file';
        }
        if (nextMode === 'quality' && state.captureSource !== 'external-help' && !canUseQualityMode()) {
            if (!options.silent) toast('Quality capture is limited here. Switched to File mode.', 'warning', 3600);
            nextMode = 'file';
        }
        state.mode = nextMode;

        document.querySelectorAll('.mode-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === nextMode);
        });
        syncInteractiveChrome();

        uploadPanel.classList.toggle('visible', nextMode === 'file');
        recPanel.style.display = nextMode === 'file' ? 'none' : '';
        if (nextMode !== 'file') requestAnimationFrame(() => drawOrbFrame(0, false));

        renderCaptureUi();
        const ready = getReadyStatusForCurrentState(nextMode, state.captureSource);
        if (nextMode === 'file') {
            setStatus('File mode', 'Upload an audio file to transcribe');
            waveOverlay.textContent = 'Orb preview pauses in file mode';
        } else {
            setStatus(ready.main, ready.sub);
            waveOverlay.textContent = ready.sub;
        }
        updateDiagnostics({ captureMode: state.mode }, `Mode set to ${state.mode}`);
        syncStatusBar();
    }

    function startRecording() {
        if (state.mode === 'file') return;
        if (state.captureSource === 'external-help') {
            state.captureHelpOpen = true;
            renderCaptureUi();
            toast('Open Capture Help to choose the right recording setup for this device.', 'info', 3800);
            return;
        }
        if (state.mode === 'realtime' && state.captureSource !== 'mic') {
            toast('Live mode only works with the microphone. Switched to Quality.', 'warning', 3600);
            setMode('quality', { silent: true });
            startQualityRecording();
            return;
        }
        if (state.mode === 'quality') {
            if (!state.apiKey) {
                toast('API key required for Quality mode', 'warning');
                setApiPanelOpen(true);
                return;
            }
            startQualityRecording();
            return;
        }
        if (!canUseLiveMode()) {
            toast('Live mode is limited in this browser. Use Quality or File mode instead.', 'warning', 4200);
            setMode(canUseQualityMode('mic') ? 'quality' : 'file', { silent: true });
            return;
        }
        if (!recognition) {
            toast('Speech recognition is not available in this browser', 'error');
            return;
        }
        if (!ensureSecureContextForCapture()) return;
        const lang = getLiveRecognitionLang();
        recognition.lang = lang || 'en-IN';
        state.liveHealth = {
            score: 1,
            consecutiveRestarts: 0,
            consecutiveErrors: 0,
            noSpeechEvents: 0,
            networkEvents: 0,
            fallbackUses: state.liveHealth.fallbackUses || 0,
            activeLanguage: langSelect.value || 'auto',
            mode: 'live',
            lastReason: '',
            lastUpdatedAt: Date.now()
        };
        recognition.start();
        state.isRecording = true;
        recPanel.classList.add('recording');
        micOuter?.classList.add('recording');
        setCaptureOrbActive(true);
        orbTrigger?.setAttribute('aria-pressed', 'true');
        const active = getActiveStatusForCurrentState('realtime', 'mic');
        setStatus(active.main, active.sub);
        interimEl.classList.remove('idle-hint');
        interimEl.textContent = '';
        updateCaptureInterim('');
        startTimer();
        startAudioFromMic();
        startRealtimeAudioBuffer().catch(() => {
            markLiveHealth(-0.05, 'Live backup audio buffer unavailable', 'live');
        });
        setNoSpeechTimer();
        updateStats();
        updateDiagnostics({ captureSource: 'mic', captureMode: 'realtime' }, 'Live microphone recording started');
    }

    function stopRecording() {
        if (state.mode === 'quality') {
            stopQualityRecording();
            return;
        }
        commitPendingRealtimeInterim();
        state.isRecording = false;
        state.manualStop = true;
        clearNoSpeechTimer();
        clearAutoCopyCountdown();
        autoCopyBtn.classList.remove('auto-copy-active');
        clearTimeout(state.restartTimeout);
        state.restartTimeout = null;
        try {
            if (recognition && typeof recognition.stop === 'function') recognition.stop();
            else if (recognition) recognition.abort();
        } catch (e) {
            try { if (recognition) recognition.abort(); } catch (e2) { }
        }
        recPanel.classList.remove('recording');
        micOuter?.classList.remove('recording');
        setCaptureOrbActive(false);
        orbTrigger?.setAttribute('aria-pressed', 'false');
        interimEl.textContent = 'Interim transcription appears here as you speak...';
        interimEl.classList.add('idle-hint');
        updateCaptureInterim('');
        const ready = getReadyStatusForCurrentState();
        setStatus(ready.main, ready.sub);
        stopTimer();
        stopAudio();
        stopRealtimeAudioBuffer(true).catch(() => { });
        scheduleWorkspaceSave();
    }

    function forceStop() {
        state.isRecording = false;
        clearNoSpeechTimer();
        clearAutoCopyCountdown();
        autoCopyBtn.classList.remove('auto-copy-active');
        clearTimeout(state.restartTimeout);
        state.restartTimeout = null;
        try { if (recognition) recognition.abort(); } catch (e) { }
        if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
            try { state.mediaRecorder.stop(); } catch (e) { }
        }
        recPanel.classList.remove('recording');
        micOuter?.classList.remove('recording');
        setCaptureOrbActive(false);
        orbTrigger?.setAttribute('aria-pressed', 'false');
        stopTimer();
        stopAudio();
        stopActiveCaptureTracks();
        stopRealtimeAudioBuffer(true).catch(() => { });
    }

    function getWorkspacePayload() {
        return {
            version: 4,
            savedAt: new Date().toISOString(),
            mode: state.mode,
            captureSource: state.captureSource,
            preset: state.preset,
            transcript: transcript.value,
            translatedTranscript: translatedTranscript?.value || '',
            aiOutput: aiOutput.value,
            segments: state.segments,
            detectedLanguage: state.detectedLanguage,
            speakerMode: state.speakerMode,
            glossaryRaw: state.glossaryRaw,
            memoryRaw: state.memoryRaw,
            memoryImportedAt: state.memoryImportedAt,
            memoryPacks: state.memoryPacks,
            activeMemoryPackId: state.activeMemoryPackId,
            outputStyle: state.outputStyle,
            diagnostics: state.diagnostics,
            fileHash: state.fileHash,
            audioDurationSec: state.audioDurationSec,
            provider: state.apiProvider,
            audioModel: state.audioModel,
            chatModel: state.chatModel,
            translation: {
                enabled: !!state.translation.enabled,
                targetLanguage: state.translation.targetLanguage || 'en',
                provider: state.translation.provider || state.apiProvider,
                model: state.translation.model || getActiveChatModel(),
                segmentResults: state.translation.segmentResults || {},
                stats: state.translation.stats || createEmptyTranslationStats(),
                lastTranslatedSegmentIndex: Number(state.translation.lastTranslatedSegmentIndex || -1),
                lastError: state.translation.lastError || ''
            }
        };
    }

    function restoreWorkspaceIfAny() {
        const rawPayload = safeJsonParse(localStorage.getItem(WORKSPACE_STORAGE_KEY) || '', null)
            || safeJsonParse(localStorage.getItem(LEGACY_WORKSPACE_STORAGE_KEY) || '', null);
        if (!rawPayload) {
            workspaceStatus.textContent = 'No saved workspace';
            return;
        }
        let payload;
        try {
            payload = validateWorkspacePayload(rawPayload, { maxBytes: DEFAULT_MAX_WORKSPACE_BYTES });
        } catch (err) {
            const message = err instanceof WorkspaceValidationError ? err.message : (err.message || 'Invalid saved workspace');
            workspaceStatus.textContent = 'Saved workspace rejected';
            updateDiagnostics({ workspaceRestore: 'rejected' }, `Saved workspace rejected: ${message}`);
            return;
        }
        state.mode = payload.mode || state.mode;
        state.captureSource = payload.captureSource || state.captureSource;
        state.preset = payload.preset || state.preset;
        presetSelect.value = state.preset;
        state.speakerMode = !!payload.speakerMode;
        speakerModeToggle.classList.toggle('on', state.speakerMode);
        transcript.value = payload.transcript || '';
        state.confirmedText = transcript.value;
        aiOutput.value = payload.aiOutput || '';
        state.aiOutput = aiOutput.value;
        state.segments = Array.isArray(payload.segments) ? payload.segments.map((seg, idx) => normalizeSegment(seg, idx)) : [];
        state.correctionHistory = state.segments.map(seg => String(seg.text || '').trim()).filter(Boolean).slice(-5);
        state.detectedLanguage = payload.detectedLanguage || '';
        state.memoryRaw = normalizeImportedMemory(payload.memoryRaw || state.memoryRaw || '');
        state.memoryImportedAt = payload.memoryImportedAt || state.memoryImportedAt || '';
        state.memoryPacks = normalizeMemoryPacks(payload.memoryPacks || state.memoryPacks || []);
        state.activeMemoryPackId = payload.activeMemoryPackId || state.activeMemoryPackId || state.memoryPacks[0]?.id || '';
        state.outputStyle = payload.outputStyle || state.outputStyle || 'default';
        syncActiveMemoryPackState();
        state.diagnostics = payload.diagnostics || state.diagnostics || {};
        state.fileHash = payload.fileHash || '';
        state.audioDurationSec = Number(payload.audioDurationSec || 0);
        state.translation = normalizeTranslationState({
            ...(state.translation || {}),
            ...(payload.translation || {}),
            enabled: typeof payload.translation?.enabled === 'boolean' ? payload.translation.enabled : state.translation.enabled,
            targetLanguage: payload.translation?.targetLanguage || state.translation.targetLanguage || 'en'
        });
        persistTranslationSettings();
        persistMemoryStore();
        renderMemoryUi();
        renderCaptureUi();
        setMode(state.mode || 'realtime', { silent: true });
        if (captureSourceSelect) captureSourceSelect.value = state.captureSource;
        renderSegments();
        renderTranslationUi();
        if (!state.segments.length) updateStats();
        workspaceStatus.textContent = `Restored ${new Date(payload.savedAt || Date.now()).toLocaleString()}`;
        if (state.fileHash) setCacheStatus(`Workspace restored for ${state.fileHash.slice(0, 12)}...`);
    }

    updateDiagnostics(state.diagnostics || {}, 'Studio initialized');
    restoreWorkspaceIfAny();
    updateDiagnostics({ speechRecognition: !!recognition, autosave: state.autosaveEnabled, provider: state.apiProvider, audioModel: getApiModel(), audioTask: 'transcribe', chatModel: getActiveChatModel() }, 'Runtime self-check complete');

    // â”€â”€â”€ Keyboard Shortcuts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    document.addEventListener('keydown', (e) => {
        const tag = document.activeElement.tagName.toLowerCase();
        const isTyping = tag === 'textarea' || tag === 'input' || tag === 'select';

        // Space: toggle recording
        if (e.code === 'Space' && !isTyping) {
            e.preventDefault();
            if (state.mode !== 'file') {
                state.isRecording ? stopRecording() : startRecording();
            }
        }

        // Escape: cancel / clear interim
        if (e.code === 'Escape') {
            if (helpModalOverlay && !helpModalOverlay.hidden) {
                e.preventDefault();
                closeHelpModal();
                return;
            }
            if (topbarMobileDrawer?.classList.contains('open')) {
                e.preventDefault();
                setTopbarMobileDrawerOpen(false);
                return;
            }
            if (state.sidebarMobileOpen) {
                e.preventDefault();
                setSidebarMobileOpen(false);
                return;
            }
            if (state.assistant?.isOpen && tag !== 'textarea') {
                e.preventDefault();
                setAssistantOpen(false);
                return;
            }
            if (state.isProcessing && state.abortController) {
                state.abortController.abort();
            }
            interimEl.textContent = '';
        }

        // Ctrl+C: copy (when not in textarea)
        if (e.ctrlKey && e.key === 'c' && !isTyping) {
            e.preventDefault();
            $('copyBtn').click();
        }

        // Ctrl+D: download
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            const text = transcript.value.trim();
            if (text) {
                const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
                downloadFile(text, `transcript-${ts}.txt`, 'text/plain;charset=utf-8');
                toast('Downloaded as TXT', 'success');
            }
        }

        // Ctrl+O: open file
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            setMode('file');
            fileInput.click();
        }

        // Ctrl+U: attach assistant file
        if (e.ctrlKey && e.key.toLowerCase() === 'u' && state.assistant?.isOpen) {
            e.preventDefault();
            if (!assistantAttachBtn?.disabled) {
                assistantFileInput.value = '';
                assistantFileInput.click();
            }
        }

        // Ctrl+Enter: transcribe file
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (state.mode === 'file' && state.uploadedFile && state.apiKey) {
                processUploadedFile();
            }
        }

        // Ctrl+Delete: clear all
        if (e.ctrlKey && e.key === 'Delete') {
            e.preventDefault();
            $('clearBtn').click();
        }

        // Ctrl+Z: undo (when not in textarea)
        if (e.ctrlKey && e.key === 'z' && !isTyping) {
            if (state.undoBuffer) {
                transcript.value = state.undoBuffer;
                state.confirmedText = state.undoBuffer;
                updateStats();
                toast('Recovered last text', 'success');
            } else {
                toast('Nothing to recover', 'info');
            }
        }

        // Ctrl+Shift+Q: toggle quality mode
        if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
            e.preventDefault();
            setMode(state.mode === 'quality' ? 'realtime' : 'quality');
            toast('Mode: ' + state.mode, 'info');
        }

        // Ctrl+Shift+P: copy AI output
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
            if (aiOutput.value.trim()) {
                e.preventDefault();
                $('copyAiOutputBtn').click();
            }
        }
    });

    // â”€â”€â”€ Canvas Resize â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function resizeCanvas() {
        ensureCanvasSize();
        drawOrbFrame(state.visualLevel || 0, state.isRecording);
    }

    function initUiEffects() {
        if (initUiEffects._done) return;
        initUiEffects._done = true;

        try {
            document.addEventListener('mousedown', (e) => {
                const target = e.target.closest('button, .workspace-nav-btn, .pill-btn, .btn-toggle, .mode-btn, .view-btn, .export-card-btn');
                if (!target) return;
                const rect = target.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const ripple = document.createElement('span');
                ripple.className = 'ripple-effect';
                ripple.style.width = `${size}px`;
                ripple.style.height = `${size}px`;
                ripple.style.left = `${e.clientX - rect.left - (size / 2)}px`;
                ripple.style.top = `${e.clientY - rect.top - (size / 2)}px`;
                const existing = target.querySelector('.ripple-effect');
                if (existing) existing.remove();
                target.appendChild(ripple);
                setTimeout(() => ripple.remove(), 500);
            });
        } catch (err) {
            console.warn('Ripple binding failed', err);
        }

        try {
            document.addEventListener('mousemove', (e) => {
                const card = e.target.closest('.export-card');
                if (!card) return;
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
                card.style.setProperty('--my', `${e.clientY - rect.top}px`);
            }, { passive: true });
        } catch (err) {
            console.warn('Export spotlight binding failed', err);
        }

        try {
            assistantLauncher?.addEventListener('click', () => {
                assistantLauncher.classList.remove('is-bouncing');
                void assistantLauncher.offsetWidth;
                assistantLauncher.classList.add('is-bouncing');
                const existing = document.getElementById('mascotWaveTip');
                if (existing) existing.remove();
                const tip = document.createElement('div');
                tip.id = 'mascotWaveTip';
                tip.className = 'mascot-wave-tip';
                tip.textContent = 'Hey there!';
                document.body.appendChild(tip);
                setTimeout(() => tip.remove(), 2000);
            });
        } catch (err) {
            console.warn('Mascot polish failed', err);
        }

        try {
            window.addEventListener('resize', syncInteractiveChrome, { passive: true });
            syncInteractiveChrome();
        } catch (err) {
            console.warn('Interactive chrome sync failed', err);
        }

        try {
            if (assistantMessages) {
                state._assistantScrollObserver?.disconnect();
                state._assistantScrollObserver = new MutationObserver(() => {
                    smoothScrollChat();
                });
                state._assistantScrollObserver.observe(assistantMessages, { childList: true, subtree: true });
            }
        } catch (err) {
            console.warn('Assistant scroll observer failed', err);
        }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('resize', () => {
        if (!isCompactSidebarViewport()) {
            state.sidebarMobileOpen = false;
            setTopbarMobileDrawerOpen(false);
        }
        syncSidebarUi();
    });

    // â”€â”€â”€ Init State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    buildWorkspaceViews();
    applyWorkspaceNavIcons();
    document.body.classList.add('app-shell-mounted');
    requestAnimationFrame(() => document.body.classList.add('app-ready'));
    initUiEffects();
    setApiPanelOpen(apiPanel?.classList.contains('open'));
    setTopbarMobileDrawerOpen(false);
    syncSidebarUi();
    setWorkspaceView(state.workspaceView || 'transcript', { persist: false, closeMobile: false });
    punctBtn.classList.toggle('on', state.smartPunctEnabled);
    autoCopyBtn.classList.toggle('on', state.autoCopyEnabled);
    speakerModeToggle.classList.toggle('on', state.speakerMode);
    autosaveToggle.classList.toggle('on', state.autosaveEnabled);
    setAiOutputOpen(false);
    renderMemoryUi();
    updateStats();
    updateTranscribeBtn();
    updateVaultMeta();
    renderTranslationUi();
    setCaptureSource(state.captureSource, { silent: true });
    setMode(state.mode || 'realtime', { silent: true });
    ensureAssistantThread();
    setAssistantModel(state.assistant.model || defaultAssistantModelId(), { skipRender: true, skipAttachmentCheck: true });
    state.assistant.ui = sanitizeAssistantUiState(state.assistant.ui);
    state.assistant.unread = state.assistant.ui.unread;
    state.assistant.maximized = false;
    state.assistant.showHistory = !!state.assistant.ui.showHistory;
    assistantInput.value = state.assistant.draft || '';
    setAssistantDraft(state.assistant.draft || '');
    renderAssistantMessages();
    setAssistantOpen(!!state.assistant.ui.isOpen);
    updateDiagnostics(state.diagnostics || {}, 'Ready');
    const syncScrollChrome = () => document.body.classList.toggle('is-scrolled', window.scrollY > 8);
    syncScrollChrome();
    window.addEventListener('scroll', syncScrollChrome, { passive: true });
}




export { buildApp };




