import { test, expect } from './fixtures';

test.describe('Ajout de voies - Affichage du bouton', () => {
  test('affiche un bouton d\'ajout dans l\'en-tete de chaque secteur', async ({ buouxCragPage }) => {
    // Each sector header should have an add button (Buoux has 2 sectors)
    const addButtons = buouxCragPage.locator('[data-testid="AddIcon"]');
    await expect(addButtons).toHaveCount(2);
  });

  test('le bouton d\'ajout est desactive pour un utilisateur non connecte', async ({ buouxCragPage }) => {
    // Get the first add button
    const addButton = buouxCragPage.locator('button').filter({ has: buouxCragPage.locator('[data-testid="AddIcon"]') }).first();
    await expect(addButton).toBeDisabled();
  });

  test('le tooltip s\'affiche au survol du bouton desactive', async ({ buouxCragPage }) => {
    // Hover over the first add button wrapper (span containing disabled button)
    const addButtonWrapper = buouxCragPage.locator('span').filter({ has: buouxCragPage.locator('[data-testid="AddIcon"]') }).first();
    await addButtonWrapper.hover();

    // Wait for tooltip to appear
    await expect(buouxCragPage.getByRole('tooltip')).toBeVisible();
    await expect(buouxCragPage.getByRole('tooltip')).toContainText('Seuls les ouvreurs peuvent ajouter des voies');
  });
});
