// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkObsidianMd from 'remark-obsidian-md';
import tailwindcss from '@tailwindcss/vite';
import ogImages from './src/integrations/og-images.ts';

function slugify(text) {
	if (!text) return '';
	return text
		.toString()
		.trim()
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9\u4e00-\u9fff\u3400-\u4dbf]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-+/g, '-');
}

// https://astro.build/config
export default defineConfig({
	site: 'https://www.fenghaiquan-ai.com',
	integrations: [mdx(), sitemap(), ogImages()],
	vite: {
		plugins: [tailwindcss()],
	},
	markdown: {
		processor: unified({
			remarkPlugins: [
			[remarkObsidianMd, {
				root: './src/content/blog',
				urlPrefix: '/blog',
				enableFrontmatter: false,
				slugify,
			}],
				remarkMath,
			],
			rehypePlugins: [
				rehypeKatex,
			],
		}),
	},
});
