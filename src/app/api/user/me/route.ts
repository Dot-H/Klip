import { NextResponse } from 'next/server';
import { auth } from '~/lib/auth/server';
import { getOrCreateUser } from '~/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: session } = await auth.getSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 },
      );
    }

    const user = await getOrCreateUser(
      session.user.email,
      session.user.name || undefined,
    );

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 },
    );
  }
}
