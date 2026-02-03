import { test, expect } from './fixtures';

/**
 * E2E tests for search UI interactions.
 *
 * Note: Query validation (too short, empty, case insensitivity) and API response
 * format are tested in integration tests (tests/integration/api/search.test.ts).
 * These E2E tests focus on browser-specific behavior: UI visibility, user input,
 * and navigation flows.
 */
test.describe('Recherche de voies', () => {
  test('la barre de recherche est visible', async ({ homePage }) => {
    await expect(homePage.getByPlaceholder(/Rechercher une voie/i)).toBeVisible();
  });

  test('affiche un message pour les requêtes trop courtes', async ({ homePage }) => {
    const searchInput = homePage.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('R');

    // UI feedback for short query (API behavior tested in integration)
    // Wait for the autocomplete dropdown to show the message
    await expect(homePage.getByText(/Tapez au moins 2 caractères/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('recherche par nom de voie et affiche les résultats', async ({ homePage }) => {
    const searchInput = homePage.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('Rose');

    // Wait for results
    await expect(homePage.getByText('Rose des Sables')).toBeVisible({ timeout: 10000 });

    // Should show context (crag and sector) in UI
    await expect(homePage.getByText(/Buoux.*Styx/i)).toBeVisible();
  });

  test('navigation vers une route depuis les résultats', async ({ homePage }) => {
    const searchInput = homePage.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('Bio');

    // Wait for and click result
    await homePage.getByText('Biographie').first().click();

    // Should navigate to route page
    await expect(homePage.getByRole('heading', { name: /Biographie/i })).toBeVisible();
  });

  test('la recherche fonctionne depuis une page de crag', async ({ buouxCragPage }) => {
    // Search should work from any page
    const searchInput = buouxCragPage.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('Luna');

    // Should find Luna Bong in Verdon
    await expect(buouxCragPage.getByText('Luna Bong')).toBeVisible({ timeout: 5000 });

    // Click and navigate
    await buouxCragPage.getByText('Luna Bong').click();
    await expect(buouxCragPage.getByRole('heading', { name: /Luna Bong/i })).toBeVisible();
  });
});
