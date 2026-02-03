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
  /** Navigate to Voie à compléter (route with missing data in Verdon) */
  voieACompleterPage: Page;
  /** Navigate to Données partielles (multi-pitch with partial data in Verdon) */
  donneesPartiellesPage: Page;
  /** Navigate to Rose des Sables report form */
  roseDesSablesReportPage: Page;
  /** Navigate to Pichenibule report form (multi-pitch) */
  pichenibuleReportPage: Page;
};

// Helper to wait for page to be ready after navigation
async function waitForPageReady(page: Page, heading: RegExp | string) {
  await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible({
    timeout: 30000,
  });
}

// Helper to navigate to a crag from homepage
async function navigateToCrag(page: Page, cragName: string) {
  await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
  await expect(page.getByRole('link', { name: new RegExp(cragName, 'i') })).toBeVisible({
    timeout: 30000,
  });
  await page.getByRole('link', { name: new RegExp(cragName, 'i') }).click();
  await page.waitForURL(/\/crag\//, { timeout: 30000 });
  await waitForPageReady(page, cragName);
}

// Helper to navigate to a route from a crag
async function navigateToRoute(page: Page, routeName: RegExp) {
  await page.getByRole('link', { name: routeName }).click();
  await page.waitForURL(/\/route\//, { timeout: 30000 });
  await waitForPageReady(page, routeName);
}

export const test = base.extend<NavigationFixtures>({
  homePage: async ({ page }, use) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await expect(page.getByRole('link', { name: /Buoux/i })).toBeVisible({ timeout: 30000 });
    await use(page);
  },

  buouxCragPage: async ({ page }, use) => {
    await navigateToCrag(page, 'Buoux');
    await use(page);
  },

  verdonCragPage: async ({ page }, use) => {
    await navigateToCrag(page, 'Verdon');
    await use(page);
  },

  roseDesSablesPage: async ({ page }, use) => {
    await navigateToCrag(page, 'Buoux');
    await navigateToRoute(page, /Rose des Sables/i);
    await use(page);
  },

  tabouAuNordPage: async ({ page }, use) => {
    await navigateToCrag(page, 'Buoux');
    await navigateToRoute(page, /Tabou au Nord/i);
    await use(page);
  },

  pichenibulePage: async ({ page }, use) => {
    await navigateToCrag(page, 'Verdon');
    await navigateToRoute(page, /Pichenibule/i);
    await use(page);
  },

  voieACompleterPage: async ({ page }, use) => {
    await navigateToCrag(page, 'Verdon');
    await navigateToRoute(page, /Voie à compléter/i);
    await use(page);
  },

  donneesPartiellesPage: async ({ page }, use) => {
    await navigateToCrag(page, 'Verdon');
    await navigateToRoute(page, /Données partielles/i);
    await use(page);
  },

  roseDesSablesReportPage: async ({ page }, use) => {
    await navigateToCrag(page, 'Buoux');
    await page.getByRole('link', { name: /Rose des Sables/i }).click();
    await page.waitForURL(/\/route\//, { timeout: 30000 });
    await page.getByRole('link', { name: /Nouveau rapport/i }).click();
    await page.waitForURL(/\/report\?pitchId=/, { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /Nouveau rapport/i })).toBeVisible({
      timeout: 30000,
    });
    await use(page);
  },

  pichenibuleReportPage: async ({ page }, use) => {
    await navigateToCrag(page, 'Verdon');
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//, { timeout: 30000 });
    await page.getByRole('link', { name: /Nouveau rapport/i }).click();
    await page.waitForURL(/\/report\?pitchId=/, { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /Nouveau rapport/i })).toBeVisible({
      timeout: 30000,
    });
    await use(page);
  },
});

export { expect };
