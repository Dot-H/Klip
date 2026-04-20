# klip

Next.js + tRPC + Prisma app for managing climbing crags, sectors, routes, pitches, and re-bolting reports.

## Stack

- **Next.js** (App Router) + **React 19**
- **tRPC** for end-to-end typesafe APIs
- **Prisma 7** with the `@prisma/adapter-pg` Postgres adapter
- **MUI** for UI components
- **Playwright** (e2e) + **Vitest** (integration) + **Jest** (unit) for tests
- **Neon** Postgres in production, **local Postgres in Docker** for development and tests

## Requirements

- Node ≥ 20
- pnpm
- Docker (for the local dev/test Postgres containers)

## Booting the stack

```bash
pnpm install
pnpm dev
```

That single command:

1. Boots the local dev Postgres container (`docker-compose.dev.yml`, port **5434**, DB `klip_dev`) and waits for its healthcheck.
2. Runs `prisma migrate dev` and `prisma db seed` against that local DB.
3. Starts `next dev`.

Open <http://localhost:3000>.

To stop the DB when you're done: `pnpm dev:db:down`.
To wipe it and start fresh (drops the Docker volume): `pnpm dev:db:reset`.

### How the local dev DB is wired

Vercel CLI writes your Neon connection strings into `.env.development.local`, and `.env` is symlinked to `.env.local` which also points at Neon. If `pnpm dev` picked those up, every run would try to seed — i.e. wipe — your hosted Neon DB. The seed script blocks this with a safety check on `neon.tech` hostnames, which is why you saw:

> `❌ ERREUR: DATABASE_URL semble pointer vers une base de production!`

The fix: **all dev-time commands are wrapped with `dotenv-cli -e .env.dev --`**. `.env.dev` contains only:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/klip_dev"
```

`dotenv-cli` sets that into `process.env` *before* the child process starts, and because `dotenv` (loaded transitively by `prisma.config.ts` and by Next.js) only fills in missing env vars — it does not override what's already in `process.env` — the local URL wins over the Neon one in `.env.local` / `.env.development.local`. The Neon-related env vars (`NEON_AUTH_*`, `POSTGRES_*`, etc.) that the app legitimately needs still flow through from `.env.local` normally. This mirrors how the test setup already uses `.env.test`.

`.env.dev` is committed (credentials are local-only `postgres` / `postgres`) so new contributors don't have to set anything up manually.

### Available dev scripts

```bash
pnpm dev              # start db + migrate + seed + next dev  (one-shot)
pnpm dev:db:up        # start the local dev Postgres container (idempotent)
pnpm dev:db:down      # stop it
pnpm dev:db:reset     # drop volume + restart (erases all local data)
pnpm dev:db:setup     # run migrate deploy + seed against the local dev DB
pnpm dx               # start db, next dev, and Prisma Studio in parallel
pnpm dx:prisma-studio # Prisma Studio alone against the local dev DB
```

## Testing

The test setup is the same pattern, isolated on port 5433 / DB `klip_test`:

```bash
pnpm test:db:up        # start test Postgres (docker-compose.test.yml)
pnpm test:db:setup     # migrate + seed the test DB
pnpm test:e2e:local    # run Playwright headlessly against the test DB
pnpm test:db:down      # stop it
pnpm test:local        # full e2e cycle: up → setup → run → down
pnpm test:fast         # unit + integration (no browser, no e2e)
pnpm test:all          # unit + integration + e2e
```

See [`CLAUDE.md`](./CLAUDE.md) for the exact commands Claude Code should use when running e2e tests.

## Environment files

| File | Purpose | Committed? |
| --- | --- | --- |
| `.env` → `.env.local` (symlink) | Neon connection strings written by Vercel CLI. Used by the Next.js runtime for things like `NEON_AUTH_*`. | No |
| `.env.development.local` | Same as above, also written by `vercel env pull`. | No |
| `.env.dev` | Local dev DB override (`localhost:5434`). Loaded by `dotenv-cli` for every dev-time script. | **Yes** |
| `.env.test` | Local test DB override (`localhost:5433`). Loaded by `dotenv-cli` for every test script. | **Yes** |

## Deployment

The app deploys to Vercel against a Neon Postgres branch. `prebuild` runs `prisma generate` + `prisma migrate deploy` using the Neon `DATABASE_URL` / `DIRECT_DATABASE_URL` injected by Vercel. See `prisma.config.ts` for the `DIRECT_DATABASE_URL` preference (used for migrations through Neon's pooler).

## Files of note

| Path | Description |
| --- | --- |
| [`prisma/schema.prisma`](./prisma/schema.prisma) | Prisma schema |
| [`prisma/seed.ts`](./prisma/seed.ts) | Seed script with production-DB safety check |
| [`prisma.config.ts`](./prisma.config.ts) | Prisma 7 config (chooses `DIRECT_DATABASE_URL` over `DATABASE_URL` when set) |
| [`src/server/routers`](./src/server/routers) | tRPC routers |
| [`docker-compose.dev.yml`](./docker-compose.dev.yml) | Local dev Postgres (port 5434) |
| [`docker-compose.test.yml`](./docker-compose.test.yml) | Local test Postgres (port 5433) |
