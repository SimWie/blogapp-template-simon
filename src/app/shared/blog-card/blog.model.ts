import { z } from 'zod';

export const blogSchema = z.object({
  id: z.number(),
  title: z.string(),
  contentPreview: z.string(),
  author: z.string(),
  likes: z.number(),
  comments: z.number(),
  likedByMe: z.boolean(),
  createdByMe: z.boolean(),
  headerImageUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const blogListSchema = z.array(blogSchema);

export type Blog = z.infer<typeof blogSchema>;

export interface BlogContent {
  data: Blog[];
}
