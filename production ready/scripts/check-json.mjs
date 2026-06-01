import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.cache', '.expo', 'test-results', 'playwright-report']);

async function collectJsonFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (!ignoredDirs.has(entry.name)) {
                files.push(...await collectJsonFiles(join(dir, entry.name)));
            }
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            files.push(join(dir, entry.name));
        }
    }
    return files;
}

const files = await collectJsonFiles(root);
const failures = [];

for (const file of files) {
    try {
        JSON.parse(await readFile(file, 'utf8'));
    } catch (error) {
        failures.push(`${relative(root, file)}: ${error.message}`);
    }
}

if (failures.length) {
    console.error(`JSON parse check failed for ${failures.length} file(s):`);
    console.error(failures.join('\n'));
    process.exit(1);
}

console.log(`JSON parse check passed for ${files.length} file(s).`);
