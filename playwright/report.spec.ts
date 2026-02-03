import { test, expect } from '@playwright/test';

test.describe('Page de création de rapport', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to report form for Rose des Sables
    await page.goto('/');
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Rose des Sables/i }).click();
    await page.waitForURL(/\/route\//);
    await expect(page.getByRole('heading', { name: /Rose des Sables/i })).toBeVisible();
    await page.getByRole('link', { name: /Nouveau rapport/i }).click();
    await page.waitForURL(/\/report\?pitchId=/);
    await expect(page.getByRole('heading', { name: /Nouveau rapport/i })).toBeVisible();
  });

  test('affiche le titre de la page', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Nouveau rapport de maintenance/i }),
    ).toBeVisible();
  });

  test('affiche les informations de la voie', async ({ page }) => {
    await expect(page.getByText(/Rose des Sables/i).first()).toBeVisible();
    await expect(page.getByText(/Styx/i).first()).toBeVisible();
    await expect(page.getByText(/Buoux/i).first()).toBeVisible();
  });

  test('affiche les breadcrumbs', async ({ page }) => {
    // Check for breadcrumb links (Accueil, Buoux, etc.)
    await expect(page.getByRole('link', { name: 'Accueil' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Buoux' }).first()).toBeVisible();
  });

  test('affiche la section "Vos informations"', async ({ page }) => {
    await expect(page.getByText(/Vos informations/i)).toBeVisible();
    // Should show not logged in message
    await expect(
      page.getByText(/Vous devez vous connecter/i),
    ).toBeVisible();
  });

  test('affiche le bouton de connexion quand non connecté', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();
  });

  test('affiche les cases à cocher des actions', async ({ page }) => {
    await expect(page.getByText(/Actions réalisées/i)).toBeVisible();

    await expect(page.getByRole('checkbox', { name: /Contrôle visuel/i })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /Ancrages vérifiés/i })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /Nettoyage effectué/i })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /Purge effectuée/i })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /Rééquipement total/i })).toBeVisible();
  });

  test('affiche le champ de commentaire', async ({ page }) => {
    await expect(page.getByLabel(/Commentaire/i)).toBeVisible();
  });

  test('le bouton envoyer est désactivé sans authentification', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /Envoyer le rapport/i });
    await expect(submitButton).toBeDisabled();
  });

  test('peut cocher les cases à cocher', async ({ page }) => {
    const visualCheck = page.getByRole('checkbox', { name: /Contrôle visuel/i });
    await visualCheck.check();
    await expect(visualCheck).toBeChecked();

    const anchorCheck = page.getByRole('checkbox', { name: /Ancrages vérifiés/i });
    await anchorCheck.check();
    await expect(anchorCheck).toBeChecked();
  });

  test('peut remplir le commentaire', async ({ page }) => {
    const commentField = page.getByLabel(/Commentaire/i);
    await commentField.fill('Test comment for the report');
    await expect(commentField).toHaveValue('Test comment for the report');
  });

  test('clic sur "Se connecter" ouvre la modal d\'authentification', async ({ page }) => {
    await page.getByRole('button', { name: /Se connecter/i }).click();

    // Check auth modal appears
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Connexion requise/i)).toBeVisible();
  });

  test('breadcrumb retourne vers la route', async ({ page }) => {
    await page.getByRole('link', { name: /Rose des Sables/i }).click();
    await expect(page).toHaveURL(/\/route\//);
    await expect(page).not.toHaveURL(/\/report/);
  });
});

test.describe('Rapport multi-longueurs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to report form for Pichenibule (multi-pitch)
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await expect(page.getByRole('heading', { name: /Pichenibule/i })).toBeVisible();
    await page.getByRole('link', { name: /Nouveau rapport/i }).click();
    await expect(page.getByRole('heading', { name: /Nouveau rapport/i })).toBeVisible();
  });

  test('affiche la section "Longueurs concernées"', async ({ page }) => {
    await expect(page.getByText(/Longueurs concernées/i)).toBeVisible();
  });

  test('affiche les boutons de sélection de longueur', async ({ page }) => {
    await expect(page.getByRole('button', { name: /L1/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /L2/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /L3/i })).toBeVisible();
  });

  test('peut sélectionner plusieurs longueurs', async ({ page }) => {
    // L1 should be pre-selected (based on pitchId in URL)
    const l2Button = page.getByRole('button', { name: /L2/i });
    await l2Button.click();

    // Both should now be selected (aria-pressed)
    await expect(l2Button).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Affichage des rapports existants', () => {
  test('affiche les rapports sur une route avec historique', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//);

    // Should see reports
    await expect(page.getByRole('heading', { name: /Historique des rapports/i })).toBeVisible();

    // Check reporter names are visible
    await expect(page.getByText('Jean Admin').first()).toBeVisible();
  });

  test('affiche les badges d\'actions complétées', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//);

    // Check for completed action chips
    await expect(page.getByText('Contrôle visuel').first()).toBeVisible();
    await expect(page.getByText('Nettoyage').first()).toBeVisible();
  });

  test('affiche les commentaires des rapports', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//);

    // Check for comments
    await expect(page.getByText(/L1 en parfait état/i)).toBeVisible();
    await expect(page.getByText(/plaquette mobile/i)).toBeVisible();
  });

  test('affiche le numéro de longueur dans les rapports multi-pitch', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//);

    // Check pitch numbers in report cards
    const l1Chip = page.locator('.MuiChip-root', { hasText: 'L1' });
    await expect(l1Chip.first()).toBeVisible();
  });
});

test.describe('Navigation depuis le bouton rapport', () => {
  test('le bouton "Nouveau rapport" navigue vers le formulaire', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Buoux/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Tabou au Nord/i }).click();
    await page.waitForURL(/\/route\//);

    await page.getByRole('link', { name: /Nouveau rapport/i }).click();

    await expect(page).toHaveURL(/\/report\?pitchId=/);
    await expect(
      page.getByRole('heading', { name: /Nouveau rapport/i }),
    ).toBeVisible();
  });

  test('clic sur longueur spécifique pré-sélectionne cette longueur', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Verdon/i }).click();
    await page.waitForURL(/\/crag\//);
    await page.getByRole('link', { name: /Pichenibule/i }).click();
    await page.waitForURL(/\/route\//);

    // Click on L2 button in pitches section
    await page.getByRole('link', { name: /L2.*6c/i }).click();

    await expect(page).toHaveURL(/\/report\?pitchId=/);

    // L2 should be pre-selected
    const l2Button = page.getByRole('button', { name: /L2/i });
    await expect(l2Button).toHaveAttribute('aria-pressed', 'true');
  });
});
