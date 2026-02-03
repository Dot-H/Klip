import { test, expect } from './fixtures';

test.describe('Édition des pitches - Affichage du bouton', () => {
  test('affiche un bouton d\'édition à côté de chaque longueur', async ({ pichenibulePage }) => {
    // Section Longueurs should be visible
    await expect(pichenibulePage.getByText(/Longueurs/i)).toBeVisible();

    // Each pitch should have an edit button
    const editButtons = pichenibulePage.locator('[data-testid="EditIcon"]');
    // Pichenibule has 3 pitches
    await expect(editButtons).toHaveCount(3);
  });

  test('le bouton d\'édition est désactivé pour un utilisateur non connecté', async ({ pichenibulePage }) => {
    // Get the first edit button
    const editButton = pichenibulePage.locator('button').filter({ has: pichenibulePage.locator('[data-testid="EditIcon"]') }).first();
    await expect(editButton).toBeDisabled();
  });

  test('le tooltip s\'affiche au survol du bouton désactivé', async ({ pichenibulePage }) => {
    // Hover over the first edit button wrapper (span containing disabled button)
    const editButtonWrapper = pichenibulePage.locator('span').filter({ has: pichenibulePage.locator('[data-testid="EditIcon"]') }).first();
    await editButtonWrapper.hover();

    // Wait for tooltip to appear
    await expect(pichenibulePage.getByRole('tooltip')).toBeVisible();
    await expect(pichenibulePage.getByRole('tooltip')).toContainText('Seuls les ouvreurs peuvent modifier les longueurs');
  });
});

test.describe('Édition des pitches - Route simple (une seule longueur)', () => {
  test('n\'affiche pas de section Longueurs pour une route simple', async ({ roseDesSablesPage }) => {
    // Section Longueurs should NOT be visible for single pitch routes
    await expect(roseDesSablesPage.getByText(/^Longueurs$/)).not.toBeVisible();
  });

  test('affiche un bouton d\'édition à côté du titre', async ({ roseDesSablesPage }) => {
    // Single pitch routes should have an edit button in the header
    const editButton = roseDesSablesPage.locator('[data-testid="EditIcon"]');
    await expect(editButton).toHaveCount(1);
  });

  test('le bouton d\'édition est désactivé pour un utilisateur non connecté', async ({ roseDesSablesPage }) => {
    const editButton = roseDesSablesPage.locator('button').filter({ has: roseDesSablesPage.locator('[data-testid="EditIcon"]') });
    await expect(editButton).toBeDisabled();
  });
});

test.describe('Édition des pitches - Données manquantes', () => {
  test('affiche les voies avec données manquantes en orange', async ({ verdonCragPage }) => {
    // "Voie à compléter" should show warning color (missing cotation and length)
    const voieSansInfo = verdonCragPage.getByRole('link', { name: /Voie à compléter/i }).first();
    await expect(voieSansInfo).toBeVisible();
  });

  test('route simple sans données affiche "?" pour cotation et longueur', async ({ voieACompleterPage }) => {
    // Should show "Cotation?" for missing cotation and "?m" for missing length in the header
    const header = voieACompleterPage.locator('h1');
    await expect(header).toContainText('Cotation?');
    await expect(header).toContainText('?m');
  });

  test('route multi-longueurs avec données partielles affiche "?" pour les valeurs manquantes', async ({ donneesPartiellesPage }) => {
    // Should have 3 pitches, some with missing data
    await expect(donneesPartiellesPage.getByText(/Longueurs/i)).toBeVisible();

    // L1 has cotation but no length: "L1 (6a, ?m)"
    await expect(donneesPartiellesPage.getByRole('link', { name: /L1.*6a.*\?m/i })).toBeVisible();

    // L2 has length but no cotation: "L2 (?, 25m)"
    await expect(donneesPartiellesPage.getByRole('link', { name: /L2.*\?.*25m/i })).toBeVisible();

    // L3 has neither: "L3 (?, ?m)"
    await expect(donneesPartiellesPage.getByRole('link', { name: /L3.*\?.*\?m/i })).toBeVisible();
  });
});

// API tests moved to tests/integration/api/pitches.test.ts
