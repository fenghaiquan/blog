#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'node:fs/promises';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'content-sources.json');
const DEFAULT_TARGET = 'src/content/blog';

async function sync() {
	if (!fs.existsSync(CONFIG_PATH)) {
		console.log('[sync] content-sources.json not found, skipping');
		return;
	}

	const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
	const targetDir = path.join(ROOT, config.target || DEFAULT_TARGET);
	const clean = process.argv.includes('--clean') || config.clean === true;

	fs.mkdirSync(targetDir, { recursive: true });

	const syncedFiles = new Set();

	for (const source of config.sources || []) {
		const sourcePath = path.resolve(source.path);

		if (!fs.existsSync(sourcePath)) {
			console.warn(`[sync] Source not found, skipping: ${source.path}`);
			continue;
		}

		console.log(`[sync] Syncing from ${source.name}: ${source.path}`);

		const pattern = source.pattern || '**/*.md';
		const files = await Array.fromAsync(glob(pattern, { cwd: sourcePath }));

		for (const file of files) {
			const src = path.join(sourcePath, file);
			const dest = path.join(targetDir, path.basename(file));

			fs.copyFileSync(src, dest);
			syncedFiles.add(path.basename(file));
			console.log(`  ✓ ${file}`);
		}
	}

	if (clean) {
		const targetFiles = fs.readdirSync(targetDir).filter(f => /\.(md|mdx)$/.test(f));
		for (const file of targetFiles) {
			if (!syncedFiles.has(file)) {
				fs.unlinkSync(path.join(targetDir, file));
				console.log(`  ✗ Removed: ${file}`);
			}
		}
	}

	console.log(`[sync] Done. ${syncedFiles.size} file(s) synced.`);
}

sync().catch(err => {
	console.error('[sync] Error:', err.message);
	process.exit(1);
});
