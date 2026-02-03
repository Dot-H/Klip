import { defineConfig } from 'prisma/config'

// Determine database URL: prefer DIRECT_DATABASE_URL for migrations (Neon pooled connections),
// fall back to DATABASE_URL for local dev/CI
// Return undefined if neither is set (e.g., during prisma generate in CI)
const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  ...(databaseUrl && {
    datasource: {
      url: databaseUrl,
    },
  }),
})
