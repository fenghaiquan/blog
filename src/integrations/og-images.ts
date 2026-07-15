import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

export default function ogImagesIntegration() {
  return {
    name: 'og-images',
    hooks: {
      'astro:build:start': async () => {
        console.log('[og-images] Generating OG images...');
        try {
          execSync('node scripts/generate-og-images.js', {
            cwd: rootDir,
            stdio: 'inherit',
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error('[og-images] Failed to generate OG images:', message);
        }
      },
    },
  };
}
