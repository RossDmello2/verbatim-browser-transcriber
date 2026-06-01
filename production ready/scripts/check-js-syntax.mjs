import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.cache', '.expo', 'test-results', 'playwright-report']);

async function collectJsFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (!ignoredDirs.has(entry.name)) {
                files.push(...await collectJsFiles(join(dir, entry.name)));
            }
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(join(dir, entry.name));
        }
    }
    return files;
}

const files = await collectJsFiles(root);
const failures = [];

for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) {
        failures.push(`${relative(root, file)}\n${result.stderr || result.stdout}`);
    }
}

if (failures.length) {
    console.error(`JavaScript syntax check failed for ${failures.length} file(s):`);
    console.error(failures.join('\n'));
    process.exit(1);
}

console.log(`JavaScript syntax check passed for ${files.length} file(s).`);
