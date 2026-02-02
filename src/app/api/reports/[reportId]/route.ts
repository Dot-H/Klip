import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '~/lib/auth/server';
import { getReport, updateReport, deleteReport } from '~/lib/data';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  visualCheck: z.boolean().optional(),
  anchorCheck: z.boolean().optional(),
  cleaningDone: z.boolean().optional(),
  trundleDone: z.boolean().optional(),
  totalReboltingDone: z.boolean().optional(),
  comment: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ reportId: string }>;
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

    const { reportId } = await params;
    const report = await getReport(reportId);

    if (!report) {
      return NextResponse.json(
        { error: 'Rapport non trouvé' },
        { status: 404 },
      );
    }

    // Check ownership
    if (report.reporter.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Vous ne pouvez modifier que vos propres rapports' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    await updateReport(reportId, validatedData);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }

    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la modification du rapport' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { data: session } = await auth.getSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 },
      );
    }

    const { reportId } = await params;
    const report = await getReport(reportId);

    if (!report) {
      return NextResponse.json(
        { error: 'Rapport non trouvé' },
        { status: 404 },
      );
    }

    // Check ownership
    if (report.reporter.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Vous ne pouvez supprimer que vos propres rapports' },
        { status: 403 },
      );
    }

    await deleteReport(reportId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression du rapport' },
      { status: 500 },
    );
  }
}
