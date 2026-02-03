import { test, expect } from './fixtures';

test.describe('Ajout de secteurs - Affichage du bouton', () => {
  test('affiche un bouton d\'ajout de secteur sur la page du site', async ({ buouxCragPage }) => {
    const addButton = buouxCragPage.getByRole('button', { name: /Ajouter un secteur/i });
    await expect(addButton).toBeVisible();
  });

  test('le bouton d\'ajout est desactive pour un utilisateur non connecte', async ({ buouxCragPage }) => {
    const addButton = buouxCragPage.getByRole('button', { name: /Ajouter un secteur/i });
    await expect(addButton).toBeDisabled();
  });

  test('le tooltip s\'affiche au survol du bouton desactive', async ({ buouxCragPage }) => {
    // Hover over the add button wrapper (span containing disabled button)
    const addButtonWrapper = buouxCragPage.locator('span').filter({
      has: buouxCragPage.getByRole('button', { name: /Ajouter un secteur/i })
    }).first();
    await addButtonWrapper.hover();

    // Wait for tooltip to appear
    await expect(buouxCragPage.getByRole('tooltip')).toBeVisible();
    await expect(buouxCragPage.getByRole('tooltip')).toContainText('Seuls les ouvreurs peuvent ajouter des secteurs');
  });
});
