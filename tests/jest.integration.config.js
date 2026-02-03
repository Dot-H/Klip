const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  rootDir: '..',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.integration.setup.js'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  // Run tests serially to avoid database conflicts
  maxWorkers: 1,
  // Clear module cache to ensure env vars are read fresh
  resetModules: true,
};

module.exports = createJestConfig(customJestConfig);
