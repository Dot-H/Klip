import { test, expect } from '@playwright/test';

test.describe('Page d\'accueil', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('affiche le titre principal', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sites d\'escalade' })).toBeVisible();
  });

  test('affiche la liste des crags', async ({ page }) => {
    // Wait for content to load
    await expect(page.getByText('Buoux')).toBeVisible();
    await expect(page.getByText('Céüse')).toBeVisible();
    await expect(page.getByText('Verdon')).toBeVisible();
  });

  test('affiche les statistiques des crags', async ({ page }) => {
    // Check that stats are displayed (sectors and routes count)
    await expect(page.getByText(/secteur/).first()).toBeVisible();
    await expect(page.getByText(/voie/).first()).toBeVisible();
  });

  test('navigation vers un crag', async ({ page }) => {
    // Click on Buoux crag
    await page.getByRole('link', { name: /Buoux/i }).click();

    // Should navigate to crag detail page
    await expect(page).toHaveURL(/\/crag\//);
    await expect(page.getByRole('heading', { name: 'Buoux' })).toBeVisible();
  });

  test('affiche le badge de convention', async ({ page }) => {
    // Buoux has convention signed
    await expect(page.getByText('Convention signée').first()).toBeVisible();

    // Verdon has no convention
    await expect(page.getByText('Sans convention')).toBeVisible();
  });
});

test.describe('Navigation globale', () => {
  test('le logo ramène à l\'accueil', async ({ page }) => {
    // Start on a crag page
    await page.goto('/');
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.waitForURL(/\/crag\//);

    // Click logo/home link
    await page.getByRole('link', { name: 'KLIP' }).click();

    // Should be back on home page
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Sites d\'escalade' })).toBeVisible();
  });
});
