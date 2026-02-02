import { test, expect } from '@playwright/test';

test.describe('Affichage des rôles utilisateur dans les rapports', () => {
  test('affiche le badge "Admin" pour un utilisateur admin', async ({ page }) => {
    // Navigate to Pichenibule which has reports from Jean Admin (ADMIN role)
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.getByRole('link', { name: /Pichenibule/i }).click();

    // Find the first report card for Jean Admin (he has multiple reports)
    const reportCard = page.locator('.MuiCard-root', { hasText: 'Jean Admin' }).first();
    await expect(reportCard).toBeVisible();

    // Check the Admin badge is displayed
    const adminBadge = reportCard.locator('.MuiChip-root', { hasText: /^Admin$/ });
    await expect(adminBadge).toBeVisible();

    // Admin badge should have secondary color (purple/pink)
    await expect(adminBadge).toHaveClass(/MuiChip-colorSecondary/);
  });

  test('affiche le badge "Ouvreur" pour un route setter', async ({ page }) => {
    // Navigate to Tabou au Nord which has a report from Pierre Ouvreur (ROUTE_SETTER role)
    await page.goto('/');
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.getByRole('link', { name: /Tabou au Nord/i }).click();

    // Find the report card for Pierre Ouvreur
    const reportCard = page.locator('.MuiCard-root', { hasText: 'Pierre Ouvreur' });
    await expect(reportCard).toBeVisible();

    // Check the Ouvreur badge is displayed
    const ouvreurBadge = reportCard.locator('.MuiChip-root', { hasText: 'Ouvreur' });
    await expect(ouvreurBadge).toBeVisible();

    // Route setter badge should have primary color (blue)
    await expect(ouvreurBadge).toHaveClass(/MuiChip-colorPrimary/);
  });

  test('affiche le badge "Contributeur" pour un contributeur', async ({ page }) => {
    // Navigate to Pichenibule which has reports from Marie Grimpeuse (CONTRIBUTOR role)
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.getByRole('link', { name: /Pichenibule/i }).click();

    // Find the report card for Marie Grimpeuse
    const reportCard = page.locator('.MuiCard-root', { hasText: 'Marie Grimpeuse' });
    await expect(reportCard).toBeVisible();

    // Check the Contributeur badge is displayed
    const contributeurBadge = reportCard.locator('.MuiChip-root', { hasText: 'Contributeur' });
    await expect(contributeurBadge).toBeVisible();

    // Contributor badge should have default color (grey)
    await expect(contributeurBadge).toHaveClass(/MuiChip-colorDefault/);
  });

  test('chaque rapport affiche un badge de rôle', async ({ page }) => {
    // Navigate to Pichenibule which has multiple reports
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.getByRole('link', { name: /Pichenibule/i }).click();

    // Get all report cards
    const reportCards = page.locator('.MuiCard-root').filter({
      has: page.locator('.MuiChip-root', { hasText: /Admin|Ouvreur|Contributeur/ }),
    });

    // Should have at least 2 reports with role badges
    await expect(reportCards).toHaveCount(3);
  });
});

test.describe('API /api/user/me', () => {
  test('retourne 401 si non authentifié', async ({ request }) => {
    const response = await request.get('/api/user/me');
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('Authentification requise');
  });
});

test.describe('Labels de rôles', () => {
  test('les trois rôles ont des labels français corrects', async ({ page }) => {
    // Navigate to a page with reports showing all role types
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.getByRole('link', { name: /Pichenibule/i }).click();

    // Verify French labels are used (not English enum values)
    // Use role chip locator to be specific
    const adminChip = page.locator('.MuiChip-root', { hasText: /^Admin$/ });
    await expect(adminChip.first()).toBeVisible();

    const contributeurChip = page.locator('.MuiChip-root', { hasText: /^Contributeur$/ });
    await expect(contributeurChip.first()).toBeVisible();

    // Navigate to see Ouvreur
    await page.goto('/');
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.getByRole('link', { name: /Tabou au Nord/i }).click();

    const ouvreurChip = page.locator('.MuiChip-root', { hasText: /^Ouvreur$/ });
    await expect(ouvreurChip).toBeVisible();

    // Make sure we don't show raw enum values
    await expect(page.locator('.MuiChip-root', { hasText: 'ADMIN' })).not.toBeVisible();
    await expect(page.locator('.MuiChip-root', { hasText: 'ROUTE_SETTER' })).not.toBeVisible();
    await expect(page.locator('.MuiChip-root', { hasText: 'CONTRIBUTOR' })).not.toBeVisible();
  });
});
