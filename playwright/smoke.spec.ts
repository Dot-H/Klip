import { test, expect } from '@playwright/test';

/**
 * Smoke tests - Critical user journeys
 * These tests verify the most important user flows work end-to-end
 */

test.describe('Critical User Journeys', () => {
  test('home → crag → route → report flow', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Sites d\'escalade' })).toBeVisible();

    // Click on a crag
    await page.getByRole('link', { name: /Buoux/i }).click();
    await expect(page).toHaveURL(/\/crag\//);
    await expect(page.getByRole('heading', { name: 'Buoux', level: 1 })).toBeVisible();

    // Click on a route
    await page.getByRole('link', { name: /Rose des Sables/i }).click();
    await expect(page).toHaveURL(/\/route\//);
    await expect(page.getByRole('heading', { name: /Rose des Sables/i })).toBeVisible();

    // Click on new report button
    await page.getByRole('link', { name: /Nouveau rapport/i }).click();
    await expect(page).toHaveURL(/\/report\?pitchId=/);
    await expect(page.getByRole('heading', { name: /Nouveau rapport/i })).toBeVisible();
  });

  test('search → navigate to route', async ({ page }) => {
    await page.goto('/');

    // Search for a route
    const searchInput = page.getByPlaceholder(/Rechercher une voie/i);
    await searchInput.click();
    await searchInput.fill('Bio');

    // Wait for and click result
    await page.getByText('Biographie').first().click();

    // Should navigate to route page
    await expect(page).toHaveURL(/\/route\//);
    await expect(page.getByRole('heading', { name: /Biographie/i })).toBeVisible();
  });

  test('multi-pitch route displays pitches and reports', async ({ page }) => {
    // Navigate to Pichenibule (multi-pitch route)
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//);

    // Should show pitches section
    await expect(page.getByText(/Longueurs/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /L1.*6b/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /L2.*6c/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /L3.*6a\+/i })).toBeVisible();

    // Should show reports history
    await expect(page.getByRole('heading', { name: /Historique des rapports/i })).toBeVisible();
    await expect(page.getByText('Jean Admin').first()).toBeVisible();
  });

  test('breadcrumb navigation works correctly', async ({ page }) => {
    // Navigate deep into the app
    await page.goto('/');
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Rose des Sables/i }).click();
    await page.waitForURL(/\/route\//);

    // Verify breadcrumbs exist
    await expect(page.getByRole('link', { name: 'Accueil' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Buoux' })).toBeVisible();

    // Use breadcrumb to go back to crag
    await page.getByRole('link', { name: 'Buoux' }).click();
    await expect(page).toHaveURL(/\/crag\//);
    await expect(page.getByRole('heading', { name: 'Buoux', level: 1 })).toBeVisible();

    // Use breadcrumb to go home
    await page.getByRole('link', { name: 'Accueil' }).click();
    await expect(page).toHaveURL('/');
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
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Rose des Sables/i }).click();
    await expect(page.getByRole('heading', { name: /Rose des Sables/i })).toBeVisible();
    await page.getByRole('link', { name: /Nouveau rapport/i }).click();
    await expect(page.getByRole('heading', { name: /Nouveau rapport/i })).toBeVisible();
  });

  test('shows login required message when not authenticated', async ({ page }) => {
    await expect(page.getByText(/Vous devez vous connecter/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();
  });

  test('submit button is disabled without authentication', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /Envoyer le rapport/i });
    await expect(submitButton).toBeDisabled();
  });

  test('checkboxes are interactive', async ({ page }) => {
    const visualCheck = page.getByRole('checkbox', { name: /Contrôle visuel/i });
    await visualCheck.check();
    await expect(visualCheck).toBeChecked();

    const anchorCheck = page.getByRole('checkbox', { name: /Ancrages vérifiés/i });
    await anchorCheck.check();
    await expect(anchorCheck).toBeChecked();
  });

  test('comment field is editable', async ({ page }) => {
    const commentField = page.getByLabel(/Commentaire/i);
    await commentField.fill('Test comment');
    await expect(commentField).toHaveValue('Test comment');
  });

  test('clicking login button opens auth modal', async ({ page }) => {
    await page.getByRole('button', { name: /Se connecter/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Connexion requise/i)).toBeVisible();
  });
});

test.describe('Visual Elements', () => {
  test('role badges display correctly', async ({ page }) => {
    // Navigate to a route with reports showing different roles
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//);

    // Check Admin badge
    const adminBadge = page.locator('.MuiChip-root', { hasText: /^Admin$/ });
    await expect(adminBadge.first()).toBeVisible();

    // Check Contributeur badge
    const contributeurBadge = page.locator('.MuiChip-root', { hasText: /^Contributeur$/ });
    await expect(contributeurBadge.first()).toBeVisible();

    // Navigate to see Ouvreur badge
    await page.goto('/');
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Tabou au Nord/i }).click();
    await page.waitForURL(/\/route\//);

    const ouvreurBadge = page.locator('.MuiChip-root', { hasText: /^Ouvreur$/ });
    await expect(ouvreurBadge).toBeVisible();
  });

  test('convention badges display correctly on home page', async ({ page }) => {
    await page.goto('/');

    // Buoux has convention signed
    await expect(page.getByText('Convention signée').first()).toBeVisible();

    // Verdon has no convention
    await expect(page.getByText('Sans convention')).toBeVisible();
  });

  test('missing data shown with question marks', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Voie à compléter/i }).click();
    await page.waitForURL(/\/route\//);

    // Should show "?" for missing cotation and length
    const header = page.locator('h1');
    await expect(header).toContainText('Cotation?');
    await expect(header).toContainText('?m');
  });
});

test.describe('Pitch Editing UI', () => {
  test('edit buttons visible on multi-pitch route', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//);

    // Each pitch should have an edit button
    const editButtons = page.locator('[data-testid="EditIcon"]');
    await expect(editButtons).toHaveCount(3);
  });

  test('edit buttons disabled for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//);

    const editButton = page.locator('button').filter({ has: page.locator('[data-testid="EditIcon"]') }).first();
    await expect(editButton).toBeDisabled();
  });

  test('tooltip shows on hover over disabled edit button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//);

    const editButtonWrapper = page.locator('span').filter({ has: page.locator('[data-testid="EditIcon"]') }).first();
    await editButtonWrapper.hover();

    await expect(page.getByRole('tooltip')).toBeVisible();
    await expect(page.getByRole('tooltip')).toContainText('Seuls les ouvreurs peuvent modifier les longueurs');
  });
});
