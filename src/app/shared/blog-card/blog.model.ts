// zod/mini statt zod: gleiche Validierung, aber ohne die chainable "classic"
// API -- deutlich kleiner im Production-Bundle (siehe Angular-Budget).
import * as z from 'zod/mini';

const blogSchema = z.object({
  id: z.number(),
  title: z.string(),
  contentPreview: z.string(),
  author: z.string(),
  likes: z.number(),
  comments: z.number(),
  likedByMe: z.boolean(),
  createdByMe: z.boolean(),
  headerImageUrl: z.optional(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const blogListSchema = z.array(blogSchema);

export type Blog = z.infer<typeof blogSchema>;

export interface BlogContent {
  data: Blog[];
}
