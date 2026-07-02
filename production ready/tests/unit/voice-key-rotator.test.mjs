import test from 'node:test';
import assert from 'node:assert/strict';

import { KeyRotator } from '../../assets/js/runtime/voice/key-rotator.js';

test('KeyRotator deduplicates, skips blanks, and round-robins', () => {
    const rotator = new KeyRotator(['a', '', 'b', 'a']);
    assert.equal(rotator.size, 2);
    assert.equal(rotator.next(), 'a');
    assert.equal(rotator.next(), 'b');
    assert.equal(rotator.next(), 'a');
});

test('KeyRotator excludes already-attempted keys', () => {
    const rotator = new KeyRotator(['a', 'b']);
    assert.equal(rotator.next(new Set(['a'])), 'b');
    assert.equal(rotator.next(['a', 'b']), '');
});

test('KeyRotator handles an empty key store', () => {
    const rotator = new KeyRotator([]);
    assert.equal(rotator.size, 0);
    assert.equal(rotator.next(), '');
});
