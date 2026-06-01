import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.cache', '.expo', 'test-results', 'playwright-report']);
const checkedExtensions = new Set(['.html', '.js', '.css', '.md', '.json', '.yml', '.yaml', '.toml', '.env', '.example', '.txt']);
const patterns = [
    { name: 'OpenAI-style secret key', regex: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
    { name: 'Groq secret key', regex: /\bgsk_[A-Za-z0-9_-]{20,}\b/ },
    { name: 'Google API key', regex: /\bAIza[0-9A-Za-z_-]{20,}\b/ },
    { name: 'Hardcoded bearer token', regex: /Authorization["']?\s*:\s*["']Bearer\s+[A-Za-z0-9._-]{20,}/i }
];

function extensionOf(fileName) {
    if (fileName === '.env.example') return '.example';
    const dot = fileName.lastIndexOf('.');
    return dot === -1 ? '' : fileName.slice(dot);
}

async function collectFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (!ignoredDirs.has(entry.name)) {
                files.push(...await collectFiles(join(dir, entry.name)));
            }
        } else if (entry.isFile() && checkedExtensions.has(extensionOf(entry.name))) {
            files.push(join(dir, entry.name));
        }
    }
    return files;
}

const files = await collectFiles(root);
const failures = [];

for (const file of files) {
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
    lines.forEach((line, index) => {
        for (const pattern of patterns) {
            if (pattern.regex.test(line)) {
                failures.push(`${relative(root, file)}:${index + 1}: ${pattern.name}`);
            }
        }
    });
}

if (failures.length) {
    console.error(`Secret-pattern check failed for ${failures.length} line(s):`);
    console.error(failures.join('\n'));
    process.exit(1);
}

console.log(`Secret-pattern check passed for ${files.length} file(s).`);
