import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createReport } from '~/lib/data';

const reportSchema = z.object({
  pitchId: z.string().uuid('ID de longueur invalide'),
  firstname: z.string().min(1, 'Le prénom est requis'),
  lastname: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  visualCheck: z.boolean().optional(),
  anchorCheck: z.boolean().optional(),
  cleaningDone: z.boolean().optional(),
  trundleDone: z.boolean().optional(),
  totalReboltingDone: z.boolean().optional(),
  comment: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = reportSchema.parse(body);

    const reportId = await createReport(validatedData);

    return NextResponse.json({ id: reportId }, { status: 201 });
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
