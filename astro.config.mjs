// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { defineConfig, fontProviders } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkObsidianMd from 'remark-obsidian-md';

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
	site: 'https://example.com',
	integrations: [mdx(), sitemap()],
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
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
