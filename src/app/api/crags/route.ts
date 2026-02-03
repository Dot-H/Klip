import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '~/lib/auth/server';
import { createCrag, getUserByEmail } from '~/lib/data';

export const dynamic = 'force-dynamic';

const createCragSchema = z.object({
  name: z
    .string({ required_error: 'Le nom est requis' })
    .min(1, 'Le nom est requis')
    .max(200),
  convention: z.boolean().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    // Verify authentication
    const { data: session } = await auth.getSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 },
      );
    }

    // Check user role
    const user = await getUserByEmail(session.user.email);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'ROUTE_SETTER')) {
      return NextResponse.json(
        { error: 'Seuls les ouvreurs et administrateurs peuvent creer des sites' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = createCragSchema.parse(body);

    const cragId = await createCrag({
      name: validatedData.name,
      convention: validatedData.convention,
    });

    return NextResponse.json({ id: cragId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }

    console.error('Error creating crag:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la creation du site' },
      { status: 500 },
    );
  }
}
