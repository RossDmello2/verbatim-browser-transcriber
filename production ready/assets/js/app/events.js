/*
 * Owns event-binding responsibilities at a documentation level.
 * In the current runtime, listeners still live close to the feature logic in build-app.js.
 * This file helps new readers understand where those bindings conceptually belong.
 */

export const EVENT_GROUPS = {
    capture: ['recording controls', 'mode switching', 'capture source changes'],
    transcript: ['editing', 'history', 'copy', 'cleanup', 'AI output triggers'],
    translation: ['enable/disable toggle', 'target language changes', 'backfill queue'],
    assistant: ['send', 'attach', 'voice input', 'conversation history'],
    workspace: ['save', 'export', 'import', 'autosave', 'sidebar/view navigation'],
    settings: ['provider keys', 'model selectors', 'memory tools', 'diagnostics']
};
