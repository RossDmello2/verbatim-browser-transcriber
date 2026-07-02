import test from 'node:test';
import assert from 'node:assert/strict';

import {
    OrpheusRequestError,
    describeBrowserVoice,
    selectBrowserVoice,
    synthOrpheus
} from '../../assets/js/runtime/voice/tts-engine.js';

test('synthOrpheus preserves model_terms_required provider errors as non-retryable', async () => {
    const fetchImpl = async () => new Response(JSON.stringify({
        error: {
            code: 'model_terms_required',
            message: 'Model terms must be accepted'
        }
    }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
    });

    await assert.rejects(
        () => synthOrpheus({
            text: 'Preview',
            apiKey: 'safe-test-key',
            model: 'canopylabs/orpheus-v1-english',
            voice: 'diana',
            fetchImpl
        }),
        (error) => {
            assert.equal(error instanceof OrpheusRequestError, true);
            assert.equal(error.status, 400);
            assert.equal(error.code, 'model_terms_required');
            assert.equal(error.retryable, false);
            assert.match(error.message, /Accept Orpheus preview model terms/);
            return true;
        }
    );
});

test('synthOrpheus marks rate limits retryable and preserves provider message', async () => {
    const fetchImpl = async () => new Response(JSON.stringify({
        error: {
            message: 'rate limited'
        }
    }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
    });

    await assert.rejects(
        () => synthOrpheus({
            text: 'Preview',
            apiKey: 'safe-test-key',
            model: 'canopylabs/orpheus-v1-english',
            voice: 'diana',
            fetchImpl
        }),
        (error) => {
            assert.equal(error.status, 429);
            assert.equal(error.retryable, true);
            assert.equal(error.providerMessage, 'rate limited');
            return true;
        }
    );
});

test('selectBrowserVoice prefers exact voiceURI and then locale fallback', () => {
    const voices = [
        { name: 'Default English', lang: 'en-US', voiceURI: 'default-en' },
        { name: 'Chosen English', lang: 'en-US', voiceURI: 'chosen-en' },
        { name: 'Hindi', lang: 'hi-IN', voiceURI: 'hi' }
    ];

    assert.equal(selectBrowserVoice(voices, 'chosen-en', 'en-US').name, 'Chosen English');
    assert.equal(selectBrowserVoice(voices, 'missing', 'hi-IN').name, 'Hindi');
    assert.equal(describeBrowserVoice(voices[1]), 'Chosen English (en-US)');
});
