#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../../..');

const MANIFEST_PATH = path.join(rootDir, '.og-manifest.json');
const CACHE_DIR = path.join(rootDir, '.og-cache');
const OG_DIR = path.join(rootDir, 'public/og');

function ensureChineseFonts() {
  try {
    execSync('fc-list :lang=zh | grep -i "noto"', { stdio: 'pipe' });
    console.log('[og-screenshot] Chinese fonts detected.');
    return true;
  } catch {
    console.warn('[og-screenshot] Chinese fonts not found.');
    console.warn('[og-screenshot] Install manually: curl -L -o ~/.local/share/fonts/NotoSansSC-Regular.ttf "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf" && fc-cache -fv ~/.local/share/fonts');
    return false;
  }
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('[og-screenshot] No manifest found. Run prepare-manifest.js first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

async function screenshotHtml(htmlContent, outputPath, width, height) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height });
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outputPath, type: 'png' });
  } finally {
    await browser.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cleanup = args.includes('--cleanup');

  const hasSystemFonts = ensureChineseFonts();
  if (!hasSystemFonts) {
    console.log('[og-screenshot] Will use HTML preprocessing for font loading.');
  }

  const manifest = loadManifest();
  const doneTasks = manifest.tasks.filter((t) => t.status === 'done' && t.path === 'opendesign');

  if (doneTasks.length === 0) {
    console.log('[og-screenshot] No completed tasks found in manifest.');
    return;
  }

  fs.mkdirSync(OG_DIR, { recursive: true });

  console.log(`[og-screenshot] Processing ${doneTasks.length} Open Design tasks...`);

  for (const task of doneTasks) {
    const outputPath = path.join(OG_DIR, `${task.slug}.png`);
    const htmlPath = path.join(CACHE_DIR, `${task.slug}.html`);

    if (!fs.existsSync(htmlPath)) {
      console.warn(`[og-screenshot] HTML not found for ${task.slug}, skipping.`);
      continue;
    }

    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    const width = task.skill === 'canvas-design' ? 1080 : 1200;
    const height = task.skill === 'canvas-design' ? 1080 : 630;

    console.log(`[og-screenshot] ${task.slug}.png (${width}x${height}, ${task.skill})`);
    await screenshotHtml(htmlContent, outputPath, width, height);

    task.status = 'screenshotted';
    task.screenshottedAt = new Date().toISOString();
  }

  saveManifest(manifest);

  if (cleanup) {
    console.log('\n[og-screenshot] Cleaning up cache...');
    if (fs.existsSync(CACHE_DIR)) {
      fs.rmSync(CACHE_DIR, { recursive: true });
    }
    console.log('[og-screenshot] Cache cleaned.');
  }

  console.log('\n[og-screenshot] Done!');
}

main().catch((err) => {
  console.error('[og-screenshot] Error:', err);
  process.exit(1);
});
