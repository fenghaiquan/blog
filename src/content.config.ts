import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({
		pattern: '**/*.md',
		base: '/mnt/d/Documents/Obsidian/LLMBrain/5_Output/Published',
	}),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		description: z.string().optional(),
		tags: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
		image: z.string().optional(),
	}),
});

export const collections = { blog };
