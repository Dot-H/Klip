// Integration test setup
// Ensure test environment is loaded before any modules
const dotenv = require('dotenv');
const path = require('path');

// Load .env.test
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Verify we're using the test database
if (!process.env.DATABASE_URL?.includes('localhost')) {
  console.error('ERROR: DATABASE_URL does not point to localhost!');
  console.error('Integration tests require a local test database.');
  process.exit(1);
}
