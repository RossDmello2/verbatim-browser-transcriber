import test from 'node:test';
import assert from 'node:assert/strict';

import {
    VoiceStreamError,
    parseSseEventLine,
    streamChat
} from '../../assets/js/runtime/voice/llm-stream.js';

const encoder = new TextEncoder();

function streamResponse(parts) {
    return new Response(new ReadableStream({
        start(controller) {
            parts.forEach(part => controller.enqueue(encoder.encode(part)));
            controller.close();
        }
    }), {
        status: 200,
        headers: { 'content-type': 'text/event-stream' }
    });
}

test('parseSseEventLine accepts deltas and ignores malformed events', () => {
    assert.deepEqual(
        parseSseEventLine('data: {"choices":[{"delta":{"content":"Hi"}}]}'),
        { done: false, delta: 'Hi' }
    );
    assert.deepEqual(parseSseEventLine('data: [DONE]'), { done: true, delta: '' });
    assert.equal(parseSseEventLine('data: not-json'), null);
    assert.equal(parseSseEventLine(': keepalive'), null);
});

test('streamChat parses fragmented SSE records and completion', async () => {
    const deltas = [];
    const result = await streamChat({
        endpoint: '/chat',
        apiKey: 'test-key',
        model: 'test-model',
        messages: [],
        fetchImpl: async () => streamResponse([
            'data: {"choices":[{"delta":{"content":"Hel',
            'lo"}}]}\n',
            'data: malformed\n',
            'data: {"choices":[{"delta":{"content":" world"}}]}\n',
            'data: [DONE]\n'
        ]),
        onDelta: delta => deltas.push(delta)
    });
    assert.deepEqual(deltas, ['Hello', ' world']);
    assert.equal(result.receivedDelta, true);
});

test('streamChat cancels a stalled response body with an inactivity error', async () => {
    const stalled = new Response(new ReadableStream({ start() {} }), { status: 200 });
    await assert.rejects(
        () => streamChat({
            endpoint: '/chat',
            apiKey: 'test-key',
            model: 'test-model',
            messages: [],
            inactivityTimeoutMs: 5,
            fetchImpl: async () => stalled
        }),
        error => error instanceof VoiceStreamError
            && /stalled/i.test(error.message)
            && error.receivedDelta === false
    );
});

test('streamChat cancels the response reader when the parent aborts after headers', async () => {
    const parent = new AbortController();
    const stalled = new Response(new ReadableStream({ start() {} }), { status: 200 });
    const request = streamChat({
        endpoint: '/chat',
        apiKey: 'test-key',
        model: 'test-model',
        messages: [],
        signal: parent.signal,
        inactivityTimeoutMs: 1000,
        fetchImpl: async () => stalled
    });
    setTimeout(() => parent.abort(new DOMException('Stopped', 'AbortError')), 5);
    await assert.rejects(
        () => request,
        error => error instanceof VoiceStreamError && /cancelled/i.test(error.message)
    );
});

test('streamChat marks retryable HTTP failures before any delta', async () => {
    await assert.rejects(
        () => streamChat({
            endpoint: '/chat',
            apiKey: 'test-key',
            model: 'test-model',
            messages: [],
            fetchImpl: async () => new Response('', { status: 429 })
        }),
        error => error instanceof VoiceStreamError
            && error.status === 429
            && error.retryable
            && !error.receivedDelta
    );
});
