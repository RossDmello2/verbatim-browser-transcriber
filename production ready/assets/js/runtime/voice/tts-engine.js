import { fetchWithTimeout } from '../request-timeout.js';

const ORPHEUS_ENDPOINT = 'https://api.groq.com/openai/v1/audio/speech';

export class OrpheusRequestError extends Error {
    constructor(message, status = 0, details = {}) {
        super(message);
        this.name = 'OrpheusRequestError';
        this.status = Number(status || 0);
        this.code = details.code || '';
        this.providerMessage = details.providerMessage || '';
        this.retryable = status === 401 || status === 408 || status === 409
            || status === 425 || status === 429 || status >= 500;
        if (this.code === 'model_terms_required') this.retryable = false;
    }
}

async function parseErrorDetails(response) {
    const contentType = String(response.headers?.get?.('content-type') || '').toLowerCase();
    let raw = '';
    try {
        raw = await response.text();
    } catch (error) {
        raw = '';
    }
    if (!raw) return { code: '', providerMessage: '' };
    if (contentType.includes('json')) {
        try {
            const parsed = JSON.parse(raw);
            const error = parsed?.error || parsed;
            return {
                code: String(error?.code || error?.type || ''),
                providerMessage: String(error?.message || raw)
            };
        } catch (error) {}
    }
    return { code: '', providerMessage: raw.slice(0, 240) };
}

export async function synthOrpheus({
    text,
    apiKey,
    model,
    voice,
    speed = 1,
    sampleRate = 48000,
    signal = null,
    fetchImpl = globalThis.fetch
}) {
    const input = String(text || '').trim();
    if (!input) throw new OrpheusRequestError('Orpheus input is empty');
    if (input.length > 200) throw new OrpheusRequestError('Orpheus input exceeds 200 characters');
    if (!apiKey) throw new OrpheusRequestError('A Groq key is required for Orpheus');
    if (!voice) throw new OrpheusRequestError('An Orpheus voice is required');
    const normalizedSpeed = Number(speed);
    if (!Number.isFinite(normalizedSpeed) || normalizedSpeed < 0.5 || normalizedSpeed > 5) {
        throw new OrpheusRequestError('Orpheus speed must be between 0.5 and 5');
    }

    const response = await fetchWithTimeout(
        fetchImpl,
        ORPHEUS_ENDPOINT,
        {
            method: 'POST',
            signal,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                input,
                voice,
                response_format: 'wav',
                speed: normalizedSpeed,
                sample_rate: sampleRate
            })
        },
        { timeoutMessage: 'Orpheus speech request timed out' }
    );

    if (!response.ok) {
        const details = await parseErrorDetails(response);
        const message = details.code === 'model_terms_required'
            ? 'Accept Orpheus preview model terms in Groq Console, then retry.'
            : details.providerMessage || `Orpheus speech request failed (${response.status})`;
        throw new OrpheusRequestError(message, response.status, details);
    }
    return response.arrayBuffer();
}

export function speakBrowser(text, { voice = null, rate = 1, pitch = 1, signal = null } = {}) {
    return new Promise((resolve, reject) => {
        const synth = globalThis.speechSynthesis;
        const Utterance = globalThis.SpeechSynthesisUtterance;
        if (!synth || !Utterance) {
            reject(new Error('Browser speech synthesis is unavailable'));
            return;
        }

        const utterance = new Utterance(String(text || ''));
        if (voice) utterance.voice = voice;
        utterance.rate = rate;
        utterance.pitch = pitch;

        const cleanup = () => signal?.removeEventListener('abort', onAbort);
        const onAbort = () => {
            cleanup();
            synth.cancel();
            reject(signal?.reason || new DOMException('Aborted', 'AbortError'));
        };
        utterance.onend = () => {
            cleanup();
            resolve();
        };
        utterance.onerror = (event) => {
            cleanup();
            reject(new Error(event?.error || 'Browser speech synthesis failed'));
        };

        if (signal?.aborted) {
            onAbort();
            return;
        }
        signal?.addEventListener('abort', onAbort, { once: true });
        synth.speak(utterance);
    });
}

export function selectBrowserVoice(voices = [], voiceUri = '', locale = 'en-US') {
    const available = Array.from(voices || []);
    const exact = available.find(voice => voice.voiceURI === voiceUri);
    if (exact) return exact;
    const normalizedLocale = String(locale || 'en-US').toLowerCase();
    const language = normalizedLocale.split('-')[0];
    return available.find(voice => String(voice.lang || '').toLowerCase() === normalizedLocale)
        || available.find(voice => String(voice.lang || '').toLowerCase().startsWith(`${language}-`))
        || available[0]
        || null;
}

export function describeBrowserVoice(voice = null) {
    if (!voice) return 'System default';
    const name = String(voice.name || voice.voiceURI || 'System default');
    const lang = String(voice.lang || '').trim();
    return lang ? `${name} (${lang})` : name;
}
