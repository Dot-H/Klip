import { PlaywrightTestConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

const opts = {
  // launch headless on CI, in browser locally
  headless: isCI || !!process.env.PLAYWRIGHT_HEADLESS,
};

const config: PlaywrightTestConfig = {
  testDir: './playwright',
  // Increase timeout for CI which is slower
  timeout: isCI ? 60e3 : 35e3,
  // Expect timeout for individual assertions
  expect: {
    timeout: isCI ? 15e3 : 5e3,
  },
  outputDir: './playwright/test-results',
  // 'github' for GitHub Actions CI to generate annotations
  // default 'list' when running locally
  reporter: isCI ? 'github' : 'list',
  // Limit workers to prevent overwhelming the server
  // CI has less resources, so use fewer workers
  workers: isCI ? 2 : 3,
  use: {
    ...devices['Desktop Chrome'],
    headless: opts.headless,
    video: 'on',
    // Add action timeout
    actionTimeout: isCI ? 15e3 : 10e3,
    // Add navigation timeout
    navigationTimeout: isCI ? 30e3 : 15e3,
  },
  retries: isCI ? 2 : 0,
  webServer: {
    command: isCI ? 'npm run start' : 'npm run dev',
    reuseExistingServer: Boolean(process.env.TEST_LOCAL === '1'),
    port: 3000,
    // Give the server more time to start on CI
    timeout: isCI ? 120e3 : 60e3,
  },
};

export default config;
