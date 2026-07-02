import test from 'node:test';
import assert from 'node:assert/strict';

import { AudioQueue } from '../../assets/js/runtime/voice/audio-queue.js';

test('AudioQueue plays browser entries strictly by index', async () => {
    const played = [];
    await new Promise((resolve, reject) => {
        const queue = new AudioQueue({
            playBrowser: async text => {
                played.push(text);
            },
            onIdle: resolve
        });
        queue.addBrowser(1, 'second');
        queue.addBrowser(0, 'first');
        queue.markDone(2);
        setTimeout(() => reject(new Error('queue did not drain')), 100);
    });
    assert.deepEqual(played, ['first', 'second']);
});

test('AudioQueue ignores late browser completion after stop', async () => {
    let finishPlayback;
    let idleCalls = 0;
    const queue = new AudioQueue({
        playBrowser: () => new Promise(resolve => {
            finishPlayback = resolve;
        }),
        onIdle: () => {
            idleCalls++;
        }
    });
    queue.addBrowser(0, 'pending');
    queue.markDone(1);
    queue.stop();
    finishPlayback();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(idleCalls, 0);
});

test('AudioQueue decodes out-of-order audio and schedules it contiguously by index', async () => {
    const starts = [];
    const audioContext = {
        currentTime: 1,
        destination: {},
        async decodeAudioData(arrayBuffer) {
            return { duration: new Uint8Array(arrayBuffer)[0] };
        },
        createBufferSource() {
            return {
                buffer: null,
                onended: null,
                connect() {},
                start(time) {
                    starts.push(time);
                    setTimeout(() => this.onended?.(), 0);
                },
                stop() {}
            };
        }
    };

    await new Promise(async (resolve, reject) => {
        const queue = new AudioQueue({ audioContext, onIdle: resolve });
        await queue.addEncoded(1, Uint8Array.of(2).buffer);
        await queue.addEncoded(0, Uint8Array.of(1).buffer);
        queue.markDone(2);
        setTimeout(() => reject(new Error('encoded queue did not drain')), 100);
    });

    assert.deepEqual(starts, [1.02, 2.02]);
});
