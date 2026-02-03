import { test, expect } from '@playwright/test';

test.describe('Page de détail d\'une route simple', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Rose des Sables route from home
    await page.goto('/');
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Rose des Sables/i }).click();
    await page.waitForURL(/\/route\//);
  });

  test('affiche le nom de la route', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Rose des Sables/i })).toBeVisible();
  });

  test('affiche la cotation et la longueur', async ({ page }) => {
    // Check cotation
    await expect(page.getByText('7a')).toBeVisible();
    // Check length
    await expect(page.getByText('25m')).toBeVisible();
  });

  test('affiche les breadcrumbs', async ({ page }) => {
    // Check breadcrumb links
    await expect(page.getByRole('link', { name: 'Accueil' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Buoux' })).toBeVisible();
    await expect(page.getByText('Styx', { exact: true })).toBeVisible();
  });

  test('affiche le bouton nouveau rapport', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Nouveau rapport/i })).toBeVisible();
  });

  test('affiche le message "aucun rapport"', async ({ page }) => {
    // Rose des Sables has no reports
    await expect(page.getByText(/Aucun rapport pour cette voie/i)).toBeVisible();
  });

  test('breadcrumb navigue vers le crag', async ({ page }) => {
    await page.getByRole('link', { name: 'Buoux' }).click();
    await expect(page).toHaveURL(/\/crag\//);
    await expect(page.getByRole('heading', { name: 'Buoux', level: 1 })).toBeVisible();
  });
});

test.describe('Page de détail d\'une route avec rapports', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Tabou au Nord route (has a report)
    await page.goto('/');
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Tabou au Nord/i }).click();
    await page.waitForURL(/\/route\//);
  });

  test('affiche l\'historique des rapports', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Historique des rapports/i })).toBeVisible();

    // Check reporter name
    await expect(page.getByText('Pierre Ouvreur')).toBeVisible();

    // Check role badge (use chip locator to be specific)
    await expect(page.locator('.MuiChip-root', { hasText: /^Ouvreur$/ })).toBeVisible();

    // Check comment
    await expect(page.getByText(/Relais en bon état/i)).toBeVisible();
  });

  test('affiche les actions effectuées dans le rapport', async ({ page }) => {
    // Check completed checks are shown as chips
    await expect(page.getByText('Contrôle visuel')).toBeVisible();
    await expect(page.getByText('Ancrages vérifiés')).toBeVisible();
  });
});

test.describe('Page de détail d\'une route multi-longueurs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Pichenibule (multi-pitch route in Verdon)
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//);
  });

  test('affiche la cotation maximale', async ({ page }) => {
    // Max cotation is 6c - check in the header section
    await expect(page.locator('h1').getByText('6c')).toBeVisible();
  });

  test('affiche la section longueurs', async ({ page }) => {
    await expect(page.getByText(/Longueurs/i)).toBeVisible();

    // Check individual pitches are listed
    await expect(page.getByRole('link', { name: /L1.*6b/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /L2.*6c/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /L3.*6a\+/i })).toBeVisible();
  });

  test('affiche les rapports avec le numéro de longueur', async ({ page }) => {
    // Reports should show pitch number
    await expect(page.getByText('L1').first()).toBeVisible();
    await expect(page.getByText('L2').first()).toBeVisible();
    await expect(page.getByText('L3').first()).toBeVisible();
  });

  test('affiche plusieurs rapports de différents utilisateurs', async ({ page }) => {
    // Jean Admin and Marie Grimpeuse have reports
    await expect(page.getByText('Jean Admin').first()).toBeVisible();
    await expect(page.getByText('Marie Grimpeuse')).toBeVisible();
  });

  test('affiche les rôles des rapporteurs', async ({ page }) => {
    // Use chip locator to find role badges specifically
    await expect(page.locator('.MuiChip-root', { hasText: /^Admin$/ }).first()).toBeVisible();
    await expect(page.locator('.MuiChip-root', { hasText: /^Contributeur$/ }).first()).toBeVisible();
  });

  test('clic sur une longueur navigue vers le formulaire de rapport', async ({ page }) => {
    await page.getByRole('link', { name: /L2.*6c/i }).click();
    await expect(page).toHaveURL(/\/report\?pitchId=/);
  });
});

test.describe('Page route inexistante', () => {
  test('affiche une page 404', async ({ page }) => {
    await page.goto('/route/non-existent-id');
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  });
});
