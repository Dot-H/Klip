import { test as base, expect, Page } from '@playwright/test';

/**
 * Custom Playwright fixtures for common navigation patterns.
 * Use these to reduce redundant navigation in beforeEach hooks.
 */

type NavigationFixtures = {
  /** Navigate to homepage and return page */
  homePage: Page;
  /** Navigate to Buoux crag page */
  buouxCragPage: Page;
  /** Navigate to Verdon crag page */
  verdonCragPage: Page;
  /** Navigate to Rose des Sables route (simple route in Buoux) */
  roseDesSablesPage: Page;
  /** Navigate to Tabou au Nord route (route with reports in Buoux) */
  tabouAuNordPage: Page;
  /** Navigate to Pichenibule route (multi-pitch in Verdon) */
  pichenibulePage: Page;
  /** Navigate to Rose des Sables report form */
  roseDesSablesReportPage: Page;
  /** Navigate to Pichenibule report form (multi-pitch) */
  pichenibuleReportPage: Page;
};

// Helper to wait for page to be ready after navigation
async function waitForPageReady(page: Page, heading: RegExp | string) {
  await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible({
    timeout: 15000,
  });
}

export const test = base.extend<NavigationFixtures>({
  homePage: async ({ page }, use) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Wait for at least one crag link to be visible
    await expect(page.getByRole('link', { name: /Buoux/i })).toBeVisible({ timeout: 15000 });
    await use(page);
  },

  buouxCragPage: async ({ page }, use) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.waitForURL(/\/crag\//, { timeout: 15000 });
    await waitForPageReady(page, 'Buoux');
    await use(page);
  },

  verdonCragPage: async ({ page }, use) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//, { timeout: 15000 });
    await waitForPageReady(page, 'Verdon');
    await use(page);
  },

  roseDesSablesPage: async ({ page }, use) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.waitForURL(/\/crag\//, { timeout: 15000 });
    await waitForPageReady(page, 'Buoux');
    await page.getByRole('link', { name: /Rose des Sables/i }).click();
    await page.waitForURL(/\/route\//, { timeout: 15000 });
    await waitForPageReady(page, /Rose des Sables/);
    await use(page);
  },

  tabouAuNordPage: async ({ page }, use) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.waitForURL(/\/crag\//, { timeout: 15000 });
    await waitForPageReady(page, 'Buoux');
    await page.getByRole('link', { name: /Tabou au Nord/i }).click();
    await page.waitForURL(/\/route\//, { timeout: 15000 });
    await waitForPageReady(page, /Tabou au Nord/);
    await use(page);
  },

  pichenibulePage: async ({ page }, use) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//, { timeout: 15000 });
    await waitForPageReady(page, 'Verdon');
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//, { timeout: 15000 });
    await waitForPageReady(page, /Pichenibule/);
    await use(page);
  },

  roseDesSablesReportPage: async ({ page }, use) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.waitForURL(/\/crag\//, { timeout: 15000 });
    await page.getByRole('link', { name: /Rose des Sables/i }).click();
    await page.waitForURL(/\/route\//, { timeout: 15000 });
    await page.getByRole('link', { name: /Nouveau rapport/i }).click();
    await page.waitForURL(/\/report\?pitchId=/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Nouveau rapport/i })).toBeVisible({
      timeout: 15000,
    });
    await use(page);
  },

  pichenibuleReportPage: async ({ page }, use) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//, { timeout: 15000 });
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//, { timeout: 15000 });
    await page.getByRole('link', { name: /Nouveau rapport/i }).click();
    await page.waitForURL(/\/report\?pitchId=/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Nouveau rapport/i })).toBeVisible({
      timeout: 15000,
    });
    await use(page);
  },
});

export { expect };
