import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/server/prisma';
import { z } from 'zod';

const postIdSchema = z.string().uuid();

const defaultPostSelect = {
  id: true,
  title: true,
  text: true,
  createdAt: true,
  updatedAt: true,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = await params.then(p => p.id);
  const input = postIdSchema.safeParse(id);

  if (!input.success) {
    return NextResponse.json({ error: input.error.errors }, { status: 400 });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: input.data },
      select: defaultPostSelect,
    });

    if (!post) {
      return NextResponse.json({ error: `No post with id '${id}'` }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}
