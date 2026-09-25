#!/usr/bin/env bash
# Usage: bash scripts/update_trackingserver_dependencies.sh
# Requires Node.js, but no npm install. Can be run from any working directory.
# Merge declared dependencies (not devDependencies or installed/lockfile versions).
# App entries override root entries; file: references use the local package version.
# Only the target's dependencies object is replaced; all other bytes are preserved.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

if ! command -v node >/dev/null 2>&1; then
    echo "Error: Node.js is required to update the TrackingServer dependencies." >&2
    exit 1
fi

node - "$REPO_ROOT" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const root = process.argv[2];
const app = path.join(root, 'tools/ReFlex.TrackingServer/ClientApp');
const target = path.join(app, 'src/assets/data/package.json');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

try {
    const dependencies = {};
    for (const directory of [root, app]) {
        const source = path.join(directory, 'package.json');
        const entries = readJson(source).dependencies ?? {};
        if (!isObject(entries)) throw new Error(`Invalid dependencies in ${source}`);
        for (const [name, specification] of Object.entries(entries)) {
            if (typeof specification !== 'string') throw new Error(`Invalid dependency ${name} in ${source}`);
            let version = specification;
            if (specification.startsWith('file:')) {
                const localFile = path.resolve(directory, specification.slice(5), 'package.json');
                const local = readJson(localFile);
                if (local.name !== name || typeof local.version !== 'string' || !local.version.trim()) {
                    throw new Error(`Expected package ${name} with a version in ${localFile}`);
                }
                version = local.version;
            }
            dependencies[name] = version;
        }
    }

    const original = fs.readFileSync(target, 'utf8');
    if (!isObject(readJson(target).dependencies)) throw new Error(`Missing dependencies object in ${target}`);

    // Find the top-level object without reformatting the surrounding JSON.
    // Strings are consumed as complete tokens so braces inside strings are ignored.
    const tokens = /"(?:\\.|[^"\\])*"|[{}\[\]]/g;
    let depth = 0;
    let start;
    let end;
    let keyPosition;
    for (const token of original.matchAll(tokens)) {
        const value = token[0];
        if (depth === 1 && value.startsWith('"') && JSON.parse(value) === 'dependencies') {
            const following = original.slice(token.index + value.length).match(/^\s*:\s*\{/);
            if (following) {
                start = token.index + value.length + following[0].length - 1;
                keyPosition = token.index;
            }
        }
        if (value === '{' || value === '[') depth++;
        if (value === '}' || value === ']') depth--;
        if (start !== undefined && token.index >= start && depth === 1) {
            end = token.index + 1;
            break;
        }
    }
    if (end === undefined) throw new Error(`Cannot locate dependencies in ${target}`);

    const indent = original.slice(original.lastIndexOf('\n', keyPosition) + 1, keyPosition).match(/^[\t ]*/)[0];
    const newline = original.includes('\r\n') ? '\r\n' : '\n';
    const sorted = Object.fromEntries(Object.entries(dependencies).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
    const replacement = JSON.stringify(sorted, null, 2).replace(/\n/g, newline + indent);
    const updated = original.slice(0, start) + replacement + original.slice(end);
    JSON.parse(updated);
    if (updated !== original) fs.writeFileSync(target, updated);
    console.log(`Updated ${Object.keys(dependencies).length} dependencies in ${target}`);
} catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
}
NODE
