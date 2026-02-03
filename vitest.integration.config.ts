import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30000,
    maxWorkers: 1, // Run tests serially to avoid database conflicts
    setupFiles: ['tests/setup/vitest.integration.setup.ts'],
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
})
