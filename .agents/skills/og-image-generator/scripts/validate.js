#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../../..');

const MANIFEST_PATH = path.join(rootDir, '.og-manifest.json');
const OG_DIR = path.join(rootDir, 'public/og');

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('[og-validate] No manifest found. Run prepare-manifest.js first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function getExpectedSize(skill) {
  return skill === 'canvas-design' ? { width: 1080, height: 1080 } : { width: 1200, height: 630 };
}

async function validateImage(filePath, expectedSize) {
  const issues = [];
  
  if (!fs.existsSync(filePath)) {
    return { valid: false, issues: ['File not found'] };
  }

  const stats = fs.statSync(filePath);
  
  // Check file size (should be 15KB - 2MB)
  if (stats.size < 15 * 1024) {
    issues.push(`File too small (${Math.round(stats.size / 1024)}KB), may be corrupted`);
  }
  if (stats.size > 2 * 1024 * 1024) {
    issues.push(`File too large (${Math.round(stats.size / 1024)}KB), exceeds platform limits`);
  }

  // Check image dimensions
  try {
    const metadata = await sharp(filePath).metadata();
    if (metadata.width !== expectedSize.width || metadata.height !== expectedSize.height) {
      issues.push(`Wrong dimensions: ${metadata.width}x${metadata.height} (expected ${expectedSize.width}x${expectedSize.height})`);
    }
  } catch (err) {
    issues.push(`Cannot read image metadata: ${err.message}`);
  }

  return {
    valid: issues.length === 0,
    issues,
    fileSize: stats.size,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const slugArg = args.find((a) => a.startsWith('--slug='));
  const targetSlug = slugArg?.split('=').slice(1).join('=');

  const manifest = loadManifest();
  const tasks = manifest.tasks.filter((t) => t.status === 'screenshotted');

  if (tasks.length === 0) {
    console.log('[og-validate] No images to validate.');
    return;
  }

  console.log(`[og-validate] Validating ${tasks.length} images...\n`);

  let passed = 0;
  let failed = 0;

  for (const task of tasks) {
    if (targetSlug && task.slug !== targetSlug) continue;

    const pngPath = path.join(OG_DIR, `${task.slug}.png`);
    const expectedSize = getExpectedSize(task.skill);
    const result = await validateImage(pngPath, expectedSize);

    if (result.valid) {
      console.log(`✓ ${task.slug}.png (${Math.round(result.fileSize / 1024)}KB, ${expectedSize.width}x${expectedSize.height})`);
      task.status = 'validated';
      task.validatedAt = new Date().toISOString();
      passed++;
    } else {
      console.log(` ${task.slug}.png: ${result.issues.join(', ')}`);
      task.status = 'failed';
      task.validationIssues = result.issues;
      task.failedAt = new Date().toISOString();
      failed++;
    }
  }

  saveManifest(manifest);

  console.log(`\n[og-validate] Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n[og-validate] Failed tasks marked for regeneration.');
    console.log('Run `npm run og:prepare` to regenerate failed images.');
  }
}

main();
