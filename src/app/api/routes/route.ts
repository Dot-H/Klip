import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '~/lib/auth/server';
import { createRoute, getUserByEmail } from '~/lib/data';

export const dynamic = 'force-dynamic';

const pitchSchema = z.object({
  cotation: z.string().max(10).optional().nullable(),
  length: z.number().int().positive().optional().nullable(),
});

const createRouteSchema = z.object({
  sectorId: z.string().uuid('ID de secteur invalide'),
  number: z.number().int().positive('Le numero doit etre positif'),
  name: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  pitches: z.array(pitchSchema).min(1, 'Au moins une longueur requise'),
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
        { error: 'Seuls les ouvreurs et administrateurs peuvent creer des voies' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = createRouteSchema.parse(body);

    const routeId = await createRoute(validatedData);

    return NextResponse.json({ id: routeId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === 'Secteur non trouvé') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error('Error creating route:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la creation de la voie' },
      { status: 500 },
    );
  }
}
