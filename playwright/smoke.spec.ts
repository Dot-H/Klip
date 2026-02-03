import { test, expect } from './fixtures';

/**
 * Smoke tests - Critical user journeys
 * These tests verify the most important user flows work end-to-end
 */

test.describe('Critical User Journeys', () => {
  test('home → crag → route → report flow', async ({ homePage }) => {
    // Start at home page - already verified by fixture
    await expect(homePage.getByRole('heading', { name: 'Sites d\'escalade' })).toBeVisible();

    // Click on a crag
    await homePage.getByRole('link', { name: /Buoux/i }).click();
    await expect(homePage).toHaveURL(/\/crag\//);
    await expect(homePage.getByRole('heading', { name: 'Buoux', level: 1 })).toBeVisible();

    // Click on a route
    await homePage.getByRole('link', { name: /Rose des Sables/i }).click();
    await expect(homePage).toHaveURL(/\/route\//);
    await expect(homePage.getByRole('heading', { name: /Rose des Sables/i })).toBeVisible();

    // Click on new report button
    await homePage.getByRole('link', { name: /Nouveau rapport/i }).click();
    await expect(homePage).toHaveURL(/\/report\?pitchId=/);
    await expect(homePage.getByRole('heading', { name: /Nouveau rapport/i })).toBeVisible();
  });

  test('search → navigate to route', async ({ homePage }) => {
    // Search for a route
    const searchInput = homePage.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('Bio');

    // Wait for and click result
    await homePage.getByText('Biographie').first().click();

    // Should navigate to route page
    await expect(homePage).toHaveURL(/\/route\//);
    await expect(homePage.getByRole('heading', { name: /Biographie/i })).toBeVisible();
  });

  test('multi-pitch route displays pitches and reports', async ({ pichenibulePage }) => {
    // Should show pitches section
    await expect(pichenibulePage.getByText(/Longueurs/i)).toBeVisible();
    await expect(pichenibulePage.getByRole('link', { name: /L1.*6b/i })).toBeVisible();
    await expect(pichenibulePage.getByRole('link', { name: /L2.*6c/i })).toBeVisible();
    await expect(pichenibulePage.getByRole('link', { name: /L3.*6a\+/i })).toBeVisible();

    // Should show reports history
    await expect(pichenibulePage.getByRole('heading', { name: /Historique des rapports/i })).toBeVisible();
    await expect(pichenibulePage.getByText('Jean Admin').first()).toBeVisible();
  });

  test('breadcrumb navigation works correctly', async ({ roseDesSablesPage }) => {
    // Verify breadcrumbs exist
    await expect(roseDesSablesPage.getByRole('link', { name: 'Accueil' })).toBeVisible();
    await expect(roseDesSablesPage.getByRole('link', { name: 'Buoux' })).toBeVisible();

    // Use breadcrumb to go back to crag
    await roseDesSablesPage.getByRole('link', { name: 'Buoux' }).click();
    await expect(roseDesSablesPage).toHaveURL(/\/crag\//);
    await expect(roseDesSablesPage.getByRole('heading', { name: 'Buoux', level: 1 })).toBeVisible();

    // Use breadcrumb to go home
    await roseDesSablesPage.getByRole('link', { name: 'Accueil' }).click();
    await expect(roseDesSablesPage).toHaveURL('/');
  });
});

test.describe('Error Handling', () => {
  test('shows 404 for non-existent crag', async ({ page }) => {
    await page.goto('/crag/non-existent-id');
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  });

  test('shows 404 for non-existent route', async ({ page }) => {
    await page.goto('/route/non-existent-id');
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  });
});

test.describe('Report Form UI', () => {
  test('shows login required message when not authenticated', async ({ roseDesSablesReportPage }) => {
    await expect(roseDesSablesReportPage.getByText(/Vous devez vous connecter/i)).toBeVisible();
    await expect(roseDesSablesReportPage.getByRole('button', { name: /Se connecter/i })).toBeVisible();
  });

  test('submit button is disabled without authentication', async ({ roseDesSablesReportPage }) => {
    const submitButton = roseDesSablesReportPage.getByRole('button', { name: /Envoyer le rapport/i });
    await expect(submitButton).toBeDisabled();
  });

  test('checkboxes are interactive', async ({ roseDesSablesReportPage }) => {
    const visualCheck = roseDesSablesReportPage.getByRole('checkbox', { name: /Contrôle visuel/i });
    await visualCheck.check();
    await expect(visualCheck).toBeChecked();

    const anchorCheck = roseDesSablesReportPage.getByRole('checkbox', { name: /Ancrages vérifiés/i });
    await anchorCheck.check();
    await expect(anchorCheck).toBeChecked();
  });

  test('comment field is editable', async ({ roseDesSablesReportPage }) => {
    const commentField = roseDesSablesReportPage.getByLabel(/Commentaire/i);
    await commentField.fill('Test comment');
    await expect(commentField).toHaveValue('Test comment');
  });

  test('clicking login button opens auth modal', async ({ roseDesSablesReportPage }) => {
    await roseDesSablesReportPage.getByRole('button', { name: /Se connecter/i }).click();
    await expect(roseDesSablesReportPage.getByRole('dialog')).toBeVisible();
    await expect(roseDesSablesReportPage.getByText(/Connexion requise/i)).toBeVisible();
  });
});

test.describe('Visual Elements', () => {
  test('role badges display correctly on multi-pitch route', async ({ pichenibulePage }) => {
    // Check Admin badge
    const adminBadge = pichenibulePage.locator('.MuiChip-root', { hasText: /^Admin$/ });
    await expect(adminBadge.first()).toBeVisible();

    // Check Contributeur badge
    const contributeurBadge = pichenibulePage.locator('.MuiChip-root', { hasText: /^Contributeur$/ });
    await expect(contributeurBadge.first()).toBeVisible();
  });

  test('ouvreur badge displays correctly', async ({ tabouAuNordPage }) => {
    const ouvreurBadge = tabouAuNordPage.locator('.MuiChip-root', { hasText: /^Ouvreur$/ });
    await expect(ouvreurBadge).toBeVisible();
  });

  test('convention badges display correctly on home page', async ({ homePage }) => {
    // Buoux has convention signed
    await expect(homePage.getByText('Convention signée').first()).toBeVisible();

    // Verdon has no convention
    await expect(homePage.getByText('Sans convention')).toBeVisible();
  });

  test('missing data shown with question marks', async ({ voieACompleterPage }) => {
    // Should show "?" for missing cotation and length
    const header = voieACompleterPage.locator('h1');
    await expect(header).toContainText('Cotation?');
    await expect(header).toContainText('?m');
  });
});

test.describe('Pitch Editing UI', () => {
  test('edit buttons visible on multi-pitch route', async ({ pichenibulePage }) => {
    // Each pitch should have an edit button
    const editButtons = pichenibulePage.locator('[data-testid="EditIcon"]');
    await expect(editButtons).toHaveCount(3);
  });

  test('edit buttons disabled for unauthenticated users', async ({ pichenibulePage }) => {
    const editButton = pichenibulePage.locator('button').filter({ has: pichenibulePage.locator('[data-testid="EditIcon"]') }).first();
    await expect(editButton).toBeDisabled();
  });

  test('tooltip shows on hover over disabled edit button', async ({ pichenibulePage }) => {
    const editButtonWrapper = pichenibulePage.locator('span').filter({ has: pichenibulePage.locator('[data-testid="EditIcon"]') }).first();
    await editButtonWrapper.hover();

    await expect(pichenibulePage.getByRole('tooltip')).toBeVisible();
    await expect(pichenibulePage.getByRole('tooltip')).toContainText('Seuls les ouvreurs peuvent modifier les longueurs');
  });
});
