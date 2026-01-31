import { createNeonAuth } from '@neondatabase/neon-js/auth/next/server';

if (!process.env.NEON_AUTH_BASE_URL) {
  throw new Error('Missing NEON_AUTH_BASE_URL environment variable');
}

if (!process.env.NEON_AUTH_COOKIE_SECRET) {
  throw new Error('Missing NEON_AUTH_COOKIE_SECRET environment variable. Generate one with: openssl rand -base64 32');
}

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET,
  },
});
