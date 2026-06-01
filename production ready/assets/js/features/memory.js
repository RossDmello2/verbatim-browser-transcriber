/*
 * Memory module ownership:
 * - imported memory text
 * - memory packs and active pack selection
 * - memory prompt export helpers
 * - memory UI rendering and persistence
 */

export const MEMORY_SCOPE = [
    'normalizeMemoryPacks',
    'getActiveMemoryPack',
    'setActiveMemoryPack',
    'createMemoryPack',
    'deleteActiveMemoryPack',
    'renderMemoryUi',
    'setImportedMemory'
];
