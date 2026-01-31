'use client';

import { createAuthClient } from '@neondatabase/neon-js/auth/next';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

export const authClient = createAuthClient({
  adapter: BetterAuthReactAdapter(),
});
