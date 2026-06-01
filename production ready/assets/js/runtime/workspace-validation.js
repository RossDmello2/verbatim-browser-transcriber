const SUPPORTED_WORKSPACE_VERSIONS = new Set([2, 3, 4]);
const DEFAULT_MAX_WORKSPACE_BYTES = 2 * 1024 * 1024;
const MAX_SEGMENTS = 5000;
const MAX_MEMORY_PACKS = 200;
const MAX_TRANSLATION_RESULTS = 10000;
const MAX_STRING_LENGTH = 250000;
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

class WorkspaceValidationError extends Error {
    constructor(issues) {
        const normalized = Array.isArray(issues) ? issues.filter(Boolean) : [String(issues || 'Invalid workspace JSON')];
        super(normalized.join('; '));
        this.name = 'WorkspaceValidationError';
        this.issues = normalized;
    }
}

function byteLength(value) {
    const text = String(value || '');
    if (typeof TextEncoder !== 'undefined') {
        return new TextEncoder().encode(text).length;
    }
    return unescape(encodeURIComponent(text)).length;
}

function isPlainObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function scanForUnsafeKeys(value, issues, path = 'workspace') {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
        value.forEach((item, index) => scanForUnsafeKeys(item, issues, `${path}[${index}]`));
        return;
    }
    for (const key of Object.keys(value)) {
        if (UNSAFE_KEYS.has(key)) {
            issues.push(`Unsafe key "${key}" at ${path}`);
            continue;
        }
        scanForUnsafeKeys(value[key], issues, `${path}.${key}`);
    }
}

function scanStringSizes(value, issues, path = 'workspace') {
    if (typeof value === 'string') {
        if (value.length > MAX_STRING_LENGTH) {
            issues.push(`String at ${path} is too large`);
        }
        return;
    }
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
        value.forEach((item, index) => scanStringSizes(item, issues, `${path}[${index}]`));
        return;
    }
    for (const [key, nested] of Object.entries(value)) {
        scanStringSizes(nested, issues, `${path}.${key}`);
    }
}

function assertArrayLimit(value, max, label, issues) {
    if (value === undefined || value === null) return;
    if (!Array.isArray(value)) {
        issues.push(`${label} must be an array`);
        return;
    }
    if (value.length > max) {
        issues.push(`Too many ${label.toLowerCase()} (${value.length}/${max})`);
    }
}

function countObjectEntries(value) {
    return isPlainObject(value) ? Object.keys(value).length : 0;
}

function clonePayload(payload) {
    return JSON.parse(JSON.stringify(payload));
}

function validateWorkspacePayload(payload, options = {}) {
    const issues = [];
    if (!isPlainObject(payload)) {
        throw new WorkspaceValidationError('Workspace JSON must be an object');
    }

    scanForUnsafeKeys(payload, issues);
    scanStringSizes(payload, issues);

    const version = Number(payload.version);
    if (!Number.isInteger(version) || !SUPPORTED_WORKSPACE_VERSIONS.has(version)) {
        issues.push(`Unsupported workspace version: ${payload.version ?? 'missing'}`);
    }

    assertArrayLimit(payload.segments, MAX_SEGMENTS, 'Transcript segments', issues);
    assertArrayLimit(payload.memoryPacks, MAX_MEMORY_PACKS, 'Memory packs', issues);

    const translationResults = payload.translation?.segmentResults;
    if (translationResults !== undefined && !isPlainObject(translationResults)) {
        issues.push('Translation segment results must be an object');
    } else if (countObjectEntries(translationResults) > MAX_TRANSLATION_RESULTS) {
        issues.push(`Too many translation segment results (${countObjectEntries(translationResults)}/${MAX_TRANSLATION_RESULTS})`);
    }

    if (options.maxBytes && byteLength(JSON.stringify(payload)) > options.maxBytes) {
        issues.push(`Workspace JSON is too large (${byteLength(JSON.stringify(payload))}/${options.maxBytes} bytes)`);
    }

    if (issues.length) throw new WorkspaceValidationError(issues);
    return clonePayload(payload);
}

function parseWorkspacePayload(raw, options = {}) {
    const maxBytes = Number(options.maxBytes || DEFAULT_MAX_WORKSPACE_BYTES);
    const rawText = String(raw || '');
    const size = byteLength(rawText);
    if (size > maxBytes) {
        throw new WorkspaceValidationError(`Workspace JSON is too large (${size}/${maxBytes} bytes)`);
    }

    let parsed;
    try {
        parsed = JSON.parse(rawText);
    } catch (_error) {
        throw new WorkspaceValidationError('Workspace JSON is not valid JSON');
    }
    return validateWorkspacePayload(parsed, { maxBytes });
}

export {
    DEFAULT_MAX_WORKSPACE_BYTES,
    WorkspaceValidationError,
    parseWorkspacePayload,
    validateWorkspacePayload
};
