/*
 * Translation module ownership:
 * - translation state normalization
 * - translation cache keys and local cache reads/writes
 * - segment translation queueing and backfill
 * - translated transcript rendering and translation UI
 */

export const TRANSLATION_SCOPE = [
    'normalizeTranslationState',
    'translationCacheKey',
    'readTranslationCache',
    'saveTranslationCache',
    'renderTranslationUi',
    'queueTranslationForSegmentIds',
    'queueTranslationBackfill'
];
