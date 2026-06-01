const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const mainContent = document.getElementById('mainContent');

function detectRuntimeCapabilities() {
    const ua = navigator.userAgent || '';
    const vendor = navigator.vendor || '';
    const platform = navigator.platform || '';
    const maxTouch = Number(navigator.maxTouchPoints || 0);
    const isIOS = /iPad|iPhone|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouch > 1);
    const isAndroid = /Android/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|Edg|OPR|SamsungBrowser|Firefox|FxiOS/i.test(ua) && /Apple/i.test(vendor || '');
    const isEdge = /Edg/i.test(ua);
    const isChrome = /Chrome|CriOS/i.test(ua) && !isEdge;
    const isFirefox = /Firefox|FxiOS/i.test(ua);
    const coarsePointer = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const isMobile = isIOS || isAndroid || coarsePointer;
    const hasSpeechRecognition = !!SR;
    const hasMediaRecorder = typeof window.MediaRecorder !== 'undefined';
    const hasDisplayMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');
    const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext || window.OfflineAudioContext);
    const hasGetUserMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
    const supportsMicQuality = hasMediaRecorder && hasGetUserMedia;
    const supportsTabOrScreenCapture = hasDisplayMedia && hasMediaRecorder && !isMobile && !isIOS && !isSafari;

    let browserFamily = 'Unknown';
    if (isSafari) browserFamily = 'Safari';
    else if (isEdge) browserFamily = 'Edge';
    else if (isChrome) browserFamily = 'Chrome';
    else if (isFirefox) browserFamily = 'Firefox';

    let platformFamily = 'Desktop';
    if (isIOS) platformFamily = 'iOS';
    else if (isAndroid) platformFamily = 'Android';
    else if (/Win/i.test(platform)) platformFamily = 'Windows';
    else if (/Mac/i.test(platform)) platformFamily = 'macOS';
    else if (/Linux/i.test(platform)) platformFamily = 'Linux';

    return {
        browserFamily,
        platformFamily,
        isSafari,
        isIOS,
        isMobile,
        isSecureContext: !!window.isSecureContext,
        hasSpeechRecognition,
        hasMediaRecorder,
        hasDisplayMedia,
        hasAudioContext,
        hasGetUserMedia,
        supportsMicQuality,
        supportsTabOrScreenCapture,
        canBoot: hasSpeechRecognition || supportsMicQuality || hasAudioContext
    };
}

const runtimeCapabilities = detectRuntimeCapabilities();

function renderUnsupportedBrowser() {
    mainContent.innerHTML = `
    <div class="not-supported">
      <div class="ns-icon">MIC</div>
      <h2>Browser support is too limited</h2>
      <p>This browser does not expose the speech, recording, or audio APIs Verba needs.</p>
      <p>Use Chrome or Edge for full meeting capture. Safari can still work for file transcription and some microphone flows when opened on HTTPS or localhost.</p>
    </div>`;
}

export { SR, mainContent, detectRuntimeCapabilities, runtimeCapabilities, renderUnsupportedBrowser };
