import { AudioQueue, unlockAudioContext } from './audio-queue.js';
import { KeyRotator } from './key-rotator.js';
import { streamChat } from './llm-stream.js';
import { SentenceSplitter } from './sentence-splitter.js';
import { sanitizeForSpeech, splitSpeechForProvider } from './speech-sanitizer.js';
import { extractFrameFeatures, scoreFrame, scoreWindow } from './speaker-profile.js';
import { describeBrowserVoice, selectBrowserVoice, synthOrpheus } from './tts-engine.js';

const MAX_HISTORY_MESSAGES = 12;
const MAX_SESSION_RECAP_CHARS = 1200;
const MAX_GROUNDED_CONTEXT_CHARS = 18000;
const DEFAULT_SYSTEM_PROMPT = 'You are a concise, friendly voice assistant. Your replies are spoken aloud by a text-to-speech engine. Respond in plain, natural spoken sentences only. Do not use markdown, asterisks, underscores, backticks, headings, bullet points, numbered lists, tables, code blocks, emoji, or decorative symbols. Write symbols as words when they are meaningful, such as twenty percent or five dollars. Give a clear conversational answer with enough context to be useful. Usually use three to six sentences.';
const BARGE_IN_PROFILES = {
    low: {
        label: 'Low',
        calibrationMs: 450,
        thresholdRatio: 2.4,
        thresholdMargin: 0.018,
        minimumRms: 0.045,
        sustainedMs: 380
    },
    balanced: {
        label: 'Balanced',
        calibrationMs: 400,
        thresholdRatio: 1.65,
        thresholdMargin: 0.01,
        minimumRms: 0.025,
        sustainedMs: 240
    },
    high: {
        label: 'High',
        calibrationMs: 350,
        thresholdRatio: 1.25,
        thresholdMargin: 0.006,
        minimumRms: 0.015,
        sustainedMs: 160
    }
};

function normalizeSpeechRate(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 1;
    return Math.min(1.5, Math.max(0.75, Math.round(numeric * 20) / 20));
}

function normalizeBargeInSensitivity(value) {
    return Object.hasOwn(BARGE_IN_PROFILES, value) ? value : 'balanced';
}

function uniqueKeys(keys = []) {
    return [...new Set((keys || []).map(key => String(key || '').trim()).filter(Boolean))];
}

function defaultTtsConfig() {
    return {
        engine: 'browser',
        locale: 'en-US',
        browserVoiceUri: '',
        orpheusModel: 'canopylabs/orpheus-v1-english',
        orpheusVoice: 'autumn',
        orpheusLabel: 'Autumn',
        speechRate: 1,
        autoBargeIn: false,
        bargeInSensitivity: 'balanced'
    };
}

export class VoiceTurnManager {
    constructor(config = {}) {
        this.config = config;
        this.currentPhase = 'idle';
        this.active = false;
        this.generation = 0;
        this.recognition = null;
        this.streamAbort = null;
        this.queue = null;
        this.audioContext = null;
        this.history = [];
        this.sessionRecap = '';
        this.llmRotator = new KeyRotator();
        this.ttsRotator = new KeyRotator();
        this.restartTimer = null;
        this.currentTtsSource = '';
        this.interruptedPreviousTurn = false;
        this.bargeIn = null;
        this.recognitionRetryCount = 0;
        this.fallbackRecorder = null;
        this.fallbackStream = null;
        this.fallbackChunks = [];
        this.fallbackStartedAt = 0;
        this.fallbackAbort = null;
        this.listenSessionId = 0;
        this.inputSpeakerMonitor = null;
    }

    get phase() {
        return this.currentPhase;
    }

    get activeTtsSource() {
        return this.currentTtsSource;
    }

    updateConfig(patch = {}) {
        this.config = { ...this.config, ...patch };
    }

    async start() {
        if (this.active || this.currentPhase !== 'idle') return false;
        const keys = this.#keys();
        if (!keys.length) {
            this.#status('Add a Groq key in API Configuration before starting Voice.');
            return false;
        }
        const SpeechRecognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.#setPhase('error');
            this.#status('Voice mode needs Chrome or Edge on desktop.');
            return false;
        }

        this.active = true;
        const generation = ++this.generation;
        this.recognitionRetryCount = 0;
        this.llmRotator.setKeys(keys);
        this.ttsRotator.setKeys(keys);
        try {
            this.audioContext = await unlockAudioContext(this.audioContext);
        } catch (error) {
            this.audioContext = null;
            this.#status('Web Audio is unavailable; Voice will use the browser voice.');
        }
        if (!this.#isCurrent(generation)) return false;
        void this.#listen(generation);
        return true;
    }

    stop(reason = 'stopped') {
        this.active = false;
        this.generation++;
        this.listenSessionId++;
        this.recognitionRetryCount = 0;
        if (this.restartTimer) clearTimeout(this.restartTimer);
        this.restartTimer = null;
        this.#stopRecognition();
        this.#releaseFallbackCapture();
        this.fallbackAbort?.abort(new DOMException(reason, 'AbortError'));
        this.fallbackAbort = null;
        this.streamAbort?.abort(new DOMException(reason, 'AbortError'));
        this.streamAbort = null;
        this.queue?.stop();
        this.queue = null;
        void this.#stopBargeInMonitor();
        try { globalThis.speechSynthesis?.cancel(); } catch (error) {}
        this.history = [];
        this.sessionRecap = '';
        this.#setTtsSource('');
        this.#setPhase('idle');
    }

    interrupt(reason = 'user interrupted') {
        if (!this.active || this.currentPhase !== 'speaking') {
            this.stop(reason);
            return false;
        }
        this.generation++;
        this.listenSessionId++;
        this.recognitionRetryCount = 0;
        if (this.restartTimer) clearTimeout(this.restartTimer);
        this.restartTimer = null;
        this.#stopRecognition();
        this.#releaseFallbackCapture();
        this.fallbackAbort?.abort(new DOMException(reason, 'AbortError'));
        this.fallbackAbort = null;
        this.streamAbort?.abort(new DOMException(reason, 'AbortError'));
        this.streamAbort = null;
        this.queue?.stop();
        this.queue = null;
        void this.#stopBargeInMonitor();
        try { globalThis.speechSynthesis?.cancel(); } catch (error) {}
        this.interruptedPreviousTurn = true;
        this.#setTtsSource('');
        this.config.hooks?.onInterrupt?.(reason);
        const generation = this.generation;
        void this.#listen(generation);
        return true;
    }

    #keys() {
        return uniqueKeys(this.config.getGroqKeys?.() || []);
    }

    #locale() {
        return String(this.config.getLocale?.() || 'en-US');
    }

    #ttsConfig() {
        const config = { ...defaultTtsConfig(), ...(this.config.getTtsConfig?.() || {}) };
        config.speechRate = normalizeSpeechRate(config.speechRate);
        return config;
    }

    #memoryGrounding() {
        const memory = this.config.getMemoryGrounding?.() || {};
        const content = String(memory.content || '').trim();
        const enabled = !!memory.enabled && !!content;
        return {
            enabled,
            packId: String(memory.packId || ''),
            packName: String(memory.packName || 'Primary'),
            content: enabled ? content : '',
            includedChars: enabled ? Number(memory.includedChars || content.length || 0) : 0,
            rawChars: Number(memory.rawChars || 0),
            truncated: !!memory.truncated,
            empty: !!memory.empty || !content
        };
    }

    #memoryRules() {
        return [
            "You may use LONG-TERM MEMORY only for the user's identity, projects, preferences, terminology, and stable background context.",
            "Memory is background only. The user's latest spoken message and any correction always take priority over memory.",
            'If memory conflicts with what the user just said, follow the user and, if useful, briefly note the discrepancy.',
            'Never claim that memory has been updated unless the user explicitly imported or changed it in the Memory tab.'
        ].join(' ');
    }

    #buildMemoryMessage(memory) {
        if (!memory.enabled || !memory.content) return null;
        return {
            role: 'system',
            content: [
                'LONG-TERM MEMORY (background, lower priority than the live conversation):',
                `Active memory pack: ${memory.packName || 'Primary'}`,
                '',
                memory.content
            ].join('\n')
        };
    }

    #buildSessionRecapMessage() {
        const recap = String(this.sessionRecap || '').trim();
        if (!recap) return null;
        return {
            role: 'system',
            content: `Conversation so far (session-only, lower priority than the latest user message): ${recap}`
        };
    }

    #compactMessageForRecap(message = {}) {
        const role = message.role === 'assistant' ? 'Assistant' : 'User';
        const content = String(message.content || '').replace(/\s+/g, ' ').trim();
        if (!content) return '';
        return `${role}: ${content.slice(0, 260)}`;
    }

    #foldOverflowHistory() {
        const overflowCount = Math.max(0, this.history.length - MAX_HISTORY_MESSAGES);
        if (!overflowCount) return;
        const overflow = this.history.splice(0, overflowCount);
        const additions = overflow.map(message => this.#compactMessageForRecap(message)).filter(Boolean);
        if (!additions.length) return;
        const combined = [this.sessionRecap, ...additions].filter(Boolean).join(' ');
        this.sessionRecap = combined.length > MAX_SESSION_RECAP_CHARS
            ? combined.slice(-MAX_SESSION_RECAP_CHARS).replace(/^\S*\s*/, '').trim()
            : combined;
    }

    #notifyMemoryGrounding(memory, messages = []) {
        this.config.hooks?.onMemoryGrounding?.({
            enabled: memory.enabled,
            packId: memory.packId,
            packName: memory.packName,
            includedChars: memory.includedChars,
            rawChars: memory.rawChars,
            truncated: memory.truncated,
            empty: memory.empty,
            hasSessionRecap: !!this.sessionRecap,
            sessionRecapChars: String(this.sessionRecap || '').length,
            messageRoleOrder: messages.map(message => message.role)
        });
    }

    #messageChars(messages = []) {
        return messages.reduce((total, message) => total + String(message?.content || '').length, 0);
    }

    #fitGroundedMessages({
        systemMessage,
        memory,
        recapMessage,
        historyMessages,
        interruptMessage
    }) {
        let effectiveMemory = { ...memory };
        let effectiveMemoryMessage = this.#buildMemoryMessage(effectiveMemory);
        let effectiveRecapMessage = recapMessage ? { ...recapMessage } : null;
        const recentHistory = historyMessages.map(message => ({ ...message }));
        const latestUserMessage = recentHistory.pop() || null;

        const assemble = () => [
            systemMessage,
            ...(effectiveMemoryMessage ? [effectiveMemoryMessage] : []),
            ...(effectiveRecapMessage ? [effectiveRecapMessage] : []),
            ...recentHistory,
            ...(interruptMessage ? [interruptMessage] : []),
            ...(latestUserMessage ? [latestUserMessage] : [])
        ];

        let messages = assemble();
        let overflow = this.#messageChars(messages) - MAX_GROUNDED_CONTEXT_CHARS;

        if (overflow > 0 && effectiveRecapMessage) {
            const prefix = 'Conversation so far (session-only, lower priority than the latest user message): ';
            const recap = String(effectiveRecapMessage.content || '').slice(prefix.length);
            const keepChars = Math.max(0, recap.length - overflow);
            effectiveRecapMessage = keepChars > 0
                ? { ...effectiveRecapMessage, content: `${prefix}${recap.slice(-keepChars).replace(/^\S*\s*/, '').trim()}` }
                : null;
            messages = assemble();
            overflow = this.#messageChars(messages) - MAX_GROUNDED_CONTEXT_CHARS;
        }

        while (overflow > 0 && recentHistory.length) {
            recentHistory.shift();
            messages = assemble();
            overflow = this.#messageChars(messages) - MAX_GROUNDED_CONTEXT_CHARS;
        }

        if (overflow > 0 && effectiveMemoryMessage) {
            const keepChars = Math.max(0, effectiveMemory.content.length - overflow);
            const content = effectiveMemory.content.slice(0, keepChars).trim();
            effectiveMemory = {
                ...effectiveMemory,
                content,
                includedChars: content.length,
                truncated: true,
                empty: !content
            };
            effectiveMemoryMessage = content ? this.#buildMemoryMessage(effectiveMemory) : null;
            messages = assemble();
        }

        return { messages, memory: effectiveMemory };
    }

    #primeSpeakerConfig() {
        const config = this.config.getPrimeSpeakerConfig?.() || {};
        const profile = config.profile;
        const validProfile = profile?.version === 1
            && Number.isFinite(profile.f0Mean)
            && Number.isFinite(profile.centroidMean)
            && Array.isArray(profile.mfccMean)
            && Array.isArray(profile.mfccStd)
            && profile.mfccMean.length === 8
            && profile.mfccStd.length === 8;
        return {
            enabled: !!config.enabled && validProfile,
            profile: validProfile ? profile : null,
            frameMatchMin: Math.min(1, Math.max(0, Number(config.frameMatchMin) || 0.62)),
            utteranceMatchFraction: Math.min(
                1,
                Math.max(0, Number(config.utteranceMatchFraction) || 0.6)
            )
        };
    }

    #primeSpeakerGate(frames, context = 'input') {
        const config = this.#primeSpeakerConfig();
        if (!config.enabled) return true;
        if (!Array.isArray(frames)) {
            this.config.hooks?.onPrimeSpeakerGate?.({
                context,
                accepted: true,
                reason: 'analysis-unavailable'
            });
            this.#status('Prime-speaker analysis was unavailable for this utterance; accepting it normally.');
            return true;
        }
        const result = scoreWindow(config.profile, frames, config.frameMatchMin);
        const accepted = result.voicedFrames >= 12
            && result.matchFraction >= config.utteranceMatchFraction;
        this.config.hooks?.onPrimeSpeakerGate?.({
            context,
            accepted,
            reason: accepted ? 'matched' : result.voicedFrames < 12 ? 'insufficient-voice' : 'different-speaker',
            matchFraction: result.matchFraction,
            voicedFrames: result.voicedFrames
        });
        return accepted;
    }

    #resumeAfterSpeakerRejection(generation) {
        if (!this.#isCurrent(generation)) return;
        this.config.hooks?.onUserText?.('', false);
        this.#status('Different speaker ignored. Listening for the prime user.');
        this.restartTimer = setTimeout(() => {
            this.restartTimer = null;
            if (this.#isCurrent(generation)) void this.#listen(generation);
        }, 250);
    }

    #isCurrent(generation) {
        return this.active && generation === this.generation;
    }

    #setPhase(phase) {
        this.currentPhase = phase;
        this.config.hooks?.onState?.(phase);
    }

    #setTtsSource(source = '', detail = '') {
        this.currentTtsSource = source;
        this.config.hooks?.onTtsSource?.(source, detail);
    }

    #status(message = '') {
        this.config.hooks?.onStatus?.(String(message || ''));
    }

    #error(message, error = null) {
        this.config.hooks?.onError?.(String(message || 'Voice mode failed'), error);
    }

    #recognitionDiagnostic(details = {}) {
        this.config.onRecognitionDiagnostic?.({
            timestamp: new Date().toISOString(),
            phase: this.currentPhase,
            ...details
        });
    }

    async #stopBargeInMonitor() {
        const monitor = this.bargeIn;
        this.bargeIn = null;
        if (!monitor) return;
        try { monitor.source?.disconnect?.(); } catch (error) {}
        try { monitor.analyser?.disconnect?.(); } catch (error) {}
        if (monitor.timer) clearInterval(monitor.timer);
        for (const track of monitor.stream?.getTracks?.() || []) {
            try { track.stop(); } catch (error) {}
        }
        this.config.hooks?.onBargeInStatus?.({
            state: 'inactive',
            sensitivity: monitor.sensitivity
        });
    }

    async #startBargeInMonitor(generation) {
        const ttsConfig = this.#ttsConfig();
        if (!this.#isCurrent(generation) || !ttsConfig.autoBargeIn) return;
        const sensitivity = normalizeBargeInSensitivity(ttsConfig.bargeInSensitivity);
        const profile = BARGE_IN_PROFILES[sensitivity];
        const primeSpeaker = this.#primeSpeakerConfig();
        if (!globalThis.navigator?.mediaDevices?.getUserMedia || !this.audioContext) {
            this.config.hooks?.onBargeInStatus?.({ state: 'unavailable', sensitivity });
            return;
        }
        await this.#stopBargeInMonitor();
        if (!this.#isCurrent(generation) || this.currentPhase !== 'speaking') return;
        this.config.hooks?.onBargeInStatus?.({ state: 'starting', sensitivity });
        let stream = null;
        try {
            stream = await globalThis.navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: !primeSpeaker.enabled
                }
            });
            if (!this.#isCurrent(generation) || this.currentPhase !== 'speaking') {
                for (const track of stream.getTracks()) track.stop();
                return;
            }
            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = primeSpeaker.enabled ? 2048 : 1024;
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            const data = primeSpeaker.enabled ? null : new Uint8Array(analyser.fftSize);
            const primeTimeData = primeSpeaker.enabled ? new Float32Array(analyser.fftSize) : null;
            const primeFreqData = primeSpeaker.enabled
                ? new Float32Array(analyser.frequencyBinCount)
                : null;
            const startedAt = Date.now();
            let ambientRms = 0;
            let calibrationSamples = 0;
            let calibrated = false;
            let loudSince = 0;
            let primeMatchMs = 0;
            const timer = setInterval(() => {
                if (!this.#isCurrent(generation) || this.currentPhase !== 'speaking') {
                    void this.#stopBargeInMonitor();
                    return;
                }
                let sum = 0;
                if (primeSpeaker.enabled) {
                    analyser.getFloatTimeDomainData(primeTimeData);
                    for (const value of primeTimeData) sum += value * value;
                } else {
                    analyser.getByteTimeDomainData(data);
                    for (const value of data) {
                        const normalized = (value - 128) / 128;
                        sum += normalized * normalized;
                    }
                }
                const rms = Math.sqrt(sum / (primeSpeaker.enabled ? primeTimeData.length : data.length));
                const now = Date.now();
                if (now - startedAt < profile.calibrationMs) {
                    calibrationSamples++;
                    ambientRms += (rms - ambientRms) / calibrationSamples;
                    return;
                }
                const threshold = Math.min(
                    0.18,
                    Math.max(
                        profile.minimumRms,
                        ambientRms * profile.thresholdRatio + profile.thresholdMargin
                    )
                );
                if (!calibrated) {
                    calibrated = true;
                    this.config.hooks?.onBargeInStatus?.({
                        state: 'monitoring',
                        sensitivity,
                        ambientRms,
                        threshold
                    });
                }
                if (primeSpeaker.enabled) {
                    const requiredSustain = sensitivity === 'low'
                        ? 350
                        : sensitivity === 'high'
                            ? 250
                            : 300;
                    let matched = false;
                    if (rms >= threshold) {
                        analyser.getFloatFrequencyData(primeFreqData);
                        const features = extractFrameFeatures(
                            primeTimeData,
                            primeFreqData,
                            this.audioContext.sampleRate
                        );
                        const modeMatchMinimum = sensitivity === 'low' ? 0.7 : 0.62;
                        const matchMinimum = Math.min(
                            1,
                            Math.max(modeMatchMinimum, primeSpeaker.frameMatchMin) + 0.03
                        );
                        matched = !!features
                            && scoreFrame(primeSpeaker.profile, features) >= matchMinimum;
                    }
                    primeMatchMs = matched
                        ? Math.min(requiredSustain, primeMatchMs + 50)
                        : Math.max(0, primeMatchMs - 25);
                    if (primeMatchMs >= requiredSustain) {
                        this.config.hooks?.onBargeInStatus?.({
                            state: 'triggered',
                            sensitivity,
                            ambientRms,
                            threshold
                        });
                        this.config.hooks?.onStatus?.('Interruption detected; listening for your correction.');
                        this.interrupt('auto barge-in');
                        return;
                    }
                    if (rms < threshold) {
                        ambientRms = ambientRms
                            ? ambientRms * 0.97 + rms * 0.03
                            : rms;
                    }
                    return;
                }
                if (rms >= threshold) {
                    if (!loudSince) loudSince = now;
                    if (now - loudSince >= profile.sustainedMs) {
                        this.config.hooks?.onBargeInStatus?.({
                            state: 'triggered',
                            sensitivity,
                            ambientRms,
                            threshold
                        });
                        this.config.hooks?.onStatus?.('Interruption detected; listening for your correction.');
                        this.interrupt('auto barge-in');
                    }
                    return;
                }
                loudSince = 0;
                ambientRms = ambientRms
                    ? ambientRms * 0.97 + rms * 0.03
                    : rms;
            }, 50);
            this.bargeIn = { stream, analyser, source, timer, sensitivity };
            this.config.hooks?.onBargeInStatus?.({ state: 'calibrating', sensitivity });
        } catch (error) {
            for (const track of stream?.getTracks?.() || []) {
                try { track.stop(); } catch (stopError) {}
            }
            if (this.#isCurrent(generation)) {
                this.config.hooks?.onBargeInStatus?.({ state: 'unavailable', sensitivity });
                this.config.hooks?.onStatus?.('Automatic interruption is unavailable for this microphone session.');
            }
        }
    }

    #stopInputSpeakerMonitor() {
        const monitor = this.inputSpeakerMonitor;
        this.inputSpeakerMonitor = null;
        if (!monitor) return null;
        if (monitor.timer) clearInterval(monitor.timer);
        try { monitor.source?.disconnect?.(); } catch (error) {}
        try { monitor.analyser?.disconnect?.(); } catch (error) {}
        return monitor.frames;
    }

    #startInputSpeakerMonitor(stream) {
        const primeSpeaker = this.#primeSpeakerConfig();
        if (!primeSpeaker.enabled || !this.audioContext || !stream) return false;
        try {
            this.#stopInputSpeakerMonitor();
            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.2;
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            const timeData = new Float32Array(analyser.fftSize);
            const freqData = new Float32Array(analyser.frequencyBinCount);
            const frames = [];
            const timer = setInterval(() => {
                analyser.getFloatTimeDomainData(timeData);
                analyser.getFloatFrequencyData(freqData);
                const features = extractFrameFeatures(
                    timeData,
                    freqData,
                    this.audioContext.sampleRate
                );
                if (features && frames.length < 600) frames.push(features);
            }, 35);
            this.inputSpeakerMonitor = { analyser, source, timer, frames };
            return true;
        } catch (error) {
            this.#stopInputSpeakerMonitor();
            this.config.hooks?.onPrimeSpeakerGate?.({
                context: 'input',
                accepted: true,
                reason: 'analysis-unavailable'
            });
            return false;
        }
    }

    #releaseFallbackCapture() {
        const recorder = this.fallbackRecorder;
        const stream = this.fallbackStream;
        this.#stopInputSpeakerMonitor();
        this.fallbackRecorder = null;
        this.fallbackStream = null;
        this.fallbackChunks = [];
        this.fallbackStartedAt = 0;
        if (recorder) {
            recorder.ondataavailable = null;
            recorder.onstop = null;
            recorder.onerror = null;
            try {
                if (recorder.state !== 'inactive') recorder.stop();
            } catch (error) {}
        }
        for (const track of stream?.getTracks?.() || []) {
            try { track.stop(); } catch (error) {}
        }
    }

    async #startFallbackCapture(generation, listenSessionId) {
        this.#releaseFallbackCapture();
        const MediaRecorderCtor = globalThis.MediaRecorder;
        if (!globalThis.navigator?.mediaDevices?.getUserMedia) return false;
        const primeSpeaker = this.#primeSpeakerConfig();
        if (!MediaRecorderCtor && !primeSpeaker.enabled) return false;
        let stream = null;
        try {
            stream = await globalThis.navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: !primeSpeaker.enabled
                },
                video: false
            });
            if (!this.#isCurrent(generation) || listenSessionId !== this.listenSessionId) {
                for (const track of stream.getTracks()) track.stop();
                return false;
            }
            const chunks = [];
            const recorder = MediaRecorderCtor ? new MediaRecorderCtor(stream) : null;
            if (recorder) {
                recorder.ondataavailable = (event) => {
                    if (event.data?.size) chunks.push(event.data);
                };
                recorder.onerror = (event) => {
                    this.#recognitionDiagnostic({
                        error: 'fallback-capture',
                        message: String(event?.error?.message || 'Fallback microphone recording failed')
                    });
                };
                recorder.start(250);
            }
            this.fallbackRecorder = recorder;
            this.fallbackStream = stream;
            this.fallbackChunks = chunks;
            this.fallbackStartedAt = Date.now();
            this.#startInputSpeakerMonitor(stream);
            return true;
        } catch (error) {
            for (const track of stream?.getTracks?.() || []) {
                try { track.stop(); } catch (stopError) {}
            }
            this.#recognitionDiagnostic({
                error: 'fallback-capture',
                message: String(error?.message || 'Fallback microphone capture is unavailable')
            });
            return false;
        }
    }

    async #collectFallbackCapture() {
        const recorder = this.fallbackRecorder;
        const stream = this.fallbackStream;
        const chunks = this.fallbackChunks;
        const startedAt = this.fallbackStartedAt;
        const speakerFrames = this.#stopInputSpeakerMonitor();
        this.fallbackRecorder = null;
        this.fallbackStream = null;
        this.fallbackChunks = [];
        this.fallbackStartedAt = 0;
        if (!recorder) {
            for (const track of stream?.getTracks?.() || []) {
                try { track.stop(); } catch (error) {}
            }
            return {
                blob: null,
                durationMs: startedAt ? Math.max(0, Date.now() - startedAt) : 0,
                speakerFrames
            };
        }

        return new Promise((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                recorder.ondataavailable = null;
                recorder.onstop = null;
                recorder.onerror = null;
                for (const track of stream?.getTracks?.() || []) {
                    try { track.stop(); } catch (error) {}
                }
                const type = recorder.mimeType || chunks[0]?.type || 'audio/webm';
                resolve({
                    blob: chunks.length ? new Blob(chunks, { type }) : null,
                    durationMs: startedAt ? Math.max(0, Date.now() - startedAt) : 0,
                    speakerFrames
                });
            };
            recorder.onstop = finish;
            try {
                if (recorder.state === 'inactive') finish();
                else recorder.stop();
            } catch (error) {
                finish();
            }
        });
    }

    #stopRecognition() {
        const recognition = this.recognition;
        this.recognition = null;
        if (!recognition) return;
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onspeechstart = null;
        recognition.onsoundstart = null;
        try { recognition.abort?.(); } catch (error) {
            try { recognition.stop?.(); } catch (stopError) {}
        }
    }

    #scheduleRecognitionRetry(generation, details = {}) {
        if (!this.#isCurrent(generation)) return;
        const retry = this.recognitionRetryCount + 1;
        this.recognitionRetryCount = retry;
        if (retry > 3) {
            this.active = false;
            this.generation++;
            this.listenSessionId++;
            this.#releaseFallbackCapture();
            this.#setPhase('idle');
            this.#status('Voice input is temporarily unavailable. Check your connection and saved Groq keys, then press Start to retry.');
            this.#recognitionDiagnostic({
                ...details,
                outcome: 'retries-exhausted',
                retry: 3
            });
            return;
        }
        const delays = [500, 1000, 2000];
        const delayMs = delays[retry - 1];
        this.#setPhase('recovering');
        this.#status(`Reconnecting to browser speech service - attempt ${retry} of 3...`);
        this.#recognitionDiagnostic({
            ...details,
            outcome: 'retry-scheduled',
            retry,
            delayMs
        });
        if (this.restartTimer) clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => {
            this.restartTimer = null;
            if (this.#isCurrent(generation)) void this.#listen(generation);
        }, delayMs);
    }

    async #recoverRecognitionNetworkFailure({
        generation,
        listenSessionId,
        finalText,
        interimText,
        speechObserved,
        event
    }) {
        if (!this.#isCurrent(generation) || listenSessionId !== this.listenSessionId) return;
        this.#stopRecognition();
        const locale = this.#locale();
        const diagnostic = {
            error: 'network',
            message: String(event?.message || ''),
            locale,
            hadSpeech: !!speechObserved,
            hadInterim: !!interimText,
            hadFinal: !!finalText
        };

        if (finalText.trim()) {
            const speakerFrames = this.#stopInputSpeakerMonitor();
            this.#releaseFallbackCapture();
            if (!this.#primeSpeakerGate(speakerFrames, 'browser-final')) {
                this.#resumeAfterSpeakerRejection(generation);
                return;
            }
            this.recognitionRetryCount = 0;
            this.#recognitionDiagnostic({ ...diagnostic, outcome: 'final-preserved' });
            this.config.hooks?.onUserText?.(finalText.trim(), true);
            await this.#runTurn(finalText.trim(), generation);
            return;
        }

        if (speechObserved || interimText.trim()) {
            this.#setPhase('recovering');
            this.#status('Recovering your speech...');
            const capture = await this.#collectFallbackCapture();
            if (!this.#isCurrent(generation) || listenSessionId !== this.listenSessionId) return;
            const canTranscribe = capture.blob?.size > 0
                && typeof this.config.transcribeFallback === 'function';
            if (canTranscribe) {
                const controller = new AbortController();
                this.fallbackAbort?.abort(new DOMException('Replaced by a newer recovery', 'AbortError'));
                this.fallbackAbort = controller;
                this.#recognitionDiagnostic({
                    ...diagnostic,
                    outcome: 'fallback-started',
                    audioBytes: capture.blob.size,
                    audioDurationMs: capture.durationMs
                });
                try {
                    const recoveredText = String(await this.config.transcribeFallback({
                        blob: capture.blob,
                        language: locale,
                        signal: controller.signal
                    }) || '').trim();
                    if (!this.#isCurrent(generation)
                        || listenSessionId !== this.listenSessionId
                        || controller.signal.aborted) return;
                    if (recoveredText) {
                        if (!this.#primeSpeakerGate(capture.speakerFrames, 'whisper-recovery')) {
                            this.#resumeAfterSpeakerRejection(generation);
                            return;
                        }
                        this.recognitionRetryCount = 0;
                        this.#status('Recovered with Groq transcription.');
                        this.#recognitionDiagnostic({
                            ...diagnostic,
                            outcome: 'fallback-succeeded',
                            audioBytes: capture.blob.size,
                            audioDurationMs: capture.durationMs
                        });
                        this.config.hooks?.onUserText?.(recoveredText, true);
                        await this.#runTurn(recoveredText, generation);
                        return;
                    }
                    this.#recognitionDiagnostic({
                        ...diagnostic,
                        outcome: 'fallback-empty',
                        audioBytes: capture.blob.size,
                        audioDurationMs: capture.durationMs
                    });
                } catch (error) {
                    if (controller.signal.aborted || !this.#isCurrent(generation)) return;
                    this.#recognitionDiagnostic({
                        ...diagnostic,
                        outcome: 'fallback-failed',
                        audioBytes: capture.blob.size,
                        audioDurationMs: capture.durationMs,
                        fallbackError: String(error?.message || 'Fallback transcription failed')
                    });
                } finally {
                    if (this.fallbackAbort === controller) this.fallbackAbort = null;
                }
            } else {
                this.#recognitionDiagnostic({
                    ...diagnostic,
                    outcome: 'fallback-unavailable',
                    audioBytes: capture.blob?.size || 0,
                    audioDurationMs: capture.durationMs
                });
            }
        } else {
            this.#releaseFallbackCapture();
        }

        this.#scheduleRecognitionRetry(generation, diagnostic);
    }

    async #listen(generation) {
        if (!this.#isCurrent(generation)) return;
        const SpeechRecognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.#setPhase('error');
            this.#status('Voice mode needs Chrome or Edge on desktop.');
            return;
        }

        const listenSessionId = ++this.listenSessionId;
        await this.#startFallbackCapture(generation, listenSessionId);
        if (!this.#isCurrent(generation) || listenSessionId !== this.listenSessionId) return;

        const recognition = new SpeechRecognition();
        this.recognition = recognition;
        recognition.lang = this.#locale();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        let finalText = '';
        let interimText = '';
        let speechObserved = false;
        let recoveryStarted = false;

        recognition.onspeechstart = () => {
            if (this.#isCurrent(generation) && listenSessionId === this.listenSessionId) {
                speechObserved = true;
            }
        };

        recognition.onresult = (event) => {
            if (!this.#isCurrent(generation)
                || listenSessionId !== this.listenSessionId
                || this.currentPhase !== 'listening') return;
            speechObserved = true;
            interimText = '';
            for (let index = event.resultIndex; index < event.results.length; index++) {
                const result = event.results[index];
                const text = String(result?.[0]?.transcript || '').trim();
                if (!text) continue;
                if (result.isFinal) finalText = `${finalText} ${text}`.trim();
                else interimText = `${interimText} ${text}`.trim();
            }
            const primeSpeakerActive = this.#primeSpeakerConfig().enabled;
            this.config.hooks?.onUserText?.(
                (finalText || interimText).trim(),
                primeSpeakerActive ? false : !!finalText
            );
        };

        recognition.onerror = (event) => {
            if (!this.#isCurrent(generation) || listenSessionId !== this.listenSessionId) return;
            if (event?.error === 'aborted' || event?.error === 'no-speech') return;
            if (event?.error === 'network') {
                if (recoveryStarted) return;
                recoveryStarted = true;
                void this.#recoverRecognitionNetworkFailure({
                    generation,
                    listenSessionId,
                    finalText: finalText.trim(),
                    interimText: interimText.trim(),
                    speechObserved,
                    event
                });
                return;
            }
            this.#releaseFallbackCapture();
            this.#setPhase('error');
            const messages = {
                'audio-capture': 'Microphone capture failed. Check that the microphone is connected and available.',
                'not-allowed': 'Microphone access was denied. Allow microphone access for this site and try again.',
                'service-not-allowed': 'Browser speech recognition is blocked by browser policy or privacy settings.',
                'language-not-supported': `Browser speech recognition does not support ${recognition.lang}. Choose another language and try again.`
            };
            const message = messages[event?.error]
                || `Speech recognition failed: ${event?.error || 'unknown error'}.`;
            this.#recognitionDiagnostic({
                error: String(event?.error || 'unknown'),
                message: String(event?.message || ''),
                locale: recognition.lang,
                hadSpeech: speechObserved,
                hadInterim: !!interimText,
                hadFinal: !!finalText,
                outcome: 'terminal'
            });
            this.#error(message, event);
        };

        recognition.onend = () => {
            if (this.recognition === recognition) this.recognition = null;
            if (recoveryStarted
                || !this.#isCurrent(generation)
                || listenSessionId !== this.listenSessionId
                || this.currentPhase !== 'listening') return;
            const speakerFrames = this.#stopInputSpeakerMonitor();
            this.#releaseFallbackCapture();
            const text = finalText.trim();
            if (text) {
                if (!this.#primeSpeakerGate(speakerFrames, 'browser-final')) {
                    this.#resumeAfterSpeakerRejection(generation);
                    return;
                }
                this.recognitionRetryCount = 0;
                if (this.#primeSpeakerConfig().enabled) {
                    this.config.hooks?.onUserText?.(text, true);
                }
                void this.#runTurn(text, generation);
                return;
            }
            this.restartTimer = setTimeout(() => void this.#listen(generation), 250);
        };

        this.#setPhase('listening');
        try {
            recognition.start();
        } catch (error) {
            this.#stopRecognition();
            this.#releaseFallbackCapture();
            this.#scheduleRecognitionRetry(generation, {
                error: 'start-failed',
                message: String(error?.message || 'Could not start speech recognition'),
                locale: recognition.lang,
                hadSpeech: false,
                hadInterim: false,
                hadFinal: false
            });
        }
    }

    async #runTurn(userText, generation) {
        if (!this.#isCurrent(generation)) return;
        this.#stopRecognition();
        this.#releaseFallbackCapture();
        void this.#stopBargeInMonitor();
        this.#setPhase('thinking');
        this.history.push({ role: 'user', content: userText });

        const keys = this.#keys();
        this.llmRotator.setKeys(keys);
        this.ttsRotator.setKeys(keys);
        const ttsConfig = this.#ttsConfig();
        const browserVoice = selectBrowserVoice(
            globalThis.speechSynthesis?.getVoices?.() || [],
            ttsConfig.browserVoiceUri,
            ttsConfig.locale
        );
        const browserVoiceLabel = describeBrowserVoice(browserVoice);
        const effectiveEngine = ttsConfig.engine === 'orpheus' && this.audioContext ? 'orpheus' : 'browser';
        if (ttsConfig.engine === 'orpheus' && effectiveEngine === 'browser') {
            this.#status(`Orpheus is unavailable here; using browser voice: ${browserVoiceLabel}.`);
            this.#setTtsSource('fallback-browser', browserVoiceLabel);
        } else if (effectiveEngine === 'browser') {
            this.#setTtsSource('browser', browserVoiceLabel);
        }

        let assistantText = '';
        let chunkCount = 0;
        let settledChunks = 0;
        let streamComplete = false;
        let fallbackNoted = false;
        let activeSynthesis = 0;
        const synthesisJobs = [];

        this.queue = new AudioQueue({
            audioContext: this.audioContext,
            onStart: () => {
                if (!this.#isCurrent(generation)) return;
                this.#setPhase('speaking');
                void this.#startBargeInMonitor(generation);
            },
            onIdle: () => {
                if (!this.#isCurrent(generation)) return;
                void this.#stopBargeInMonitor();
                void this.#listen(generation);
            }
        });

        const maybeFinishQueue = () => {
            if (!this.#isCurrent(generation)) return;
            if (streamComplete && settledChunks === chunkCount && activeSynthesis === 0 && synthesisJobs.length === 0) {
                this.queue?.markDone(chunkCount);
            }
        };

        const synthesizeJob = async ({ index, text }) => {
            const attempted = new Set();
            let lastError = null;
            for (let attempt = 0; attempt < 2; attempt++) {
                const key = this.ttsRotator.next(attempted);
                if (!key) break;
                attempted.add(key);
                try {
                    const encoded = await synthOrpheus({
                        text,
                        apiKey: key,
                        model: ttsConfig.orpheusModel,
                        voice: ttsConfig.orpheusVoice,
                        speed: ttsConfig.speechRate,
                        signal: this.streamAbort?.signal || null
                    });
                    if (!this.#isCurrent(generation)) return;
                    this.#setTtsSource('orpheus', ttsConfig.orpheusLabel || ttsConfig.orpheusVoice);
                    await this.queue?.addEncoded(index, encoded);
                    return;
                } catch (error) {
                    lastError = error;
                    this.config.hooks?.onProviderError?.(error);
                    if (!error?.retryable) break;
                }
            }
            if (!this.#isCurrent(generation)) return;
            if (!fallbackNoted) {
                fallbackNoted = true;
                const message = lastError?.code === 'model_terms_required'
                    ? 'Accept Orpheus preview model terms in Groq Console, then retry.'
                    : `Orpheus unavailable; using browser voice: ${browserVoiceLabel}.`;
                this.#status(message);
                this.#setTtsSource('fallback-browser', browserVoiceLabel);
            }
            this.queue?.addBrowser(index, text, {
                voice: browserVoice,
                rate: ttsConfig.speechRate
            });
            if (lastError) this.config.hooks?.onFallback?.(lastError);
        };

        const drainSynthesis = () => {
            while (this.#isCurrent(generation) && activeSynthesis < 2 && synthesisJobs.length) {
                const job = synthesisJobs.shift();
                activeSynthesis++;
                synthesizeJob(job).finally(() => {
                    if (!this.#isCurrent(generation)) return;
                    activeSynthesis--;
                    settledChunks++;
                    drainSynthesis();
                    maybeFinishQueue();
                });
            }
        };

        const splitter = new SentenceSplitter({
            softCap: 160,
            maxChars: 190,
            onChunk: (text) => {
                const spokenChunks = splitSpeechForProvider(sanitizeForSpeech(text), 190);
                for (const spokenText of spokenChunks) {
                    const index = chunkCount++;
                    if (effectiveEngine === 'browser') {
                        this.#setTtsSource('browser', browserVoiceLabel);
                        this.queue?.addBrowser(index, spokenText, {
                            voice: browserVoice,
                            rate: ttsConfig.speechRate
                        });
                        settledChunks++;
                        maybeFinishQueue();
                        continue;
                    }
                    synthesisJobs.push({ index, text: spokenText });
                }
                drainSynthesis();
            }
        });

        const attemptedLlmKeys = new Set();
        const includeInterruptContext = this.interruptedPreviousTurn;
        let completed = false;
        let terminalError = null;
        while (this.#isCurrent(generation) && attemptedLlmKeys.size < keys.length) {
            const apiKey = this.llmRotator.next(attemptedLlmKeys);
            if (!apiKey) break;
            attemptedLlmKeys.add(apiKey);
            this.streamAbort = new AbortController();
            let acceptedDelta = false;
            try {
                let memory = this.#memoryGrounding();
                let messages;
                if (memory.enabled) {
                    const interruptMessage = includeInterruptContext
                        ? {
                            role: 'system',
                            content: 'The user interrupted your previous answer. The latest user utterance is an authoritative correction and overrides memory, session recap, and earlier turns. Adapt to the correction and respond briefly.'
                        }
                        : null;
                    const fitted = this.#fitGroundedMessages({
                        systemMessage: {
                            role: 'system',
                            content: `${this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT} ${this.#memoryRules()}`
                        },
                        memory,
                        recapMessage: this.#buildSessionRecapMessage(),
                        historyMessages: this.history.slice(-(MAX_HISTORY_MESSAGES + 1)),
                        interruptMessage
                    });
                    messages = fitted.messages;
                    memory = fitted.memory;
                } else {
                    messages = [
                        { role: 'system', content: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
                        ...this.history.slice(-(MAX_HISTORY_MESSAGES + 1))
                    ];
                }
                if (includeInterruptContext && !memory.enabled) {
                    messages.splice(1, 0, {
                        role: 'system',
                        content: 'The user interrupted your previous answer. Adapt to their correction and respond briefly.'
                    });
                }
                this.#notifyMemoryGrounding(memory, messages);
                await streamChat({
                    endpoint: this.config.chatEndpoint,
                    apiKey,
                    model: this.config.getChatModel?.() || 'openai/gpt-oss-120b',
                    messages,
                    signal: this.streamAbort.signal,
                    onDelta: (delta) => {
                        if (!this.#isCurrent(generation)) return;
                        acceptedDelta = true;
                        assistantText += delta;
                        this.config.hooks?.onAssistantText?.(assistantText);
                        splitter.push(delta);
                    }
                });
                completed = true;
                break;
            } catch (error) {
                terminalError = error;
                if (!this.#isCurrent(generation) || this.streamAbort?.signal?.aborted) return;
                if (acceptedDelta || error?.receivedDelta || !error?.retryable) break;
            }
        }

        if (!this.#isCurrent(generation)) return;
        splitter.flush();
        streamComplete = true;
        if (completed) {
            if (includeInterruptContext) this.interruptedPreviousTurn = false;
            if (assistantText.trim()) this.history.push({ role: 'assistant', content: assistantText.trim() });
            this.#foldOverflowHistory();
        } else {
            this.#setPhase('error');
            this.#error(terminalError?.message || 'Voice reply failed. Listening will resume.', terminalError);
            if (!chunkCount) {
                this.restartTimer = setTimeout(() => {
                    if (this.#isCurrent(generation)) void this.#listen(generation);
                }, 700);
                return;
            }
        }
        maybeFinishQueue();
    }
}
