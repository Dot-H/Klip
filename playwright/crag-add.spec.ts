import { test, expect } from './fixtures';

test.describe('Ajout de sites - Affichage du bouton', () => {
  test('affiche un bouton d\'ajout de site sur la page d\'accueil', async ({ homePage }) => {
    const addButton = homePage.getByRole('button', { name: /Ajouter un site/i });
    await expect(addButton).toBeVisible();
  });

  test('le bouton d\'ajout est desactive pour un utilisateur non connecte', async ({ homePage }) => {
    const addButton = homePage.getByRole('button', { name: /Ajouter un site/i });
    await expect(addButton).toBeDisabled();
  });

  test('le tooltip s\'affiche au survol du bouton desactive', async ({ homePage }) => {
    // Hover over the add button wrapper (span containing disabled button)
    const addButtonWrapper = homePage.locator('span').filter({
      has: homePage.getByRole('button', { name: /Ajouter un site/i })
    }).first();
    await addButtonWrapper.hover();

    // Wait for tooltip to appear
    await expect(homePage.getByRole('tooltip')).toBeVisible();
    await expect(homePage.getByRole('tooltip')).toContainText('Seuls les ouvreurs peuvent ajouter des sites');
  });
});

test.describe('Site vide - Affichage du message et bouton', () => {
  test('affiche un message et un bouton d\'ajout quand le site n\'a pas de secteurs', async ({ siteVideCragPage }) => {
    // Vérifie le message
    await expect(siteVideCragPage.getByText('Aucun secteur répertorié sur ce site')).toBeVisible();

    // Vérifie le bouton d'ajout (désactivé car non connecté)
    const addButton = siteVideCragPage.getByRole('button', { name: /Ajouter un secteur/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeDisabled();
  });
});

test.describe('Ajout de sites - Formulaire', () => {
  test('le formulaire d\'ajout de site contient les champs requis', async ({ page }) => {
    // Simuler un utilisateur connecté avec le rôle ADMIN via l'API mock
    await page.route('**/api/user/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ role: 'ADMIN' }),
      });
    });

    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await expect(page.getByRole('link', { name: /Buoux/i })).toBeVisible({ timeout: 30000 });

    // Attendre que le bouton soit activé (après fetch du rôle)
    const addButton = page.getByRole('button', { name: /Ajouter un site/i });
    await expect(addButton).toBeEnabled({ timeout: 5000 });

    // Ouvrir le dialog
    await addButton.click();

    // Vérifier que le dialog s'ouvre avec le bon titre
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Ajouter un site d\'escalade')).toBeVisible();

    // Vérifier les champs du formulaire
    await expect(page.getByLabel('Nom du site')).toBeVisible();
    await expect(page.getByLabel('Site conventionné')).toBeVisible();

    // Vérifier les boutons
    await expect(page.getByRole('button', { name: 'Annuler' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ajouter' })).toBeVisible();

    // Fermer le dialog
    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
