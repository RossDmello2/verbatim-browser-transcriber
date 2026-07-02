/*
 * Voice conversation module ownership:
 * - half-duplex speech-recognition turn lifecycle
 * - streamed Groq chat completion parsing
 * - sentence chunking and bounded Orpheus synthesis
 * - ordered Web Audio/browser speech playback
 * - Voice view controls, capability gates, memory grounding, and session-only history
 */

export const VOICE_SCOPE = [
    'VoiceTurnManager',
    'streamChat',
    'SentenceSplitter',
    'KeyRotator',
    'AudioQueue',
    'synthOrpheus',
    'mountVoiceView'
];
