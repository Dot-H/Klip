import { test, expect } from '@playwright/test';

test.describe('Recherche de voies', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('la barre de recherche est visible', async ({ page }) => {
    await expect(page.getByPlaceholder(/Rechercher une voie/i)).toBeVisible();
  });

  test('affiche un message pour les requêtes trop courtes', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('R');

    // Should show message for short query
    await expect(page.getByText(/Tapez au moins 2 caractères/i)).toBeVisible();
  });

  test('recherche par nom de voie', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('Rose');

    // Wait for results
    await expect(page.getByText('Rose des Sables')).toBeVisible({ timeout: 5000 });

    // Should show context (crag and sector)
    await expect(page.getByText(/Buoux.*Styx/i)).toBeVisible();
  });

  test('recherche par nom de secteur', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('Styx');

    // Should find routes in Styx sector
    await expect(page.getByText('Rose des Sables').first().or(page.getByText('Tabou au Nord').first())).toBeVisible({
      timeout: 5000,
    });
  });

  test('recherche par nom de site', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('Verdon');

    // Should find routes in Verdon
    await expect(page.getByText('Pichenibule').first()).toBeVisible({ timeout: 5000 });
  });

  test('navigation vers une route depuis les résultats', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('Bio');

    // Wait for and click result
    await page.getByText('Biographie').first().click();

    // Should navigate to route page
    await expect(page).toHaveURL(/\/route\//);
    await expect(page.getByRole('heading', { name: /Biographie/i })).toBeVisible();
  });

  test('affiche "aucun résultat" pour une recherche sans correspondance', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('xyz123nonexistent');

    // Should show no results message
    await expect(page.getByText(/Aucun résultat/i)).toBeVisible({ timeout: 5000 });
  });

  test('la recherche fonctionne depuis une page de crag', async ({ page }) => {
    // Navigate to a crag first
    await page.getByRole('link', { name: /Buoux/i }).click();
    await expect(page.getByRole('heading', { name: 'Buoux' })).toBeVisible();

    // Search should still work
    const searchInput = page.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('Luna');

    // Should find Luna Bong in Verdon
    await expect(page.getByText('Luna Bong')).toBeVisible({ timeout: 5000 });

    // Click and navigate
    await page.getByText('Luna Bong').click();
    await expect(page).toHaveURL(/\/route\//);
  });

  test('la recherche est insensible à la casse', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('ROSE');

    // Should find Rose des Sables (lowercase match)
    await expect(page.getByText('Rose des Sables')).toBeVisible({ timeout: 5000 });
  });
});
