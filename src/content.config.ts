import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    description: z.string(),
    module: z.string(),
    order: z.number(),
    minutes: z.number().default(10),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  }),
});

export const collections = { lessons };
