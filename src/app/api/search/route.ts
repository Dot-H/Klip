import { NextResponse } from 'next/server';
import { searchRoutes } from '~/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const results = await searchRoutes(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la recherche' },
      { status: 500 },
    );
  }
}
