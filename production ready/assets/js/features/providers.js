/*
 * Provider module ownership:
 * - provider-specific endpoints and API routing
 * - audio/chat/assistant model defaults and catalogs
 * - browser-stored API keys and provider key vaults
 * - provider/model selectors used by transcription and assistant flows
 */

export const PROVIDER_SCOPE = [
    'getApiEndpoint',
    'getAudioEndpoint',
    'getChatEndpoint',
    'getGeminiGenerateEndpoint',
    'getGeminiUploadEndpoint',
    'defaultAudioModel',
    'defaultChatModel',
    'setChatModel',
    'setAssistantModel'
];
