// Integration test setup for Vitest
import dotenv from 'dotenv'
import path from 'path'

// Load .env.test only if DATABASE_URL is not already set (CI sets it directly)
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test') })
}

// Verify we're using the test database
if (!process.env.DATABASE_URL?.includes('localhost')) {
  console.error('ERROR: DATABASE_URL does not point to localhost!')
  console.error('Integration tests require a local test database.')
  process.exit(1)
}
