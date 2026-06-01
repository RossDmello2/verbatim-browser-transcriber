import test from 'node:test';
import assert from 'node:assert/strict';

import {
    WorkspaceValidationError,
    parseWorkspacePayload,
    validateWorkspacePayload
} from '../../assets/js/runtime/workspace-validation.js';

test('parseWorkspacePayload accepts a supported workspace payload', () => {
    const payload = parseWorkspacePayload(JSON.stringify({
        version: 4,
        savedAt: '2026-05-17T00:00:00.000Z',
        mode: 'file',
        captureSource: 'mic',
        preset: 'dictation',
        transcript: 'Hello world',
        segments: [{ text: 'Hello world', start: 0, end: 1 }],
        translation: {
            enabled: false,
            targetLanguage: 'en',
            segmentResults: {}
        }
    }));

    assert.equal(payload.version, 4);
    assert.equal(payload.transcript, 'Hello world');
    assert.equal(payload.segments.length, 1);
});

test('parseWorkspacePayload rejects unsupported workspace versions', () => {
    assert.throws(
        () => parseWorkspacePayload(JSON.stringify({ version: 999, transcript: 'bad' })),
        (error) => error instanceof WorkspaceValidationError
            && error.issues.some(issue => issue.includes('Unsupported workspace version'))
    );
});

test('parseWorkspacePayload rejects unsafe prototype keys', () => {
    assert.throws(
        () => parseWorkspacePayload('{"version":4,"segments":[],"__proto__":{"polluted":true}}'),
        (error) => error instanceof WorkspaceValidationError
            && error.issues.some(issue => issue.includes('Unsafe key'))
    );
});

test('parseWorkspacePayload rejects oversized imports before restore', () => {
    const raw = JSON.stringify({ version: 4, transcript: 'x'.repeat(120) });
    assert.throws(
        () => parseWorkspacePayload(raw, { maxBytes: 80 }),
        (error) => error instanceof WorkspaceValidationError
            && error.issues.some(issue => issue.includes('too large'))
    );
});

test('validateWorkspacePayload rejects excessive segment counts', () => {
    assert.throws(
        () => validateWorkspacePayload({
            version: 4,
            segments: Array.from({ length: 5001 }, (_, index) => ({ text: `s${index}` }))
        }),
        (error) => error instanceof WorkspaceValidationError
            && error.issues.some(issue => issue.includes('Too many transcript segments'))
    );
});
