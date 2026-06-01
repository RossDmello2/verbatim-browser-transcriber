import test from 'node:test';
import assert from 'node:assert/strict';

import {
    RequestTimeoutError,
    fetchWithTimeout,
    isRequestTimeoutError
} from '../../assets/js/runtime/request-timeout.js';

test('fetchWithTimeout aborts a stalled request with a typed timeout error', async () => {
    const stalledFetch = (_url, init = {}) => new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal.reason), { once: true });
    });

    await assert.rejects(
        () => fetchWithTimeout(stalledFetch, '/slow', {}, { timeoutMs: 5, timeoutMessage: 'Provider request timed out' }),
        (error) => error instanceof RequestTimeoutError
            && isRequestTimeoutError(error)
            && error.message === 'Provider request timed out'
    );
});

test('fetchWithTimeout propagates parent aborts without reclassifying them as timeouts', async () => {
    const parent = new AbortController();
    const stalledFetch = (_url, init = {}) => new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal.reason), { once: true });
    });

    const pending = fetchWithTimeout(stalledFetch, '/cancelled', { signal: parent.signal }, { timeoutMs: 1000 });
    const parentReason = new Error('Cancelled by user');
    parent.abort(parentReason);

    await assert.rejects(() => pending, parentReason);
});

test('fetchWithTimeout leaves successful responses unchanged', async () => {
    const response = { ok: true, status: 200 };
    const instantFetch = async (_url, init = {}) => {
        assert.equal(init.signal.aborted, false);
        return response;
    };

    assert.equal(await fetchWithTimeout(instantFetch, '/ok', {}, { timeoutMs: 50 }), response);
});
