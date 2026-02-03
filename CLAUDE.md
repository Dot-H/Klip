# CLAUDE.md

This file contains instructions for Claude Code when working on this project.

## Running E2E Tests

When running e2e tests locally, always run them in headless mode to prevent browser windows from opening:

```bash
# Run e2e tests headlessly (recommended)
PLAYWRIGHT_HEADLESS=1 pnpm test:e2e:local
```

The test database setup commands:

```bash
# Start test database (uses port 5433 to avoid conflicts)
pnpm test:db:up

# Setup database schema and seed data
pnpm test:db:setup

# Run e2e tests with test database
PLAYWRIGHT_HEADLESS=1 pnpm test:e2e:local

# Stop test database
pnpm test:db:down
```

## Environment Configuration

- `.env` - Production/development configuration (contains Neon database credentials)
- `.env.test` - Test environment configuration (uses local PostgreSQL on port 5433)

The seed script has safety checks to prevent running against production databases.
