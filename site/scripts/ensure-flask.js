#!/usr/bin/env node
/**
 * Ensure site/public/tools/flask/ has an index.html (real app or stub).
 * Run from repo root or site/. Used by site prebuild so the 3D Flask page never 404s.
 */

import { execSync } from 'child_process';
import { cpSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const flaskDir = join(root, 'site/public/tools/flask');
const stubPath = join(root, 'scripts/stub-flask-index.html');
const indexPath = join(flaskDir, 'index.html');

try {
  execSync('just build-flask', { cwd: root, stdio: 'pipe' });
} catch {
  // build-flask failed or just/dx not available; use stub below
}

if (!existsSync(flaskDir)) {
  mkdirSync(flaskDir, { recursive: true });
}
if (!existsSync(indexPath) && existsSync(stubPath)) {
  cpSync(stubPath, indexPath);
}
