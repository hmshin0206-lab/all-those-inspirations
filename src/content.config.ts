import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // essays / study / build appear in the menu; life only shows up in the archive
    category: z.enum(['essays', 'study', 'build', 'life']),
    topics: z.array(z.string()).default([]),
    stage: z.enum(['seedling', 'budding', 'evergreen']).default('evergreen'),
    series: z.string().optional(),
    description: z.string().optional(),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
    wpUrl: z.string().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string() }),
});

export const collections = { posts, pages };
