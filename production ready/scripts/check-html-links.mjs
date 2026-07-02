import { access, readFile } from 'node:fs/promises';
import { dirname, join, normalize, relative } from 'node:path';

const root = process.cwd();
const htmlPath = join(root, 'index.html');
const html = await readFile(htmlPath, 'utf8');
const assetRefs = [];
const refPattern = /\b(?:src|href)=["']([^"']+)["']/g;
let match;

while ((match = refPattern.exec(html)) !== null) {
    const ref = match[1];
    if (/^(https?:|mailto:|#)/i.test(ref)) continue;
    assetRefs.push(ref);
}

const failures = [];

for (const ref of assetRefs) {
    const assetPath = ref.split(/[?#]/, 1)[0];
    const resolved = normalize(join(dirname(htmlPath), assetPath));
    if (!resolved.startsWith(root)) {
        failures.push(`${ref}: resolves outside project root`);
        continue;
    }
    try {
        await access(resolved);
    } catch {
        failures.push(`${ref}: missing ${relative(root, resolved)}`);
    }
}

if (failures.length) {
    console.error(`HTML asset-link check failed for ${failures.length} reference(s):`);
    console.error(failures.join('\n'));
    process.exit(1);
}

console.log(`HTML asset-link check passed for ${assetRefs.length} local reference(s).`);
