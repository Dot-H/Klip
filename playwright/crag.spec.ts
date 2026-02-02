import { test, expect } from '@playwright/test';

test.describe('Page de détail d\'un crag', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Buoux crag from home page
    await page.goto('/');
    await page.getByRole('link', { name: /Buoux/i }).click();
    await expect(page.getByRole('heading', { name: 'Buoux' })).toBeVisible();
  });

  test('affiche le nom du crag et ses informations', async ({ page }) => {
    // Check heading
    await expect(page.getByRole('heading', { name: 'Buoux', level: 1 })).toBeVisible();

    // Check convention badge
    await expect(page.getByText('Convention signée')).toBeVisible();

    // Check sector and route count
    await expect(page.getByText(/2 secteurs/)).toBeVisible();
    await expect(page.getByText(/3 voies/)).toBeVisible();
  });

  test('affiche les secteurs', async ({ page }) => {
    // Check sector names are visible
    await expect(page.getByRole('heading', { name: 'Styx' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bout du Monde' })).toBeVisible();
  });

  test('affiche les routes dans chaque secteur', async ({ page }) => {
    // Check routes in Styx sector
    await expect(page.getByText('Rose des Sables')).toBeVisible();
    await expect(page.getByText('Tabou au Nord')).toBeVisible();

    // Check route without name shows "Voie X"
    await expect(page.getByText('Voie 1')).toBeVisible();
  });

  test('affiche la cotation et longueur des routes', async ({ page }) => {
    // Check cotation is displayed
    await expect(page.getByText('7a')).toBeVisible();
    await expect(page.getByText('7b+')).toBeVisible();

    // Check length is displayed
    await expect(page.getByText('25m')).toBeVisible();
    await expect(page.getByText('30m')).toBeVisible();
  });

  test('navigation vers une route', async ({ page }) => {
    // Click on a route
    await page.getByRole('link', { name: /Rose des Sables/i }).click();

    // Should navigate to route detail page
    await expect(page).toHaveURL(/\/route\//);
    await expect(page.getByRole('heading', { name: /Rose des Sables/i })).toBeVisible();
  });

  test('breadcrumbs affiche le lien Accueil', async ({ page }) => {
    // Check breadcrumbs has home link
    await expect(page.getByRole('link', { name: 'Accueil' })).toBeVisible();
  });
});

test.describe('Crag sans convention', () => {
  test('affiche le badge "Sans convention"', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();

    await expect(page.getByRole('heading', { name: 'Verdon' })).toBeVisible();
    await expect(page.getByText('Sans convention')).toBeVisible();
  });
});

test.describe('Page crag inexistant', () => {
  test('affiche une page 404', async ({ page }) => {
    await page.goto('/crag/non-existent-id');

    // Should show 404 page
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  });
});
