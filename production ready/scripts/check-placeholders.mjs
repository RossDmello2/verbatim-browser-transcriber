import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.cache', '.expo', 'test-results', 'playwright-report']);
const checkedExtensions = new Set(['.md', '.yml', '.yaml', '.json', '.txt', '.toml']);
const tokenPattern = /\[(PROJECT_ROOT|PROJECT_NAME|PROJECT_DESCRIPTION|AUTHOR_NAME|AUTHOR_EMAIL|GITHUB_USERNAME|GITHUB_REPO_NAME|LICENSE_TYPE|PRIMARY_ENTRYPOINT|TEST_COMMAND|YEAR|DEPRECATED_COMPONENTS)\]/;

function extensionOf(fileName) {
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
        if (tokenPattern.test(line)) {
            failures.push(`${relative(root, file)}:${index + 1}: ${line.trim()}`);
        }
    });
}

if (failures.length) {
    console.error(`Placeholder check failed for ${failures.length} line(s):`);
    console.error(failures.join('\n'));
    process.exit(1);
}

console.log(`Placeholder check passed for ${files.length} file(s).`);
