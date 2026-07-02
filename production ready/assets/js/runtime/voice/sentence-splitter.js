export class SentenceSplitter {
    constructor({ softCap = 160, maxChars = 190, onChunk = null } = {}) {
        this.maxChars = Math.max(1, Math.min(200, Number(maxChars) || 190));
        this.softCap = Math.max(1, Math.min(this.maxChars, Number(softCap) || 160));
        this.onChunk = typeof onChunk === 'function' ? onChunk : null;
        this.buffer = '';
    }

    push(text = '') {
        this.buffer += String(text || '');
        this.#drainSentences();
        this.#drainSoftCap();
    }

    flush() {
        while (this.buffer.trim()) {
            this.#emit(this.#takeBounded(this.maxChars));
        }
        this.buffer = '';
    }

    #drainSentences() {
        while (this.buffer) {
            const match = /[.!?\n](?:["')\]]?)(?=\s|$)/.exec(this.buffer);
            if (!match) return;
            const boundary = match.index + match[0].length;
            const sentence = this.buffer.slice(0, boundary);
            this.buffer = this.buffer.slice(boundary).replace(/^\s+/, '');
            this.#emitBounded(sentence);
        }
    }

    #drainSoftCap() {
        while (this.buffer.length >= this.softCap) {
            const limit = Math.min(this.softCap, this.maxChars);
            const boundary = this.#lastWhitespaceAtOrBefore(this.buffer, limit);
            if (boundary <= 0 && this.buffer.length < this.maxChars) return;
            const take = boundary > 0 ? boundary : this.maxChars;
            const chunk = this.buffer.slice(0, take);
            this.buffer = this.buffer.slice(take).replace(/^\s+/, '');
            this.#emit(chunk);
        }
    }

    #emitBounded(text) {
        let remaining = String(text || '').trim();
        while (remaining.length > this.maxChars) {
            const boundary = this.#lastWhitespaceAtOrBefore(remaining, this.maxChars);
            const take = boundary > 0 ? boundary : this.maxChars;
            this.#emit(remaining.slice(0, take));
            remaining = remaining.slice(take).trim();
        }
        this.#emit(remaining);
    }

    #takeBounded(limit) {
        const trimmed = this.buffer.trimStart();
        if (trimmed.length <= limit) {
            this.buffer = '';
            return trimmed;
        }
        const boundary = this.#lastWhitespaceAtOrBefore(trimmed, limit);
        const take = boundary > 0 ? boundary : limit;
        const chunk = trimmed.slice(0, take);
        this.buffer = trimmed.slice(take).trimStart();
        return chunk;
    }

    #lastWhitespaceAtOrBefore(text, limit) {
        for (let index = Math.min(limit, text.length - 1); index > 0; index--) {
            if (/\s/.test(text[index])) return index;
        }
        return -1;
    }

    #emit(text) {
        const chunk = String(text || '').trim();
        if (chunk && this.onChunk) this.onChunk(chunk);
    }
}
