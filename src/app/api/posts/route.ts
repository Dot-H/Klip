import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/server/prisma';
import { z } from 'zod';

const postCreateSchema = z.object({
  title: z.string().min(1).max(32),
  text: z.string().min(1),
});

const postListSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
  cursor: z.string().optional(),
});

const defaultPostSelect = {
  id: true,
  title: true,
  text: true,
  createdAt: true,
  updatedAt: true,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = postListSchema.safeParse(Object.fromEntries(searchParams));

  if (!input.success) {
    return NextResponse.json({ error: input.error.errors }, { status: 400 });
  }

  const limit = input.data.limit ?? 50;
  const cursor = input.data.cursor;

  try {
    const items = await prisma.post.findMany({
      select: defaultPostSelect,
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

    let nextCursor: typeof cursor | undefined = undefined;
    if (items.length > limit) {
      const nextItem = items.pop()!;
      nextCursor = nextItem.id;
    }

    return NextResponse.json({ items: items.reverse(), nextCursor });
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const input = postCreateSchema.safeParse(body);

  if (!input.success) {
    return NextResponse.json({ error: input.error.errors }, { status: 400 });
  }

  try {
    const post = await prisma.post.create({
      data: input.data,
      select: defaultPostSelect,
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
