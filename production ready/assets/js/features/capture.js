/*
 * Capture module ownership:
 * - microphone / tab / screen capture setup
 * - realtime speech recognition flow
 * - quality recording with MediaRecorder
 * - audio visualizer, timers, restart logic, and recording controls
 */

export const CAPTURE_FEATURE_SCOPE = [
    'acquireCaptureStream',
    'startRealtimeAudioBuffer',
    'startQualityRecording',
    'startRecording',
    'stopRecording',
    'forceStop',
    'toggleRecordingFromUi'
];
