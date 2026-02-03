import { test, expect } from './fixtures';

test.describe('Affichage des rôles utilisateur dans les rapports', () => {
  test('affiche le badge "Admin" pour un utilisateur admin', async ({ pichenibulePage }) => {
    // Find the first report card for Jean Admin (he has multiple reports)
    const reportCard = pichenibulePage.locator('.MuiCard-root', { hasText: 'Jean Admin' }).first();
    await expect(reportCard).toBeVisible();

    // Check the Admin badge is displayed
    const adminBadge = reportCard.locator('.MuiChip-root', { hasText: /^Admin$/ });
    await expect(adminBadge).toBeVisible();

    // Admin badge should have secondary color (purple/pink)
    await expect(adminBadge).toHaveClass(/MuiChip-colorSecondary/);
  });

  test('affiche le badge "Ouvreur" pour un route setter', async ({ tabouAuNordPage }) => {
    // Find the report card for Pierre Ouvreur
    const reportCard = tabouAuNordPage.locator('.MuiCard-root', { hasText: 'Pierre Ouvreur' });
    await expect(reportCard).toBeVisible();

    // Check the Ouvreur badge is displayed
    const ouvreurBadge = reportCard.locator('.MuiChip-root', { hasText: 'Ouvreur' });
    await expect(ouvreurBadge).toBeVisible();

    // Route setter badge should have primary color (blue)
    await expect(ouvreurBadge).toHaveClass(/MuiChip-colorPrimary/);
  });

  test('affiche le badge "Contributeur" pour un contributeur', async ({ pichenibulePage }) => {
    // Find the report card for Marie Grimpeuse
    const reportCard = pichenibulePage.locator('.MuiCard-root', { hasText: 'Marie Grimpeuse' });
    await expect(reportCard).toBeVisible();

    // Check the Contributeur badge is displayed
    const contributeurBadge = reportCard.locator('.MuiChip-root', { hasText: 'Contributeur' });
    await expect(contributeurBadge).toBeVisible();

    // Contributor badge should have default color (grey)
    await expect(contributeurBadge).toHaveClass(/MuiChip-colorDefault/);
  });

  test('chaque rapport affiche un badge de rôle', async ({ pichenibulePage }) => {
    // Get all report cards
    const reportCards = pichenibulePage.locator('.MuiCard-root').filter({
      has: pichenibulePage.locator('.MuiChip-root', { hasText: /Admin|Ouvreur|Contributeur/ }),
    });

    // Should have at least 2 reports with role badges
    await expect(reportCards).toHaveCount(3);
  });
});

// API tests moved to tests/integration/api/user-me.test.ts

test.describe('Labels de rôles', () => {
  test('affiche les labels français Admin et Contributeur', async ({ pichenibulePage }) => {
    // Verify French labels are used - use exact match with regex boundaries
    const adminChip = pichenibulePage.locator('.MuiChip-root', { hasText: /^Admin$/ });
    await expect(adminChip.first()).toBeVisible();

    const contributeurChip = pichenibulePage.locator('.MuiChip-root', { hasText: /^Contributeur$/ });
    await expect(contributeurChip.first()).toBeVisible();
  });

  test('affiche le label français Ouvreur', async ({ tabouAuNordPage }) => {
    const ouvreurChip = tabouAuNordPage.locator('.MuiChip-root', { hasText: /^Ouvreur$/ });
    await expect(ouvreurChip).toBeVisible();
  });
});
