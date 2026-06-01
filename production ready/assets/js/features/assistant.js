/*
 * Assistant module ownership:
 * - assistant conversations and thread persistence
 * - prompt context building and model routing
 * - attachments, file analysis, and assistant voice input
 * - assistant message rendering and composer actions
 */

export const ASSISTANT_SCOPE = [
    'createAssistantConversation',
    'persistAssistantConversations',
    'buildAssistantPromptMessages',
    'startAssistantVoiceInput',
    'askAssistant',
    'submitAssistantDraft',
    'renderAssistantMessages'
];
