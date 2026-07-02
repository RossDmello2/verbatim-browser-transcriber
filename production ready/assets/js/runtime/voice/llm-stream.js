import {
    RequestTimeoutError,
    fetchWithTimeout,
    getProviderTimeoutMs,
    isAbortError
} from '../request-timeout.js';

export class VoiceStreamError extends Error {
    constructor(message, { cause = null, status = 0, receivedDelta = false, retryable = false } = {}) {
        super(message);
        this.name = 'VoiceStreamError';
        this.cause = cause;
        this.status = Number(status || 0);
        this.receivedDelta = !!receivedDelta;
        this.retryable = !!retryable;
    }
}

export function parseSseEventLine(line = '') {
    const trimmed = String(line || '').trim();
    if (!trimmed || trimmed.startsWith(':') || !trimmed.startsWith('data:')) return null;
    const payload = trimmed.slice(5).trim();
    if (payload === '[DONE]') return { done: true, delta: '' };
    try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content;
        return { done: false, delta: typeof delta === 'string' ? delta : '' };
    } catch (error) {
        return null;
    }
}

function isRetryableStatus(status) {
    return status === 401 || status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

export async function streamChat({
    endpoint,
    apiKey,
    model,
    messages,
    temperature = 0.3,
    maxTokens = 1024,
    signal = null,
    inactivityTimeoutMs = getProviderTimeoutMs(),
    fetchImpl = globalThis.fetch,
    onDelta = null
}) {
    let receivedDelta = false;
    let reader = null;
    let inactivityTimer = null;
    let cancellationError = null;
    let abortReader = null;

    try {
        const response = await fetchWithTimeout(
            fetchImpl,
            endpoint,
            {
                method: 'POST',
                signal,
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                    stream: true
                })
            },
            { timeoutMessage: 'Voice reply connection timed out' }
        );

        if (!response.ok || !response.body) {
            throw new VoiceStreamError(`Voice reply request failed (${response.status})`, {
                status: response.status,
                retryable: isRetryableStatus(response.status)
            });
        }

        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finished = false;

        const cancelReader = (error) => {
            if (cancellationError) return;
            cancellationError = error instanceof Error ? error : new Error('Voice reply was cancelled');
            void reader.cancel(cancellationError).catch(() => {});
        };
        abortReader = () => cancelReader(signal?.reason || new DOMException('Aborted', 'AbortError'));
        if (signal) signal.addEventListener('abort', abortReader, { once: true });

        const resetInactivityTimer = () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                cancelReader(new RequestTimeoutError(
                    `Voice reply stalled for ${inactivityTimeoutMs}ms`,
                    inactivityTimeoutMs
                ));
            }, inactivityTimeoutMs);
        };
        resetInactivityTimer();

        while (!finished) {
            const { value, done } = await reader.read();
            if (cancellationError) throw cancellationError;
            if (done) break;
            resetInactivityTimer();
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || '';
            for (const line of lines) {
                const event = parseSseEventLine(line);
                if (!event) continue;
                resetInactivityTimer();
                if (event.done) {
                    finished = true;
                    break;
                }
                if (event.delta) {
                    receivedDelta = true;
                    if (typeof onDelta === 'function') onDelta(event.delta);
                }
            }
        }

        if (!finished && buffer.trim()) {
            const event = parseSseEventLine(buffer);
            if (event?.delta) {
                receivedDelta = true;
                if (typeof onDelta === 'function') onDelta(event.delta);
            }
        }

        return { receivedDelta };
    } catch (error) {
        if (error instanceof VoiceStreamError) {
            error.receivedDelta = error.receivedDelta || receivedDelta;
            throw error;
        }
        const aborted = isAbortError(error) || signal?.aborted;
        throw new VoiceStreamError(
            aborted ? 'Voice reply was cancelled' : (error?.message || 'Voice reply failed'),
            {
                cause: error,
                receivedDelta,
                retryable: !aborted && !receivedDelta
            }
        );
    } finally {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        if (signal && abortReader) signal.removeEventListener('abort', abortReader);
        try { reader?.releaseLock(); } catch (error) {}
    }
}
