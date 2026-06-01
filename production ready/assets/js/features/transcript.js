/*
 * Transcript module ownership:
 * - raw transcript text and structured segments
 * - segment editing, split/merge/delete, timestamps
 * - clipboard/history/undo helpers
 * - local cleanup, glossary replacement, and transcript rebuilds
 */

export const TRANSCRIPT_SCOPE = [
    'addSegment',
    'appendToTranscript',
    'renderSegments',
    'rebuildTranscriptFromSegments',
    'copyToClipboard',
    'addToHistory',
    'cleanTranscriptLocal',
    'applyGlossaryToText'
];
