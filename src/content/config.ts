import { defineCollection, z } from 'astro:content';

const productsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    artist: z.string(),
    price: z.number(),
    currency: z.string().default('USD'),
    description: z.string(),
    category: z.enum(['painting', 'sculpture', 'photography', 'digital', 'print']),
    image: z.string(),
    dimensions: z.string().optional(),
    available: z.boolean().default(true),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  products: productsCollection,
};