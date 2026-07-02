import { speakBrowser } from './tts-engine.js';

export async function unlockAudioContext(existingContext = null) {
    const AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextCtor) return null;
    const context = existingContext || new AudioContextCtor();
    if (context.state === 'suspended') await context.resume();
    return context;
}

export class AudioQueue {
    constructor({
        audioContext = null,
        playBrowser = speakBrowser,
        onStart = null,
        onIdle = null
    } = {}) {
        this.context = audioContext;
        this.playBrowser = playBrowser;
        this.onStart = typeof onStart === 'function' ? onStart : null;
        this.onIdle = typeof onIdle === 'function' ? onIdle : null;
        this.ready = new Map();
        this.scheduled = new Map();
        this.nextIndex = 0;
        this.expectedCount = null;
        this.scheduledUntil = 0;
        this.browserPlaying = false;
        this.browserAbort = null;
        this.started = false;
        this.stopped = false;
        this.generation = 0;
    }

    async addEncoded(index, arrayBuffer) {
        if (!this.context) throw new Error('Web Audio is unavailable');
        const generation = this.generation;
        const buffer = await this.context.decodeAudioData(arrayBuffer.slice(0));
        if (this.stopped || generation !== this.generation) return false;
        this.ready.set(Number(index), { type: 'audio', buffer });
        this.#pump();
        return true;
    }

    addBrowser(index, text, options = {}) {
        if (this.stopped) return false;
        this.ready.set(Number(index), { type: 'browser', text: String(text || ''), options });
        this.#pump();
        return true;
    }

    markDone(expectedCount) {
        if (this.stopped) return;
        this.expectedCount = Math.max(0, Number(expectedCount) || 0);
        this.#pump();
        this.#maybeIdle();
    }

    stop() {
        if (this.stopped) return;
        this.stopped = true;
        this.generation++;
        this.ready.clear();
        this.expectedCount = this.nextIndex;
        this.browserAbort?.abort(new DOMException('Stopped', 'AbortError'));
        this.browserAbort = null;
        for (const source of this.scheduled.values()) {
            try { source.stop(); } catch (error) {}
        }
        this.scheduled.clear();
        try { globalThis.speechSynthesis?.cancel(); } catch (error) {}
    }

    #notifyStart() {
        if (this.started) return;
        this.started = true;
        if (this.onStart) this.onStart();
    }

    #pump() {
        if (this.stopped || this.browserPlaying) return;
        while (this.ready.has(this.nextIndex)) {
            const entry = this.ready.get(this.nextIndex);
            if (entry.type === 'browser') {
                if (this.scheduled.size) return;
                const index = this.nextIndex++;
                this.ready.delete(index);
                this.browserPlaying = true;
                this.browserAbort = new AbortController();
                this.#notifyStart();
                const generation = this.generation;
                Promise.resolve(this.playBrowser(entry.text, {
                    ...entry.options,
                    signal: this.browserAbort.signal
                })).catch(() => {}).finally(() => {
                    if (this.stopped || generation !== this.generation) return;
                    this.browserPlaying = false;
                    this.browserAbort = null;
                    this.scheduledUntil = this.context?.currentTime || 0;
                    this.#pump();
                    this.#maybeIdle();
                });
                return;
            }

            const index = this.nextIndex++;
            this.ready.delete(index);
            const source = this.context.createBufferSource();
            source.buffer = entry.buffer;
            source.connect(this.context.destination);
            const startAt = Math.max(this.context.currentTime + 0.02, this.scheduledUntil);
            this.scheduledUntil = startAt + entry.buffer.duration;
            const generation = this.generation;
            source.onended = () => {
                if (this.stopped || generation !== this.generation) return;
                this.scheduled.delete(index);
                this.#pump();
                this.#maybeIdle();
            };
            this.scheduled.set(index, source);
            this.#notifyStart();
            source.start(startAt);
        }
        this.#maybeIdle();
    }

    #maybeIdle() {
        if (this.stopped || this.expectedCount === null) return;
        const complete = this.nextIndex >= this.expectedCount
            && this.ready.size === 0
            && this.scheduled.size === 0
            && !this.browserPlaying;
        if (complete && this.onIdle) {
            const onIdle = this.onIdle;
            this.onIdle = null;
            onIdle();
        }
    }
}
