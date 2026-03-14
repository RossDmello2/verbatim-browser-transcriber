# Verba Assistant Reconstruction Spec

This file is the assistant-focused build spec for the Verbatim app's embedded assistant, `Verba`.

It is written so another engineer can reproduce the current Verba assistant in another project with the same product behavior, the same feature set, the same routing rules, and the same motion language.

Primary source of truth:

- `script.js`
- `style.css`
- `update.md`
- `guide.md`

This spec is about what the assistant currently does, not what it ideally should do.

## 1. Product Goal

Verba is not a tiny help widget. It is a fully embedded assistant subsystem inside a browser transcription workspace.

It must support:

- opening and closing from a floating launcher
- unread count when replies arrive while closed
- new chat creation
- multi-chat history
- conversation switching
- conversation deletion
- clearing the current thread
- copying chat output
- minimizing
- maximizing
- multimodal attachments
- image analysis
- PDF analysis
- text-file analysis
- microphone dictation into the composer
- quick-prompt chips
- persistent draft restore
- persistent thread restore
- persistent chat-history restore
- smart model routing
- provider-specific request preparation
- animated panel, messages, typing states, and robot mascot motion

## 2. Source Files And Ownership

The assistant is spread across these areas:

- `script.js`
  - DOM template for the assistant shell
  - state and storage
  - model catalog and smart router
  - prompt building
  - chat history lifecycle
  - attachment ingestion
  - Gemini upload flow
  - speech recognition for assistant dictation
  - launcher behavior
  - keyboard shortcuts
- `style.css`
  - panel layout
  - header and toolbar styles
  - chat bubble visuals
  - file pill styles
  - launcher robot styles
  - motion and animation keyframes
- `update.md`
  - high-level reconstruction summary
- `guide.md`
  - provider key vault notes and architecture notes

## 3. Exact UI Anatomy

The assistant UI is generated from a template inside `script.js`, not statically in `index.html`.

Core DOM structure:

```html
<div class="assistant-shell" id="assistantShell">
  <div class="assistant-panel" id="assistantPanel" hidden>
    <div class="assistant-header">
      <div class="assistant-title">
        <div class="assistant-mini-bot">...</div>
        <div class="assistant-heading">
          <div class="assistant-name">Verba</div>
          <div class="assistant-sub" id="assistantRuntimeMeta">Assistant</div>
        </div>
      </div>
      <div class="assistant-actions">
        <button id="assistantQuickNewBtn"></button>
        <button id="assistantHistoryBtn"></button>
        <button id="assistantCopyLastBtn"></button>
        <button id="assistantClearBtn"></button>
        <button id="assistantMinBtn"></button>
        <button id="assistantMaxBtn"></button>
        <button id="assistantCloseBtn"></button>
      </div>
    </div>

    <div class="assistant-history-panel" id="assistantHistoryPanel" hidden>
      <button id="assistantNewChatBtn">New chat</button>
      <div id="assistantHistoryList"></div>
    </div>

    <div class="assistant-toolbar" id="assistantQuickPrompts">...</div>
    <div class="assistant-empty" id="assistantEmpty">...</div>
    <div class="assistant-messages" id="assistantMessages"></div>

    <div class="assistant-footer">
      <div class="assistant-input-wrap" id="assistantInputWrap">
        <textarea id="assistantInput"></textarea>

        <div class="assistant-attachment-preview" id="assistantAttachmentPreview" hidden>
          <span id="assistantAttachmentKind"></span>
          <span id="assistantAttachmentMeta"></span>
          <button id="assistantAttachmentRemove"></button>
        </div>

        <div class="assistant-footer-row">
          <select id="assistantModelSelect"></select>
          <input type="file" id="assistantFileInput" hidden multiple>
          <button id="assistantAttachBtn"></button>
          <button id="assistantMicBtn"></button>
          <button id="assistantSend"></button>
        </div>

        <div class="assistant-meta" id="assistantModelMeta"></div>
      </div>

      <div class="assistant-note"></div>
    </div>
  </div>

  <div class="assistant-dock">
    <button id="copyBtn">Copy</button>
    <button class="assistant-launcher" id="assistantLauncher">
      <span class="assistant-unread" id="assistantUnread">0</span>
      <span class="assistant-launcher-label">Verba Assistant</span>
      <div class="robot-3d">...</div>
    </button>
  </div>
</div>
```

Header controls are exact:

- new chat
- conversation history
- copy last assistant answer
- clear thread
- minimize
- maximize or restore
- close

Quick chips are exact:

- `Modes`
- `Translate`
- `Auto-Copy`
- `Export + Save`

Composer controls are exact:

- assistant model dropdown
- hidden file input
- add photos and files button
- microphone button
- send button

## 4. State Model And Persistence

Assistant state lives under `state.assistant`.

Exact shape:

```javascript
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
  conversations: JSON.parse(localStorage.getItem('vt_assistant_conversations') || '[]'),
  messages: JSON.parse(localStorage.getItem('vt_assistant_thread') || '[]'),
  ui: JSON.parse(localStorage.getItem('vt_assistant_ui') || '{}')
}
```

Exact storage keys used by the assistant:

- `vt_assistant_model`
- `vt_assistant_current`
- `vt_assistant_conversations`
- `vt_assistant_thread`
- `vt_assistant_ui`
- `vt_assistant_draft`

Related storage keys the assistant depends on:

- `vt_provider_keys`
- `vt_gemini_analysis_model`
- `vt_gemini_usage`
- `vt_memory_raw`
- `vt_memory_packs`
- `vt_memory_pack_active`
- `vt_output_style`
- `vt_provider`
- `vt_chat_model`
- `vt_audio_model`

Important restore behavior on boot:

```javascript
ensureAssistantThread();
setAssistantModel(state.assistant.model || defaultAssistantModelId(), {
  skipRender: true,
  skipAttachmentCheck: true
});
state.assistant.ui = sanitizeAssistantUiState(state.assistant.ui);
state.assistant.unread = state.assistant.ui.unread;
state.assistant.maximized = false;
state.assistant.showHistory = !!state.assistant.ui.showHistory;
assistantInput.value = state.assistant.draft || '';
setAssistantDraft(state.assistant.draft || '');
renderAssistantMessages();
setAssistantOpen(!!state.assistant.ui.isOpen);
```

Important quirk:

- `maximized` is not restored as true after refresh. It is explicitly reset to `false`.

## 5. Conversation System

This is a true multi-conversation assistant, not a single thread.

### 5.1 Conversation object

```javascript
{
  id: `chat_${now}_${random}`,
  title: seedTitle,
  createdAt: now,
  updatedAt: now,
  messages: [...]
}
```

### 5.2 Title generation

Conversation title comes from the first non-empty user message.

Rules:

- collapse whitespace
- trim
- if empty, use `New chat`
- if longer than 52 chars, truncate and append `...`

### 5.3 Current behaviors

- switching chat persists the current thread first
- deleting a chat never leaves the assistant with zero chats
- if everything is deleted, a fresh chat is created with the welcome message
- creating a new chat clears draft and pending attachments
- history is sorted by `updatedAt` descending

Key snippets:

```javascript
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
}
```

```javascript
function deleteAssistantConversation(conversationId) {
  state.assistant.conversations =
    (state.assistant.conversations || []).filter(conv => conv.id !== conversationId);

  if (!state.assistant.conversations.length) {
    const fresh = createAssistantConversation([getAssistantWelcomeMessage()]);
    state.assistant.conversations = [fresh];
  }
}
```

## 6. Welcome Message And Empty State

Default welcome message:

```javascript
'I can help with this Verba workspace and also answer general questions. Ask about models, prompts, coding, writing, exports, recording flow, or anything else you need.'
```

Important behavior:

- the assistant usually has at least this welcome message
- because of that, the empty state is rarely visible in a normal saved thread

## 7. Feature Inventory

Current shipped assistant features:

- floating launcher with unread badge
- animated robot mascot
- open, close, minimize, maximize
- chat history panel
- new chat from header
- new chat from history panel
- conversation deletion
- thread clear
- copy output
- quick prompts
- text composer
- send on Enter
- multi-file attachment support
- image upload
- PDF upload
- text file upload
- drag and drop over composer
- drag and drop over attach button
- paste image or file from clipboard
- assistant-side voice dictation
- dynamic model dropdown
- automatic routing to Gemini for multimodal/file analysis
- code block rendering with copy-code buttons
- `<think>...</think>` parsing and display
- typing indicator
- unread count while panel is closed
- draft persistence
- conversation persistence
- runtime metadata line
- memory-aware prompting

## 8. Exact Model Catalog

Default assistant model:

```javascript
function defaultAssistantModelId() {
  return 'assistant:max';
}
```

Exact catalog:

```javascript
[
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
  }
]
```

Gemini analysis model catalog:

```javascript
[
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
]
```

## 9. Smart Routing Rules

`assistant:max` is a router, not a real API model.

Exact routing logic:

```javascript
function resolveMaxAssistantModel(attachments = null, text = '') {
  const normalizedAttachments = normalizeAssistantAttachmentList(attachments);

  if (normalizedAttachments.length) {
    if (getProviderKeys('gemini').length) {
      return getConfiguredGeminiAnalysisOption();
    }
    return findAssistantCatalogOption('groq:meta-llama/llama-4-scout-17b-16e-instruct');
  }

  if (isLongOutputAssistantRequest(text)) {
    return findAssistantCatalogOption('groq:llama-3.3-70b-versatile');
  }

  if (isContextHeavyAssistantRequest(text)) {
    return findAssistantCatalogOption('groq:moonshotai/kimi-k2-instruct')
      || findAssistantCatalogOption('groq:qwen/qwen3-32b');
  }

  if (isQuickAssistantRequest(text)) {
    return findAssistantCatalogOption('groq:llama-3.1-8b-instant')
      || findAssistantCatalogOption('groq:openai/gpt-oss-20b');
  }

  return findAssistantCatalogOption('groq:llama-3.3-70b-versatile')
    || findAssistantCatalogOption('groq:openai/gpt-oss-120b');
}
```

Heuristic buckets:

- long-output requests
  - triggered by long prompts or terms like `complete implementation`, `full code`, `detailed document`, `comprehensive`, `entire file`, `full api`, `report`, `documentation`
- context-heavy requests
  - terms like `analyze`, `architecture`, `design`, `refactor`, `plan`, `compare`, `research`, `codebase`, `system design`
- quick requests
  - terms like `quick`, `brief`, `short`, `one line`, `tl;dr`

Important routing rule:

- if attachments exist and a Gemini key is stored, the request routes to Gemini even if the selected assistant model is a Groq model

Important PDF rule:

- PDFs effectively require Gemini
- if no Gemini key exists, PDF selection still resolves toward Gemini behavior and then fails with a Gemini-key-required message

## 10. Provider Keys And API Endpoints

Provider keys are stored locally in a multi-provider vault.

Exact local storage record:

```javascript
localStorage.setItem('vt_provider_keys', JSON.stringify({
  groq: [],
  openai: [],
  gemini: []
}));
```

Normalization:

```javascript
function normalizeProviderKeyStore(rawStore) {
  const normalizeList = value => Array.isArray(value)
    ? [...new Set(value.map(v => String(v || '').trim()).filter(Boolean))]
    : [];

  return {
    groq: normalizeList(store.groq),
    openai: normalizeList(store.openai),
    gemini: normalizeList(store.gemini)
  };
}
```

Key lookup behavior:

```javascript
function getProviderKeys(provider = state.apiProvider) {
  state.providerKeys = normalizeProviderKeyStore(state.providerKeys);
  const vault = Array.isArray(state.providerKeys?.[provider])
    ? state.providerKeys[provider].filter(Boolean)
    : [];
  const apiKey = provider === state.apiProvider ? (state.apiKey || '').trim() : '';
  if (apiKey && !vault.includes(apiKey)) return [apiKey, ...vault];
  return vault;
}
```

Exact endpoints:

```javascript
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
```

Assistant provider behavior:

- Groq and OpenAI use chat-completions-style messages
- Gemini uses `generateContent`
- Gemini uploads files first for image/PDF analysis
- Gemini usage is tracked locally by model

## 11. Prompt Grounding

Verba is grounded with a fixed knowledge base plus runtime summary plus optional imported memory.

System prompt shape:

```javascript
{
  system: `You are Verba Assistant.
${ASSISTANT_KB}

Current runtime state:
${getAssistantRuntimeSummary()}

Preferred output style:
${getOutputStyleInstruction()}

When generating code, always output the complete implementation without truncating or summarizing.
Never say "rest of code here" or "continues below".
For documents, use proper headings, sections and formatting.
Prioritize completeness over brevity.`,

  memory: importedMemory
    ? `Use the imported user memory below as long-term context...`
    : ''
}
```

Runtime summary includes:

- mode
- audio provider
- assistant provider
- language
- smart punctuation state
- auto-copy state
- speaker-label state
- preset
- autosave state
- memory loaded state
- active memory pack
- output style
- recording state
- normalize option
- file language mode
- transcript cache state
- detected language
- segment count
- cache state
- audio model
- chat model
- assistant model

Attachment-specific grounding is injected too:

- PDFs: inspect directly, OCR if needed, extract values and facts
- text files: read file contents directly, preserve structure when useful
- images: inspect directly, OCR readable text, extract fields and values

## 12. Request Window And Context Packing

Only the last 8 user or assistant messages are sent to the model.

For OpenAI/Groq-style payloads:

```javascript
(state.assistant.messages || [])
  .filter(msg => msg && (msg.role === 'user' || msg.role === 'assistant'))
  .slice(-8)
```

Text-like attachments are embedded into the prompt:

```javascript
{
  type: 'text',
  text: `Attached file: ${item.name}\n\n${String(item.textContent || '').slice(0, 200000)}`
}
```

Image attachments for Groq/OpenAI-style models are attached as data URLs:

```javascript
{ type: 'image_url', image_url: { url: item.dataUrl } }
```

Gemini attachments are attached as `file_data` with `file_uri`.

## 13. Attachment System

### 13.1 Supported assistant attachment types

Exact supported MIME list:

- `image/png`
- `image/jpeg`
- `image/webp`
- `application/pdf`
- `text/plain`
- `text/markdown`
- `text/csv`
- `application/json`

### 13.2 Exact size cap

```javascript
const ASSISTANT_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
```

Actual behavior:

- 20 MB max per file
- multiple files are supported
- unsupported file type stops selection immediately
- oversized file stops selection immediately

### 13.3 Accept-string behavior

```javascript
function assistantAttachmentAccept(option = getActiveAssistantModelOption()) {
  const textAccept = 'text/plain,.txt,text/markdown,.md,text/csv,.csv,application/json,.json';
  if (getProviderKeys('gemini').length) {
    return `image/png,image/jpeg,image/webp,application/pdf,.pdf,${textAccept}`;
  }
  if (activeOption.supportsPdf) {
    return `image/png,image/jpeg,image/webp,application/pdf,.pdf,${textAccept}`;
  }
  if (activeOption.supportsImages) {
    return `image/png,image/jpeg,image/webp,${textAccept}`;
  }
  return textAccept;
}
```

### 13.4 Pending-attachment UX

Pending attachments are shown as a pill with:

- attachment type label
- file name or summary
- remove button

If multiple are attached:

- preview shows count-based summary like `2 images + 1 PDF attached`

### 13.5 File ingestion paths

The assistant accepts files through:

- attach button click
- file input selection
- drag-drop over composer
- drag-drop over attach button
- paste from clipboard
- keyboard shortcut `Ctrl+U` when assistant is open

Key snippet:

```javascript
assistantInput?.addEventListener('paste', (e) => {
  const items = Array.from(e.clipboardData?.items || []);
  const files = items
    .filter(item => item.kind === 'file')
    .map(item => item.getAsFile())
    .filter(Boolean);
  if (!files.length) return;
  e.preventDefault();
  handleAssistantFileSelection(files);
});
```

### 13.6 Attachment preparation by provider

For text attachments:

- file is read client-side via `FileReader.readAsText`
- content is stored as `textContent`

For image attachments on non-Gemini providers:

- image may be normalized to PNG via canvas
- file is read as data URL

For Gemini:

- text files remain text
- images and PDFs are uploaded via Gemini resumable upload API
- uploaded file URI is cached

Groq/OpenAI-style preparation:

```javascript
if (item.kind === 'text') {
  const textContent = item.file ? await readFileAsText(item.file) : String(item.textContent || '');
  return { ...meta, provider, textContent };
}

if (item.kind !== 'image') {
  throw new Error('This model only supports image or text attachments.');
}

const normalizedFile = item.file ? await normalizeAssistantImageFile(item.file) : item.file;
const dataUrl = await readFileAsDataUrl(normalizedFile);
return { ...meta, provider, dataUrl, file: item.file || normalizedFile };
```

Gemini preparation:

```javascript
if (item.kind === 'text') {
  const textContent = item.file ? await readFileAsText(item.file) : String(item.textContent || '');
  return {
    ...meta,
    provider: 'gemini',
    textContent,
    file: item.file || null
  };
}

const uploaded = await uploadGeminiFileWithKey(normalizedFile, keys[keyIndex], signal);
return {
  ...meta,
  provider: 'gemini',
  fileUri: uploaded.uri,
  mimeType: uploaded.mimeType,
  fileName: normalizedFile?.name || item.name,
  uploadedAt: Date.now(),
  file: item.file || normalizedFile
};
```

Important Gemini caching rule:

```javascript
return Date.now() - uploadedAt < (25 * 60 * 1000);
```

So Gemini file references are reused for about 25 minutes before re-upload.

## 14. Photo And File Analysis Default Prompts

If a user sends only attachments and no text, Verba auto-generates a default prompt.

Exact behavior:

```javascript
return hasPdf
  ? 'Please analyze this PDF and summarize the important content.'
  : hasText
    ? 'Please analyze these attached files and summarize the important content.'
    : attachments.length > 1
      ? 'Please analyze these images and extract the important details and any readable text.'
      : 'Please analyze this image and extract the important details and any readable text.';
```

## 15. Voice Input

Assistant dictation is separate from the main recorder.

Exact speech setup:

```javascript
assistantRecognition = new SR();
assistantRecognition.continuous = true;
assistantRecognition.interimResults = true;
assistantRecognition.maxAlternatives = 1;
assistantRecognition.lang = 'en-US';
```

Current behavior:

- only works when browser exposes `SpeechRecognition` or `webkitSpeechRecognition`
- language is fixed to `en-US`
- supports interim plus final transcription
- dictation writes directly into the assistant textarea
- cannot start if the main recorder is active
- if assistant panel closes while listening, listening is stopped

Interim/final merge behavior:

```javascript
const next = [assistantDictationBase, assistantDictationFinal, interim]
  .filter(Boolean)
  .join(' ')
  .trim();

if (assistantInput) assistantInput.value = next;
setAssistantDraft(next);
```

Start guard:

```javascript
if (state.isRecording) {
  toast('Stop the main recording first', 'warning');
  return;
}
```

Mic button UX:

- toggles listening on click
- `aria-pressed` flips
- title flips between `Voice input (English)` and `Stop voice input`
- visual state changes to `.assistant-mic-btn.listening`

## 16. Send Flow

The send flow is:

1. clone pending attachments
2. trim input text
3. derive final text or attachment-only default prompt
4. resolve model option
5. stop assistant dictation if active
6. validate attachment compatibility
7. validate provider keys
8. mark assistant as sending
9. prepare attachments for provider
10. clear draft and pending attachment UI
11. push the user message into thread
12. make provider request
13. normalize output
14. push assistant reply into thread
15. increment unread if panel is closed
16. clear sending state and rerender

Core send code:

```javascript
state.assistant.isSending = true;
renderAssistantComposer();
assistantModelMeta.textContent = `${getAssistantProviderLabel(provider)} | thinking...`;
showTypingIndicator();

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
```

Closed-panel unread behavior:

```javascript
if (!state.assistant.isOpen) {
  state.assistant.unread = Math.min(9, Number(state.assistant.unread || 0) + 1);
}
```

## 17. Response Rendering

Assistant responses are not dumped as raw text. They are normalized and rendered structurally.

### 17.1 Stored assistant text normalization

Assistant text is cleaned before storage:

```javascript
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
```

Important result:

- bold markers are stripped
- list bullets are stripped
- markdown tables are flattened

### 17.2 `<think>` block parsing

If a model returns `<think>...</think>`, Verba splits that into:

- a visible "Thinking..." block
- a final output block below it

### 17.3 Code blocks

Triple-backtick code blocks are rendered with:

- language header
- code copy button
- monospace code area

Code-block copy button behavior:

```javascript
assistantMessages?.addEventListener('click', (e) => {
  const copyBtn = e.target?.closest?.('.assistant-code-copy');
  if (!copyBtn) return;
  const encoded = copyBtn.getAttribute('data-copy-code') || '';
  const code = decodeURIComponent(encoded);
  copyToClipboard(code, () => toast('Code copied', 'success'));
});
```

### 17.4 Message row visuals

- user bubble aligns right
- assistant bubble aligns left with avatar robot
- user message gets blue gradient bubble
- assistant message gets pale glass card bubble
- attachments render as chips above message text
- error replies get error styling

## 18. Copy Behavior

Important current quirk:

- the header button says `Copy last assistant answer`
- the current implementation actually copies the full non-system chat transcript

Exact code behavior:

```javascript
const fullChat = messages
  .filter(m => m.role !== 'system')
  .map(m => {
    const role = m.role === 'user' ? 'You' : 'Verba';
    return `${role}:\n${m.content || m.text || ''}`;
  })
  .join('\n\n---\n\n');
```

If you want to reproduce Verba exactly, preserve this mismatch.

## 19. Header Actions

Exact action behavior:

- new chat
  - creates a new conversation
  - resets draft
  - clears pending attachment
- history
  - toggles history panel
  - opens assistant if currently closed
- clear
  - replaces current thread with only the welcome message
- minimize
  - closes assistant but preserves thread state
- maximize
  - toggles wider and taller panel layout
- close
  - same close behavior as minimize in practice

Close path:

```javascript
function setAssistantOpen(isOpen) {
  if (!isOpen) {
    if (state.assistant.isListening && assistantRecognition) {
      try { assistantRecognition.stop(); } catch (e) {}
    }
    state.assistant.maximized = false;
    ...
    state.assistant.isOpen = false;
    state.assistant.minimized = true;
    persistAssistantUi();
    renderAssistantMessages();
    return;
  }
}
```

## 20. Quick Prompts

Quick prompt buttons auto-send, not just prefill.

Behavior:

```javascript
if (!state.assistant.isOpen) setAssistantOpen(true);
setAssistantDraft(prompt);
assistantInput.value = prompt;
renderAssistantComposer();
askAssistant(prompt);
```

Exact prompts:

- `How do Live, Quality, and File differ?`
- `How does translate-to-English work in this app?`
- `What does Auto-Copy do and when does it trigger?`
- `How do exports and workspace save work?`

## 21. Runtime Meta Line

The assistant header meta line is dynamically updated with live app state.

Exact current format:

```javascript
`${state.mode} mode | audio ${state.apiProvider.toUpperCase()} ready | assistant ${getAssistantProviderLabel(getActiveAssistantProvider())} | ${getActiveMemoryPack()?.name || 'Primary'} memory`
```

This is important because Verba is presented as an app-grounded assistant, not a detached chatbot.

## 22. Keyboard Shortcuts Relevant To Verba

Assistant-relevant shortcuts:

- `Escape`
  - closes assistant if open and focus is not inside a textarea
- `Ctrl+U`
  - opens assistant file picker when assistant is open
- `Enter`
  - sends assistant draft when focus is in assistant textarea and Shift is not held
- `Shift+Enter`
  - newline in textarea

Exact attach shortcut:

```javascript
if (e.ctrlKey && e.key.toLowerCase() === 'u' && state.assistant?.isOpen) {
  e.preventDefault();
  if (!assistantAttachBtn?.disabled) {
    assistantFileInput.value = '';
    assistantFileInput.click();
  }
}
```

## 23. Animation System

This section matters if the goal is to reproduce the current Verba feel, not just the features.

### 23.1 Panel open and close

Base panel state:

- closed panel starts at `translateY(16px) scale(0.96)`
- opacity `0`
- pointer-events disabled

Open state:

```css
.assistant-shell.open .assistant-panel {
  transform: translateY(0) scale(1);
  opacity: 1;
  pointer-events: auto;
}
```

Spring and close animations:

```css
.verba-panel-open {
  animation: panelSpring 350ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.verba-panel-closing {
  animation: panelClose 200ms ease forwards;
}

@keyframes panelSpring {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes panelClose {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(0.93) translateY(12px); }
}
```

### 23.2 Launcher tilt and hover

The launcher reacts to local mouse position:

```javascript
const x = ((e.clientX - rect.left) / rect.width) - 0.5;
const y = ((e.clientY - rect.top) / rect.height) - 0.5;
assistantLauncher.style.setProperty('--assistant-tilt-x', `${(x * 10).toFixed(2)}deg`);
assistantLauncher.style.setProperty('--assistant-tilt-y', `${(-y * 10).toFixed(2)}deg`);
```

And the launcher transform consumes those variables:

```css
transform: perspective(800px)
  rotateX(var(--assistant-tilt-y, 0deg))
  rotateY(var(--assistant-tilt-x, 0deg));
```

### 23.3 Global cursor tracking for the robot

The robot head and pupil also follow the global cursor, not just the local hover point.

Key JS:

```javascript
document.addEventListener('mousemove', (e) => updateRobot(e.clientX, e.clientY));
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) updateRobot(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });
```

The JS computes:

- `--robot-rx`
- `--robot-ry`
- `--robot-px`
- `--robot-py`
- mirrored root-level assistant robot vars

This means:

- launcher robot tracks cursor
- mini robot in header tracks cursor
- message avatar robot tracks cursor

### 23.4 Robot float

The header robot and message-avatar robot float continuously:

```css
@keyframes assistantRobotFloat {
  0%, 100% {
    transform: translate(var(--assistant-bot-tx, 0), var(--assistant-bot-ty, 0))
      scale(var(--assistant-bot-scale, 1));
  }
  50% {
    transform: translate(var(--assistant-bot-tx, 0), calc(var(--assistant-bot-ty, 0) - 2px))
      scale(var(--assistant-bot-scale, 1));
  }
}
```

Applied to:

- `.assistant-mini-bot .assistant-robot-badge`
- `.assistant-avatar-dot .assistant-robot-badge`

### 23.5 Launcher bounce on click

When the launcher is clicked, it gets a bounce class:

```javascript
assistantLauncher.classList.remove('is-bouncing');
void assistantLauncher.offsetWidth;
assistantLauncher.classList.add('is-bouncing');
```

Bounce motion:

```css
.verba-mascot.is-bouncing {
  animation: mascotBounce 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes mascotBounce {
  0%, 100% { transform: translateY(0); }
  35% { transform: translateY(-10px); }
  70% { transform: translateY(0); }
}
```

### 23.6 Message entry animation

Latest user message:

```javascript
lastUser.style.animation =
  'msgSlideRight 280ms cubic-bezier(0.34,1.56,0.64,1) forwards';
```

Latest assistant message:

```javascript
lastAssistant.style.animation =
  'msgSlideLeft 280ms cubic-bezier(0.34,1.56,0.64,1) forwards';
avatar.style.animation =
  'msgSlideLeft 280ms 40ms cubic-bezier(0.34,1.56,0.64,1) both';
```

Keyframes:

```css
@keyframes msgSlideRight {
  from {
    opacity: 0;
    transform: translateX(16px) translateY(4px) scale(0.97);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes msgSlideLeft {
  from {
    opacity: 0;
    transform: translateX(-16px) translateY(4px) scale(0.97);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(0) scale(1);
    filter: blur(0);
  }
}
```

### 23.7 Typing indicator

Two separate typing-style motions exist:

1. temporary typing row added during send
2. thinking dots inside rendered `<think>` block

Temporary typing row:

```javascript
el.id = 'verba-typing';
el.className = 'verba-typing-row';
el.innerHTML = `
  <div class="assistant-avatar-dot msg-avatar verba-typing-avatar">...</div>
  <div class="verba-typing-bubble">
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  </div>`;
```

Typing-bounce motion:

```css
.typing-dot {
  animation: typingBounce 1.2s ease-in-out infinite;
}
.typing-dot:nth-child(1) { animation-delay: 0ms; }
.typing-dot:nth-child(2) { animation-delay: 160ms; }
.typing-dot:nth-child(3) { animation-delay: 320ms; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}
```

Thinking block pulse:

```css
.assistant-thinking-dots span {
  animation: assistantThinkingPulse 1.1s ease-in-out infinite;
}
```

### 23.8 Send button loading state

When sending:

- send button gets `.loading`
- paper-plane icon fades out
- spinner pseudo-element appears

```css
.assistant-send.loading svg {
  opacity: 0;
}

.assistant-send.loading::after {
  content: '';
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  animation: assistantSendSpin 0.8s linear infinite;
}
```

### 23.9 Hover and interaction motion

Micro interactions:

- header icon buttons lift `translateY(-1px)` on hover
- quick prompt chips brighten and recolor on hover
- history rows lift `translateY(-1px)` on hover
- attach button lifts and glows on hover and drag-over
- mic button lifts on hover
- send button lifts on hover
- unread badge appears only when `.visible`
- launcher label fades and slides in on hover

### 23.10 Drag-over states

Composer drag-over:

```css
.assistant-input-wrap.drag-over {
  border-color: rgba(31, 109, 255, 0.72);
  background: rgba(241, 247, 255, 0.98);
  box-shadow: 0 0 0 4px rgba(31, 109, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.94);
}
```

Attach-button drag-over:

```css
.assistant-attach-btn.drag-over:not(:disabled) {
  transform: translateY(-1px) scale(1.01);
  border-color: rgba(31, 109, 255, 0.85);
  background: rgba(235, 243, 255, 0.98);
  color: #1f5fff;
  box-shadow: 0 14px 28px rgba(31, 109, 255, 0.16);
}
```

### 23.11 Mobile and responsive assistant motion

On smaller screens:

- safe area insets shrink
- panel becomes full-width or bottom-sheet style
- launcher label may be hidden
- panel can expand to `75vh` or `90vh` depending on breakpoint
- panel transform origin changes toward bottom center
- a top grab-handle bar is injected via `::before`

This means the assistant should not be rebuilt as a fixed desktop-only modal.

### 23.12 Reduced-motion support

Current CSS disables several assistant animations under reduced-motion conditions:

- typing dots
- panel open/close animations
- avatar animations

If rebuilding, preserve a reduced-motion path.

## 24. Exact Behaviors To Preserve

If the goal is "same as Verba", keep these:

- launcher unread count caps visually at `9+`
- assistant uses real conversation history, not one rolling thread only
- there is always at least one conversation
- assistant can answer app-specific questions and normal general questions
- multimodal requests route to Gemini when Gemini keys exist
- image requests without Gemini can still go to Groq Llama 4 Scout
- PDF analysis is treated as Gemini territory
- assistant draft survives refresh in `sessionStorage`
- thread and chat history survive refresh in `localStorage`
- assistant close resets maximized state
- quick prompt chips auto-send immediately
- copy-last button currently copies the whole chat transcript
- code blocks render with individual copy buttons
- the mascot follows the cursor and floats
- the panel opens with spring motion and closes with shrink/fade motion

## 25. Exact Behaviors To Avoid If You Want A Faithful Clone

Do not simplify Verba into:

- a single-thread help popup
- a plain text-only assistant
- a non-persistent chat box
- a static launcher icon
- a modal with no unread count
- a one-model-only assistant
- a file-upload box without provider-specific preparation
- a microphone button that starts the main recorder
- a generic chatbot with no runtime grounding

## 26. Implementation Blueprint For Another Project

If porting Verba into a different app, the safest order is:

1. Build the assistant shell and launcher with the same IDs and state flags.
2. Implement assistant storage keys and restore flow exactly.
3. Implement multi-conversation create/select/delete/clear lifecycle.
4. Implement model catalog and `assistant:max` router.
5. Implement provider-key vault and Gemini analysis model selection.
6. Implement attachment normalization, validation, preview, and provider-specific preparation.
7. Implement assistant speech recognition dictation.
8. Implement grounded prompt-building using runtime state and imported memory.
9. Implement response rendering with `<think>` parsing and code-block copy buttons.
10. Implement the motion layer: panel spring, close animation, robot float, launcher tilt, cursor follow, typing dots, message slide-ins.

## 27. Final Build Summary

Verba Assistant is a persistent, multimodal, app-grounded assistant with:

- multi-chat history
- saved drafts
- saved UI state
- saved unread count
- smart model routing
- provider-aware file handling
- image and PDF analysis
- text-file ingestion
- assistant-specific voice dictation
- floating robot launcher
- springy panel motion
- animated chat message entry
- code rendering and copy

If another engineer follows this file and mirrors the quoted logic, they will have the current Verba assistant behavior much more faithfully than by building a generic AI chat panel.
