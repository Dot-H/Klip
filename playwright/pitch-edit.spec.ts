import { test, expect } from '@playwright/test';

test.describe('Édition des pitches - Affichage du bouton', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Pichenibule (multi-pitch route)
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//);
  });

  test('affiche un bouton d\'édition à côté de chaque longueur', async ({ page }) => {
    // Section Longueurs should be visible
    await expect(page.getByText(/Longueurs/i)).toBeVisible();

    // Each pitch should have an edit button
    const editButtons = page.locator('[data-testid="EditIcon"]');
    // Pichenibule has 3 pitches
    await expect(editButtons).toHaveCount(3);
  });

  test('le bouton d\'édition est désactivé pour un utilisateur non connecté', async ({ page }) => {
    // Get the first edit button
    const editButton = page.locator('button').filter({ has: page.locator('[data-testid="EditIcon"]') }).first();
    await expect(editButton).toBeDisabled();
  });

  test('le tooltip s\'affiche au survol du bouton désactivé', async ({ page }) => {
    // Hover over the first edit button wrapper (span containing disabled button)
    const editButtonWrapper = page.locator('span').filter({ has: page.locator('[data-testid="EditIcon"]') }).first();
    await editButtonWrapper.hover();

    // Wait for tooltip to appear
    await expect(page.getByRole('tooltip')).toBeVisible();
    await expect(page.getByRole('tooltip')).toContainText('Seuls les ouvreurs peuvent modifier les longueurs');
  });
});

test.describe('Édition des pitches - Route simple (une seule longueur)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Rose des Sables (single pitch route)
    await page.goto('/');
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Rose des Sables/i }).click();
    await page.waitForURL(/\/route\//);
  });

  test('n\'affiche pas de section Longueurs pour une route simple', async ({ page }) => {
    // Section Longueurs should NOT be visible for single pitch routes
    await expect(page.getByText(/^Longueurs$/)).not.toBeVisible();
  });

  test('affiche un bouton d\'édition à côté du titre', async ({ page }) => {
    // Single pitch routes should have an edit button in the header
    const editButton = page.locator('[data-testid="EditIcon"]');
    await expect(editButton).toHaveCount(1);
  });

  test('le bouton d\'édition est désactivé pour un utilisateur non connecté', async ({ page }) => {
    const editButton = page.locator('button').filter({ has: page.locator('[data-testid="EditIcon"]') });
    await expect(editButton).toBeDisabled();
  });
});

test.describe('Édition des pitches - Données manquantes', () => {
  test('affiche les voies avec données manquantes en orange', async ({ page }) => {
    // Navigate to Verdon which has routes with missing data
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);

    // "Voie à compléter" should show warning color (missing cotation and length)
    const voieSansInfo = page.getByRole('link', { name: /Voie à compléter/i }).first();
    await expect(voieSansInfo).toBeVisible();
  });

  test('route simple sans données affiche "?" pour cotation et longueur', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Voie à compléter/i }).click();
    await page.waitForURL(/\/route\//);

    // Should show "Cotation?" for missing cotation and "?m" for missing length in the header
    const header = page.locator('h1');
    await expect(header).toContainText('Cotation?');
    await expect(header).toContainText('?m');
  });

  test('route multi-longueurs avec données partielles affiche "?" pour les valeurs manquantes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Données partielles/i }).click();
    await page.waitForURL(/\/route\//);

    // Should have 3 pitches, some with missing data
    await expect(page.getByText(/Longueurs/i)).toBeVisible();

    // L1 has cotation but no length: "L1 (6a, ?m)"
    await expect(page.getByRole('link', { name: /L1.*6a.*\?m/i })).toBeVisible();

    // L2 has length but no cotation: "L2 (?, 25m)"
    await expect(page.getByRole('link', { name: /L2.*\?.*25m/i })).toBeVisible();

    // L3 has neither: "L3 (?, ?m)"
    await expect(page.getByRole('link', { name: /L3.*\?.*\?m/i })).toBeVisible();
  });
});

// API tests moved to tests/integration/api/pitches.test.ts
