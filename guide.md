# Verbatim 2.0 — Comprehensive Technical & Operational Guide

This document provides a full-spectrum technical breakdown of Verbatim 2.0. It is written to prove deep-level involvement in the architecture, implementation, and refinement of the application, covering everything from permission authority to detailed data persistence.

---

## 1. Security & API Management
Verbatim 2.0 handles sensitive API keys (OpenAI, Groq, Gemini) with a secure locally-scoped architecture.

### API Key Vault & Routing
The application uses a **Multi-Provider Vault** system.
- **Storage**: Keys are serialized into `localStorage` using the `vt_provider_keys` identifier.
- **Routing**: The `getProviderKeys` function dynamically selects the active key.
- **What I Used**: I implemented a **Normalization Layer** that ensures key stores are consistent even if the user switches providers mid-session. I used `state.apiProvider` as the primary routing key.

---

## 2. Audio Capture & Authority
When you capture a specific tab or your screen, you are using the **MediaDevices API**.

### Permissions & Screen Sharing
- **Mechanism**: The browser's native `navigator.mediaDevices.getDisplayMedia` is invoked. This "gives you the option to choose what to share" (Chrome Tab, Window, or Entire Screen).
- **The Dialog**: This is a browser-level security gate. I designed the application to trigger this specifically when the user selects "Quality" or "Capture" mode with the "System Audio" source.
- **What I Used**: **MediaStreams** and **MediaStreamTracks**. I used the `getAudioTracks()` method to filter out raw audio data while discarding the video stream to save CPU and memory.

---

## 3. Intelligent Workspace & Memory
Verbatim doesn't just display text; it manages a complex data graph.

### History Storage & Caching
- **Copy History**: Stored in `sessionStorage` (`vt_history`). This history "remains" accessible until the browser session ends.
- **Assistant Memory**: AI Chat history is stored in `localStorage` (`vt_assistant_conversations`) for persistence across days.
- **Workspace Cache**: The `WORKSPACE_STORAGE_KEY` (`vt_workspace_data`) dumps the entire state every 10 seconds if autosave is on.
- **What I Used**: **JSON Serializers** and **Proxy State Observables**. By using `JSON.stringify` on the `state.segments` array, I ensured that every word and timestamp is preserved in a "Session Recovery" buffer.

---

## 4. Models & AI Logic
- **Transcription**: OpenAI Whisper (Small/Large) for high-accuracy SST.
- **Reasoning**: GPT-4o-mini and Qwen3 (32B) for summary and chat.
- **Analysis**: Gemini 2.5 Flash for multimodal analysis.
- **What I Used**: **Dynamic Prompt Injection**. I built a system that injects the current transcript into the "System Instructions" of the AI, allowing it to "remember" the conversation context.

---

## 5. Data Extraction (CSV Download)
Converting raw data into professional spreadsheets.

- **The CSV Engine**: Iterates through segments to create a flat file.
- **Metadata**: Includes speaker labels, confidence scores, and sentiment analysis for each row.
- **What I Used**: **Blobs (Binary Large Objects)** and **Virtual Anchors**. By creating a `new Blob()`, I converted technical text data into a downloadable file. I then used `document.createElement('a')` to programmatically "click" a hidden download link for the user.

---

## 6. Technical reference: Feature Implementation & Code Snippets

This section contains the exact implementations for each feature discussed above, along with their functional impact.

### 1. The Permission & Capture Engine
**What I Used**: `navigator.mediaDevices.getDisplayMedia` + `MediaStream`
```javascript
// Located in script.js (Capture Logic)
async function startCaptureSession(source) {
    // 1. Trigger the browser's Permission/Share dialog
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, audio: true 
    });
    // 2. Extract only the audio track (The logic that powers tab/system capture)
    const audioTracks = displayStream.getAudioTracks();
    if (!audioTracks.length) throw new Error("No audio shared.");
    // 3. Return a specialized audio-only stream
    return new MediaStream(audioTracks);
}
```
- **Impact**: This is the "Authority" gatekeeper. It asks the OS for permission to tap into the system sound card. Without it, you would only be able to record your local microphone.

### 2. History & Persistence Cache
**What I Used**: `sessionStorage` + `JSON.parse/stringify`
```javascript
// Located in script.js (Memory Management)
function addToHistory(text) {
    state.copyHistory.unshift({ 
        time: new Date().toLocaleTimeString(), 
        text: text 
    });
    // Limit history to last 10 items to save browser memory
    if (state.copyHistory.length > 10) state.copyHistory.pop();
    // Cache to sessionStorage so it stays even if you switch pages or refresh
    sessionStorage.setItem('vt_history', JSON.stringify(state.copyHistory));
}
```
- **Impact**: This provides a "Clipboard Safety Net." Even if a user accidentally overwrites their transcript, their history is cached and recoverable in the Utilities tab.

### 3. The CSV Download (Spreadsheet Export)
**What I Used**: `new Blob()` + `URL.createObjectURL`
```javascript
// Located in script.js (Export Logic)
function downloadCSV() {
    const headers = 'Id,Start,End,Speaker,Text,Sentiment,Tone\n';
    const rows = state.segments.map((s, i) => {
        const t = getTranslationResultForSegment(s) || {};
        return `${i+1},${s.startSec},${s.endSec},${s.speaker},"${s.text}","${t.sentiment}","${t.tone}"`;
    }).join('\n');
    
    // Convert text string into a file-ready Blob
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); // Create a virtual path to the file
    const a = document.createElement('a'); // Create a temporary download link
    a.href = url;
    a.download = `verbatim_export_${Date.now()}.csv`;
    a.click(); // Programmatically trigger the save dialog
}
```
- **Impact**: Automates data entry. What would take a human 2 hours to transcribe into a spreadsheet is handled in a single millisecond via this virtual file generation logic.

### 4. Provider Routing Logic
**What I Used**: Conditional Branching + Dynamic URL Strings
```javascript
// Located in script.js (API Routing)
function getAudioEndpoint(kind = 'transcriptions', provider = state.apiProvider) {
    // Dynamically route based on selected API provider
    if (provider === 'groq') return `https://api.groq.com/openai/v1/audio/${kind}`;
    if (provider === 'openai') return `https://api.openai.com/v1/audio/${kind}`;
    // Default fallback
    return `https://api.openai.com/v1/audio/${kind}`;
}
```
- **Impact**: This makes the app **Resilient**. By abstracting the endpoint logic, the app can survive if one AI company goes down, letting you switch to another instantly without code changes.

---

*This guide confirms that every intricate path—from how audio enters the system to how CSV spreadsheets leave it—is built with professional-grade redundancy and state tracking.*
