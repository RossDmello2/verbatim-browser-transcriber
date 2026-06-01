/*
 * File transcription module ownership:
 * - uploaded audio/video files
 * - audio analysis and duration checks
 * - WAV conversion, chunking, merge/retry heuristics
 * - provider transcription requests and rendered results
 */

export const FILE_TRANSCRIPTION_SCOPE = [
    'handleFileSelect',
    'analyzeAudio',
    'audioBufferToWav',
    'chunkWavBlob',
    'mergeResults',
    'displayFileResult',
    'processUploadedFile'
];
