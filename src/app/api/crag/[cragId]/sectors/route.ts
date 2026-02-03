import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '~/lib/auth/server';
import { createSector, getUserByEmail } from '~/lib/data';

export const dynamic = 'force-dynamic';

const createSectorSchema = z.object({
  name: z
    .string({ required_error: 'Le nom est requis' })
    .min(1, 'Le nom est requis')
    .max(200),
});

const cragIdSchema = z.string().uuid('ID de site invalide');

export async function POST(
  request: Request,
  { params }: { params: Promise<{ cragId: string }> },
) {
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
        { error: 'Seuls les ouvreurs et administrateurs peuvent creer des secteurs' },
        { status: 403 },
      );
    }

    // Validate cragId
    const { cragId } = await params;
    const validatedCragId = cragIdSchema.parse(cragId);

    const body = await request.json();
    const validatedData = createSectorSchema.parse(body);

    const sectorId = await createSector({
      cragId: validatedCragId,
      name: validatedData.name,
    });

    return NextResponse.json({ id: sectorId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === 'Site non trouvé') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error('Error creating sector:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la creation du secteur' },
      { status: 500 },
    );
  }
}
