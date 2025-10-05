/**
 * Data access layer for Prisma operations
 * Following Next.js best practices for server components
 */

import { prisma } from '~/server/prisma';

export interface Post {
  id: string;
  title: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostsResponse {
  items: Post[];
  nextCursor: string | null;
}

/**
 * Get posts with pagination
 */
export async function getPosts(limit = 5, cursor?: string): Promise<PostsResponse> {
  const items = await prisma.post.findMany({
    take: limit + 1,
    cursor: cursor
      ? {
          id: cursor,
        }
      : undefined,
    orderBy: {
      createdAt: 'desc',
    },
  });

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const nextItem = items.pop()!;
    nextCursor = nextItem.id;
  }

  return {
    items: items.reverse(),
    nextCursor,
  };
}

/**
 * Get a single post by ID
 */
export async function getPost(id: string): Promise<Post | null> {
  return prisma.post.findUnique({
    where: { id },
  });
}

/**
 * Create a new post
 */
export async function createPost(title: string, text: string): Promise<Post> {
  return prisma.post.create({
    data: {
      title,
      text,
    },
  });
}
