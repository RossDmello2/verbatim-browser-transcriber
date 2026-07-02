/*
 * Owns the shared application state model and storage conventions used by Verbatim.
 * This file is a reader-friendly map of what the runtime stores and why.
 */

export const STORAGE_KEYS = {
    workspace: 'vt_workspace_v3',
    legacyWorkspace: 'vt_workspace_v2',
    provider: 'vt_provider',
    apiKey: 'vt_api_key',
    audioModel: 'vt_audio_model',
    chatModel: 'vt_chat_model',
    providerKeys: 'vt_provider_keys',
    preset: 'vt_preset',
    glossary: 'vt_glossary',
    memoryRaw: 'vt_memory_raw',
    memoryImportedAt: 'vt_memory_imported_at',
    memoryPacks: 'vt_memory_packs',
    memoryPackActive: 'vt_memory_pack_active',
    outputStyle: 'vt_output_style',
    geminiAnalysisModel: 'vt_gemini_analysis_model',
    geminiUsage: 'vt_gemini_usage',
    autosave: 'vt_autosave',
    speakerMode: 'vt_speaker_mode',
    translationEnabled: 'vt_translation_enabled',
    translationTarget: 'vt_translation_target',
    voiceTtsEngine: 'vt_voice_tts_engine',
    voiceBrowserVoice: 'vt_voice_browser_voice',
    voiceOrpheusVoiceEn: 'vt_voice_orpheus_voice_en',
    voiceOrpheusVoiceAr: 'vt_voice_orpheus_voice_ar',
    voiceMemoryGrounding: 'vt_voice_memory_grounding_enabled',
    assistantModel: 'vt_assistant_model',
    assistantCurrent: 'vt_assistant_current',
    assistantConversations: 'vt_assistant_conversations',
    assistantThread: 'vt_assistant_thread',
    assistantUi: 'vt_assistant_ui'
};

export const SESSION_KEYS = {
    aiOutput: 'vt_ai_output',
    diagnostics: 'vt_diag',
    assistantDraft: 'vt_assistant_draft',
    history: 'vt_history',
    undo: 'vt_undo',
    correctionCache: 'vt_correction_cache'
};

export const STATE_DOMAIN_GUIDE = [
    'ui/session: mode, active view, sidebar state, drawers, toggles',
    'capture: recording flags, timers, realtime buffers, visualizer state',
    'file processing: uploaded file, audio analysis, duration, chunking state',
    'providers/models: provider choice, keys, audio/chat/gemini model selections',
    'transcript: confirmed text, segments, undo, history, correction queues',
    'translation: target language, cached segment results, stats, pending work',
    'voice: half-duplex phase, TTS engine/persona preferences, optional auto-interrupt and memory-grounding settings, session-only conversation history',
    'assistant: conversations, messages, draft, attachment, unread/UI state',
    'memory/workspace: imported memory, memory packs, autosave, restore payloads'
];
