import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const OG_DIR = path.join(rootDir, 'public/og');

function isInGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function hasOGImageChanges() {
  try {
    const status = execSync('git status --porcelain public/og/', { stdio: 'pipe' }).toString();
    return status.trim().length > 0;
  } catch {
    return false;
  }
}

function amendCommit() {
  try {
    execSync('git add public/og/', { stdio: 'inherit' });
    execSync('git commit --amend --no-edit', { stdio: 'inherit' });
    console.log('[post-og-commit] Amended commit with new OG images');
  } catch (err) {
    console.error('[post-og-commit] Failed to amend commit:', err.message);
    process.exit(1);
  }
}

function main() {
  if (!isInGitRepo()) {
    console.log('[post-og-commit] Not in git repo, skipping');
    return;
  }

  if (!fs.existsSync(OG_DIR)) {
    console.log('[post-og-commit] No public/og/ directory, skipping');
    return;
  }

  if (!hasOGImageChanges()) {
    console.log('[post-og-commit] No OG image changes, skipping');
    return;
  }

  console.log('[post-og-commit] Found OG image changes, amending commit...');
  amendCommit();
}

main();
