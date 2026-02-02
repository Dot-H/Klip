import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '~/lib/auth/server';
import { createReportWithAuth } from '~/lib/data';

export const dynamic = 'force-dynamic';

const reportSchema = z.object({
  pitchIds: z.array(z.string().min(1, 'ID de longueur invalide')).min(1, 'Sélectionnez au moins une longueur'),
  visualCheck: z.boolean().optional(),
  anchorCheck: z.boolean().optional(),
  cleaningDone: z.boolean().optional(),
  trundleDone: z.boolean().optional(),
  totalReboltingDone: z.boolean().optional(),
  comment: z.string().optional(),
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

    const body = await request.json();
    const { pitchIds, ...reportData } = reportSchema.parse(body);

    // Create a report for each selected pitch
    const reportIds = await Promise.all(
      pitchIds.map((pitchId) =>
        createReportWithAuth({
          ...reportData,
          pitchId,
          userEmail: session.user.email,
          userName: session.user.name || undefined,
        }),
      ),
    );

    return NextResponse.json({ ids: reportIds }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }

    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du rapport' },
      { status: 500 },
    );
  }
}
