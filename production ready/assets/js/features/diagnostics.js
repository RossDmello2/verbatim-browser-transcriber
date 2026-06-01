/*
 * Diagnostics module ownership:
 * - runtime readiness summaries
 * - active/idle status reporting
 * - diagnostics panel rendering and log updates
 * - capture/provider/translation health snapshots
 */

export const DIAGNOSTICS_SCOPE = [
    'getReadyStatusForCurrentState',
    'getActiveStatusForCurrentState',
    'syncStatusBar',
    'setStatus',
    'setProgress',
    'showAnalysis',
    'updateDiagnostics'
];
