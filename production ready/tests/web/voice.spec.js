import { test, expect } from '@playwright/test';

const streamedReply = [
    'data: {"choices":[{"delta":{"content":"Hello from "}}]}\n',
    'data: {"choices":[{"delta":{"content":"the voice assistant."}}]}\n',
    'data: [DONE]\n'
].join('');

async function installVoiceMocks(page, {
    provider = 'openai',
    apiKey = 'openai-only-key',
    groqKeys = ['groq-safe-key'],
    engine = 'browser',
    speechDelay = 5
} = {}) {
    await page.addInitScript(({ selectedProvider, selectedApiKey, storedGroqKeys, selectedEngine, playbackDelay }) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('vt_provider', selectedProvider);
        localStorage.setItem('vt_api_key', selectedApiKey);
        localStorage.setItem('vt_provider_keys', JSON.stringify({
            groq: storedGroqKeys,
            openai: [],
            gemini: []
        }));
        localStorage.setItem('vt_voice_tts_engine', selectedEngine);
        localStorage.setItem('vt_voice_orpheus_voice_en', 'autumn');
        localStorage.setItem('vt_voice_auto_barge_in', '0');

        window.__voiceTest = {
            events: [],
            recognitionActive: false,
            recognitionStarts: 0,
            currentRecognition: null,
            emitFinal(text = 'Correction') {
                const recognition = window.__voiceTest.currentRecognition;
                if (!recognition || !window.__voiceTest.recognitionActive) return;
                const result = [{ transcript: text }];
                result.isFinal = true;
                window.__voiceTest.events.push(`recognition-final:${text}`);
                recognition.onresult?.({ resultIndex: 0, results: [result] });
                window.__voiceTest.recognitionActive = false;
                recognition.onend?.();
            }
        };

        class FakeSpeechRecognition {
            constructor() {
                this.lang = '';
                this.continuous = false;
                this.interimResults = true;
                this.maxAlternatives = 1;
                this.onresult = null;
                this.onend = null;
                this.onerror = null;
            }

            start() {
                window.__voiceTest.recognitionStarts++;
                window.__voiceTest.recognitionActive = true;
                window.__voiceTest.currentRecognition = this;
                window.__voiceTest.events.push(`recognition-start:${this.lang}`);
                if (window.__voiceTest.recognitionStarts !== 1) return;
                setTimeout(() => {
                    if (!window.__voiceTest.recognitionActive) return;
                    window.__voiceTest.emitFinal('Hello voice');
                }, 10);
            }

            abort() {
                window.__voiceTest.events.push('recognition-abort');
                window.__voiceTest.recognitionActive = false;
                this.onend?.();
            }

            stop() {
                this.abort();
            }
        }

        class FakeUtterance {
            constructor(text) {
                this.text = text;
                this.voice = null;
                this.rate = 1;
                this.pitch = 1;
                this.onend = null;
                this.onerror = null;
            }
        }

        const fakeSpeechSynthesis = {
            getVoices() {
                return [
                    { name: 'Test English', lang: 'en-US', voiceURI: 'test-en' },
                    { name: 'Test Female', lang: 'en-US', voiceURI: 'test-female' }
                ];
            },
            speak(utterance) {
                window.__voiceTest.events.push(`speak-recognition-active:${window.__voiceTest.recognitionActive}`);
                window.__voiceTest.events.push(`speak-voice:${utterance.voice?.voiceURI || 'default'}`);
                window.__voiceTest.events.push(`speak:${utterance.text}`);
                setTimeout(() => utterance.onend?.(), playbackDelay);
            },
            cancel() {
                window.__voiceTest.events.push('speech-cancel');
            }
        };

        class FakeAudioContext {
            constructor() {
                this.state = 'running';
                this.currentTime = 0;
                this.destination = {};
            }

            async resume() {
                this.state = 'running';
            }

            async decodeAudioData(arrayBuffer) {
                return { duration: Math.max(0.05, arrayBuffer.byteLength / 1000) };
            }

            createBufferSource() {
                return {
                    buffer: null,
                    onended: null,
                    connect() {},
                    start() {
                        setTimeout(() => this.onended?.(), playbackDelay);
                    },
                    stop() {}
                };
            }

            createAnalyser() {
                return {
                    fftSize: 1024,
                    connect() {},
                    disconnect() {},
                    getByteTimeDomainData(data) {
                        data.fill(128);
                    }
                };
            }

            createMediaStreamSource() {
                return {
                    connect() {},
                    disconnect() {}
                };
            }
        }

        Object.defineProperty(window.navigator, 'mediaDevices', {
            configurable: true,
            value: {
                async getUserMedia() {
                    window.__voiceTest.events.push('barge-media-open');
                    return {
                        getTracks() {
                            return [{ stop() { window.__voiceTest.events.push('barge-track-stop'); } }];
                        }
                    };
                }
            }
        });

        Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: FakeSpeechRecognition });
        Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: FakeSpeechRecognition });
        Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: FakeUtterance });
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: fakeSpeechSynthesis });
        Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext });
        Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: FakeAudioContext });
    }, {
        selectedProvider: provider,
        selectedApiKey: apiKey,
        storedGroqKeys: groqKeys,
        selectedEngine: engine,
        playbackDelay: speechDelay
    });
}

async function openVoiceView(page) {
    await page.goto('/');
    await page.locator('#workspaceStatus').waitFor({ state: 'attached' });
    await page.locator('.workspace-nav-btn[data-view="voice"]').click();
    await expect(page.locator('[data-workspace-view="voice"]')).toBeVisible();
}

test('Voice view renders a deterministic unsupported-browser gate', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.clear();
        sessionStorage.clear();
        Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: undefined });
        Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: undefined });
    });
    await openVoiceView(page);
    await expect(page.locator('#voiceToggle')).toBeDisabled();
    await expect(page.locator('#voiceHint')).toContainText('Chrome or Edge');
});

test('Voice explains that a Groq key is required without starting recognition', async ({ page }) => {
    await installVoiceMocks(page, { apiKey: '', groqKeys: [] });
    await openVoiceView(page);
    await page.locator('#voiceToggle').click();
    await expect(page.locator('#voiceHint')).toContainText('Add a Groq key');
    await expect.poll(() => page.evaluate(() => window.__voiceTest.recognitionStarts)).toBe(0);
});

test('Voice runs half-duplex with a Groq vault key and stops when leaving the view', async ({ page }) => {
    await installVoiceMocks(page);
    const authorizations = [];
    await page.route('https://api.groq.com/openai/v1/chat/completions', async route => {
        authorizations.push(route.request().headers().authorization);
        await route.fulfill({
            status: 200,
            contentType: 'text/event-stream',
            body: streamedReply
        });
    });

    await openVoiceView(page);
    await page.locator('#voiceToggle').click();
    await expect(page.locator('#voiceReply')).toContainText('Hello from the voice assistant.');
    await expect(page.locator('#voiceStatus')).toHaveText('Listening');

    const evidence = await page.evaluate(() => ({
        events: window.__voiceTest.events,
        recognitionActive: window.__voiceTest.recognitionActive
    }));
    expect(authorizations).toEqual(['Bearer groq-safe-key']);
    expect(evidence.events).toContain('speak-recognition-active:false');
    expect(evidence.recognitionActive).toBe(true);

    await page.locator('.workspace-nav-btn[data-view="transcript"]').click();
    await expect(page.locator('[data-workspace-view="transcript"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__voiceTest.recognitionActive)).toBe(false);
});

test('Voice retries a failed LLM handshake on the next Groq key only', async ({ page }) => {
    await installVoiceMocks(page, {
        provider: 'openai',
        apiKey: 'openai-only-key',
        groqKeys: ['groq-first-key', 'groq-second-key']
    });
    const authorizations = [];
    await page.route('https://api.groq.com/openai/v1/chat/completions', async route => {
        const authorization = route.request().headers().authorization;
        authorizations.push(authorization);
        if (authorization === 'Bearer groq-first-key') {
            await route.fulfill({
                status: 429,
                contentType: 'application/json',
                body: JSON.stringify({ error: { message: 'rate limited' } })
            });
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: 'text/event-stream',
            body: streamedReply
        });
    });

    await openVoiceView(page);
    await page.locator('#voiceToggle').click();
    await expect(page.locator('#voiceReply')).toContainText('Hello from the voice assistant.');
    expect(authorizations).toEqual(['Bearer groq-first-key', 'Bearer groq-second-key']);
    expect(authorizations).not.toContain('Bearer openai-only-key');
});

test('Voice Interrupt cancels active browser speech and restarts listening for correction', async ({ page }) => {
    await installVoiceMocks(page, { speechDelay: 1000 });
    await page.route('https://api.groq.com/openai/v1/chat/completions', route => route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: streamedReply
    }));

    await openVoiceView(page);
    await page.locator('#voiceToggle').click();
    await expect(page.locator('#voiceStatus')).toHaveText('Speaking');
    await expect(page.locator('#voiceToggle')).toHaveText('Interrupt');
    await page.locator('#voiceToggle').click();
    await expect(page.locator('#voiceStatus')).toHaveText('Listening');
    const evidence = await page.evaluate(() => window.__voiceTest);
    expect(evidence.events).toContain('speech-cancel');
    expect(evidence.recognitionActive).toBe(true);
    expect(evidence.recognitionStarts).toBe(2);
});

test('Voice sends interruption context with the next correction turn', async ({ page }) => {
    await installVoiceMocks(page, { speechDelay: 1000 });
    const chatBodies = [];
    await page.route('https://api.groq.com/openai/v1/chat/completions', route => {
        chatBodies.push(route.request().postDataJSON());
        return route.fulfill({
            status: 200,
            contentType: 'text/event-stream',
            body: streamedReply
        });
    });

    await openVoiceView(page);
    await page.locator('#voiceToggle').click();
    await expect(page.locator('#voiceStatus')).toHaveText('Speaking');
    await page.locator('#voiceToggle').click();
    await expect(page.locator('#voiceStatus')).toHaveText('Listening');
    await page.evaluate(() => window.__voiceTest.emitFinal('Actually explain the other option'));

    await expect.poll(() => chatBodies.length).toBe(2);
    const messages = chatBodies[1].messages.map(message => message.content);
    expect(messages).toContain('The user interrupted your previous answer. Adapt to their correction and respond briefly.');
    expect(messages).toContain('Actually explain the other option');
});

test('Voice previews selected browser voice', async ({ page }) => {
    await installVoiceMocks(page);
    await openVoiceView(page);
    await page.locator('#voicePersona').selectOption('test-female');
    await page.locator('#voicePreview').click();

    await expect(page.locator('#voiceSource')).toContainText('Previewing browser voice: Test Female');
    await expect.poll(() => page.evaluate(() => window.__voiceTest.events)).toContain('speak-voice:test-female');
});

test('Voice previews selected Orpheus persona with Groq speech endpoint', async ({ page }) => {
    await installVoiceMocks(page, { provider: 'groq', apiKey: 'groq-primary-key', groqKeys: [], engine: 'orpheus' });
    const speechBodies = [];
    await page.route('https://api.groq.com/openai/v1/audio/speech', async route => {
        speechBodies.push(route.request().postDataJSON());
        await route.fulfill({
            status: 200,
            contentType: 'audio/wav',
            body: 'RIFF'
        });
    });

    await openVoiceView(page);
    await page.locator('#voicePersona').selectOption('diana');
    await page.locator('#voicePreview').click();

    await expect(page.locator('#voiceSource')).toContainText('Previewing Orpheus: Diana');
    expect(speechBodies).toHaveLength(1);
    expect(speechBodies[0].voice).toBe('diana');
});

test('Voice persists persona selection and explains Orpheus fallback source', async ({ page }) => {
    await installVoiceMocks(page, { provider: 'groq', apiKey: 'groq-primary-key', groqKeys: [], engine: 'orpheus' });
    await page.route('https://api.groq.com/openai/v1/chat/completions', route => route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: streamedReply
    }));
    await page.route('https://api.groq.com/openai/v1/audio/speech', route => route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'rate limited' } })
    }));

    await openVoiceView(page);
    await expect(page.locator('#voiceEngine')).toHaveValue('orpheus');
    await page.locator('#voiceEngine').selectOption('browser');
    await page.locator('#voicePersona').selectOption('test-en');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('vt_voice_tts_engine'))).toBe('browser');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('vt_voice_browser_voice'))).toBe('test-en');
    await page.locator('#voiceEngine').selectOption('orpheus');
    await page.locator('#voicePersona').selectOption('troy');
    await page.locator('#langSelect').selectOption('ar-SA');
    await page.locator('#voicePersona').selectOption('aisha');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('vt_voice_orpheus_voice_ar'))).toBe('aisha');
    await page.locator('#langSelect').selectOption('en-US');
    await page.locator('#voiceToggle').click();

    await expect(page.locator('#voiceReply')).toContainText('Hello from the voice assistant.');
    await expect(page.locator('#voiceHint')).toContainText('Orpheus unavailable');
    await expect(page.locator('#voiceSource')).toContainText('using browser voice: Test English');
    await expect.poll(() => page.evaluate(() => (
        window.__voiceTest.events.some(event => event.startsWith('speak:'))
    ))).toBe(true);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('vt_voice_tts_engine'))).toBe('orpheus');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('vt_voice_orpheus_voice_en'))).toBe('troy');
});

test('Voice surfaces Orpheus model terms failures without pretending persona spoke', async ({ page }) => {
    await installVoiceMocks(page, { provider: 'groq', apiKey: 'groq-primary-key', groqKeys: [], engine: 'orpheus' });
    await page.route('https://api.groq.com/openai/v1/chat/completions', route => route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: streamedReply
    }));
    await page.route('https://api.groq.com/openai/v1/audio/speech', route => route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'model_terms_required', message: 'terms needed' } })
    }));

    await openVoiceView(page);
    await page.locator('#voicePersona').selectOption('diana');
    await page.locator('#voiceToggle').click();

    await expect(page.locator('#voiceHint')).toContainText('Accept Orpheus preview model terms');
    await expect(page.locator('#voiceSource')).toContainText('using browser voice');
    await expect(page.locator('#voiceSource')).not.toContainText('Speaking with Orpheus: Diana');
});

test('Voice automatic interruption setting persists and remains off by default', async ({ page }) => {
    await installVoiceMocks(page);
    await openVoiceView(page);
    await expect(page.locator('#voiceAutoBarge')).not.toBeChecked();
    await page.locator('#voiceAutoBarge').check();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('vt_voice_auto_barge_in'))).toBe('1');
});

test('Voice stops immediately when the language changes', async ({ page }) => {
    await installVoiceMocks(page, { provider: 'groq', apiKey: 'groq-primary-key', groqKeys: [] });

    await openVoiceView(page);
    await page.locator('#voiceToggle').click();
    await expect(page.locator('#voiceStatus')).toHaveText('Listening');
    await expect.poll(() => page.evaluate(() => window.__voiceTest.recognitionActive)).toBe(true);
    await page.locator('#langSelect').selectOption('hi-IN');
    await expect(page.locator('#voiceStatus')).toHaveText('Idle');
    await expect.poll(() => page.evaluate(() => window.__voiceTest.recognitionActive)).toBe(false);
});
