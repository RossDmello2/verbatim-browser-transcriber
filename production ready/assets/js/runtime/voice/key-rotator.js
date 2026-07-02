export class KeyRotator {
    constructor(keys = []) {
        this.cursor = 0;
        this.setKeys(keys);
    }

    setKeys(keys = []) {
        this.keys = [...new Set((keys || []).map(key => String(key || '').trim()).filter(Boolean))];
        if (this.keys.length) this.cursor %= this.keys.length;
        else this.cursor = 0;
        return this;
    }

    get size() {
        return this.keys.length;
    }

    next(excluded = []) {
        if (!this.keys.length) return '';
        const blocked = new Set(Array.from(excluded || []).map(String));
        for (let checked = 0; checked < this.keys.length; checked++) {
            const key = this.keys[this.cursor % this.keys.length];
            this.cursor = (this.cursor + 1) % this.keys.length;
            if (!blocked.has(key)) return key;
        }
        return '';
    }
}
