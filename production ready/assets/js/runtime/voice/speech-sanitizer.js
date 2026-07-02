function isLetter(character = '') {
    return /\p{L}/u.test(character);
}

export function sanitizeForSpeech(input) {
    if (!input) return '';
    let text = String(input);

    text = text.replace(/\r\n?/g, '\n');
    text = text.replace(/[\u2018\u2019\u201B]/g, "'");
    text = text.replace(/[\u201C\u201D]/g, '"');
    text = text.replace(/[\u2013\u2014]/g, ', ');
    text = text.replace(/\u2026/g, '. ');

    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/`([^`]*)`/g, '$1');

    text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
    text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    text = text.replace(/\b(?:https?:\/\/|www\.)[^\s<>()\[\]{}]+/gi, ' link ');

    text = text.replace(/(\*\*|__)([\s\S]*?)\1/g, '$2');
    text = text.replace(/\*([^*\n]+?)\*/g, '$1');
    text = text.replace(/~~([\s\S]*?)~~/g, '$1');
    text = text.replace(/^\s{0,3}#{1,6}\s*/gm, '');
    text = text.replace(/^\s{0,3}>\s?/gm, '');
    text = text.replace(/^\s*[-*+]\s+/gm, '');
    text = text.replace(/^\s*\d+[.)]\s+/gm, '');
    text = text.replace(/^\s*\|.*\|\s*$/gm, ' ');
    text = text.replace(/^\s*[-=_]{3,}\s*$/gm, ' ');

    text = text.replace(/\$\s*(\d[\d,]*(?:\.\d+)?)/g, '$1 dollars');
    text = text.replace(/(\d(?:[\d,.]*\d)?)\s*%/g, '$1 percent');
    text = text.replace(/&/g, ' and ');
    text = text.replace(/([\p{L}\p{N}]+)\s*\/\s*([\p{L}\p{N}]+)/gu, '$1 or $2');
    text = text.replace(/\//g, ' ');
    text = text.replace(/_/g, ' ');
    text = text.replace(/-(?=\d)/g, 'minus ');
    text = text.replace(/-/g, ' ');

    text = text.replace(/["\u00ab\u00bb#^~`|<>{}\[\]*+=\\@$%]/g, ' ');
    text = text.replace(/'/g, (apostrophe, offset, whole) => (
        isLetter(whole[offset - 1]) && isLetter(whole[offset + 1]) ? apostrophe : ' '
    ));

    text = text.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\uFE0F]/gu, ' ');

    text = text.replace(/\s+([.,!?;:])/g, '$1');
    text = text.replace(/([.!?])\1{1,}/g, '$1');
    text = text.replace(/\s+/g, ' ');
    return text.trim();
}

export function splitSpeechForProvider(input, maxChars = 190) {
    const limit = Math.max(1, Math.min(200, Number(maxChars) || 190));
    let remaining = String(input || '').trim();
    const chunks = [];

    while (remaining) {
        if (remaining.length <= limit) {
            chunks.push(remaining);
            break;
        }

        let boundary = -1;
        for (let index = limit; index > 0; index--) {
            if (/\s/.test(remaining[index])) {
                boundary = index;
                break;
            }
        }

        const take = boundary > 0 ? boundary : limit;
        const chunk = remaining.slice(0, take).trim();
        if (chunk) chunks.push(chunk);
        remaining = remaining.slice(take).trimStart();
    }

    return chunks;
}
