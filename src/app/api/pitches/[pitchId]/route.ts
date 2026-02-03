import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '~/lib/auth/server';
import { getUserByEmail, getPitch, updatePitch } from '~/lib/data';
import { isValidCotation } from '~/lib/grades';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  length: z.number().int().positive().nullable().optional(),
  cotation: z
    .string()
    .max(10)
    .refine((val) => isValidCotation(val), { message: 'Cotation invalide (ex: 6a, 7b+)' })
    .nullable()
    .optional(),
});

interface RouteParams {
  params: Promise<{ pitchId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
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
        { error: 'Seuls les ouvreurs et administrateurs peuvent modifier les longueurs' },
        { status: 403 },
      );
    }

    const { pitchId } = await params;
    const pitch = await getPitch(pitchId);

    if (!pitch) {
      return NextResponse.json(
        { error: 'Longueur non trouvée' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    await updatePitch(pitchId, validatedData);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }

    console.error('Error updating pitch:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la modification' },
      { status: 500 },
    );
  }
}
