import test from 'node:test';
import assert from 'node:assert/strict';

import { SentenceSplitter } from '../../assets/js/runtime/voice/sentence-splitter.js';

test('SentenceSplitter emits complete sentences in order', () => {
    const chunks = [];
    const splitter = new SentenceSplitter({ onChunk: chunk => chunks.push(chunk) });
    splitter.push('Hello there. How are');
    splitter.push(' you?');
    splitter.flush();
    assert.deepEqual(chunks, ['Hello there.', 'How are you?']);
});

test('SentenceSplitter uses whitespace-aware soft limits and never exceeds maxChars', () => {
    const chunks = [];
    const splitter = new SentenceSplitter({
        softCap: 20,
        maxChars: 24,
        onChunk: chunk => chunks.push(chunk)
    });
    splitter.push('alpha beta gamma delta epsilon zeta eta theta');
    splitter.flush();
    assert.equal(chunks.join(' '), 'alpha beta gamma delta epsilon zeta eta theta');
    assert.equal(chunks.every(chunk => chunk.length <= 24), true);
});

test('SentenceSplitter hard-splits an unbroken token below the provider limit', () => {
    const chunks = [];
    const splitter = new SentenceSplitter({
        softCap: 10,
        maxChars: 12,
        onChunk: chunk => chunks.push(chunk)
    });
    splitter.push('abcdefghijklmnopqrstuvwxyz');
    splitter.flush();
    assert.equal(chunks.join(''), 'abcdefghijklmnopqrstuvwxyz');
    assert.equal(chunks.every(chunk => chunk.length <= 12), true);
});
