const DEFAULT_PROVIDER_TIMEOUT_MS = 45000;

class RequestTimeoutError extends Error {
    constructor(message = 'Request timed out', timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS) {
        super(message);
        this.name = 'RequestTimeoutError';
        this.code = 'REQUEST_TIMEOUT';
        this.timeoutMs = timeoutMs;
    }
}

function isRequestTimeoutError(error) {
    return error instanceof RequestTimeoutError
        || error?.name === 'RequestTimeoutError'
        || error?.code === 'REQUEST_TIMEOUT';
}

function isAbortError(error) {
    return error?.name === 'AbortError'
        || error?.code === 'ABORT_ERR'
        || /aborted|abort/i.test(String(error?.message || ''));
}

function getProviderTimeoutMs() {
    const override = typeof window !== 'undefined'
        ? Number(window.__VERBATIM_PROVIDER_TIMEOUT_MS__ || 0)
        : 0;
    return Number.isFinite(override) && override > 0 ? override : DEFAULT_PROVIDER_TIMEOUT_MS;
}

async function fetchWithTimeout(fetchImpl, input, init = {}, options = {}) {
    const timeoutMs = Number(options.timeoutMs || 0) > 0 ? Number(options.timeoutMs) : getProviderTimeoutMs();
    const timeoutMessage = options.timeoutMessage || `Request timed out after ${timeoutMs}ms`;
    const parentSignal = init.signal || options.signal || null;
    if (parentSignal?.aborted) {
        throw parentSignal.reason || new Error('Request was cancelled');
    }

    const controller = new AbortController();
    let timedOut = false;
    let timeoutError = null;
    let timer = null;

    const abortFromParent = () => {
        controller.abort(parentSignal.reason || new Error('Request was cancelled'));
    };

    if (parentSignal) {
        parentSignal.addEventListener('abort', abortFromParent, { once: true });
    }

    if (timeoutMs > 0) {
        timer = setTimeout(() => {
            timedOut = true;
            timeoutError = new RequestTimeoutError(timeoutMessage, timeoutMs);
            controller.abort(timeoutError);
        }, timeoutMs);
    }

    try {
        return await fetchImpl(input, { ...init, signal: controller.signal });
    } catch (error) {
        if (timedOut) throw timeoutError || new RequestTimeoutError(timeoutMessage, timeoutMs);
        throw error;
    } finally {
        if (timer) clearTimeout(timer);
        if (parentSignal) parentSignal.removeEventListener('abort', abortFromParent);
    }
}

export {
    DEFAULT_PROVIDER_TIMEOUT_MS,
    RequestTimeoutError,
    fetchWithTimeout,
    getProviderTimeoutMs,
    isAbortError,
    isRequestTimeoutError
};
