/*
 * Workspace module ownership:
 * - workspace save and restore payloads
 * - transcript and translation caches
 * - partial-progress persistence for long-running file jobs
 * - autosave coordination and import/export of workspace data
 */

export const WORKSPACE_SCOPE = [
    'getWorkspacePayload',
    'writeWorkspaceToStorage',
    'scheduleWorkspaceSave',
    'restoreWorkspaceIfAny',
    'buildTranscriptCacheKey',
    'readTranscriptCache',
    'saveTranscriptCache'
];
