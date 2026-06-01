/*
 * Export module ownership:
 * - transcript export formats
 * - subtitle generation
 * - DOCX generation helpers
 * - download dispatch for transcript and workspace exports
 */

export const EXPORT_SCOPE = [
    'downloadTranscriptFormat',
    'generateSRT',
    'generateVTT',
    'generateJSON',
    'generateMarkdown',
    'generateCSV',
    'generateDocxBlob',
    'generateWorkspaceJSON'
];
