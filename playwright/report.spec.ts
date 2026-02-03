import { test, expect } from './fixtures';

test.describe('Page de création de rapport', () => {
  test('affiche le titre de la page', async ({ roseDesSablesReportPage }) => {
    await expect(
      roseDesSablesReportPage.getByRole('heading', { name: /Nouveau rapport de maintenance/i }),
    ).toBeVisible();
  });

  test('affiche les informations de la voie', async ({ roseDesSablesReportPage }) => {
    await expect(roseDesSablesReportPage.getByText(/Rose des Sables/i).first()).toBeVisible();
    await expect(roseDesSablesReportPage.getByText(/Styx/i).first()).toBeVisible();
    await expect(roseDesSablesReportPage.getByText(/Buoux/i).first()).toBeVisible();
  });

  test('affiche les breadcrumbs', async ({ roseDesSablesReportPage }) => {
    await expect(roseDesSablesReportPage.getByRole('link', { name: 'Accueil' })).toBeVisible();
    await expect(roseDesSablesReportPage.getByRole('link', { name: 'Buoux' }).first()).toBeVisible();
  });

  test('affiche la section "Vos informations"', async ({ roseDesSablesReportPage }) => {
    await expect(roseDesSablesReportPage.getByText(/Vos informations/i)).toBeVisible();
    await expect(
      roseDesSablesReportPage.getByText(/Vous devez vous connecter/i),
    ).toBeVisible();
  });

  test('affiche le bouton de connexion quand non connecté', async ({ roseDesSablesReportPage }) => {
    await expect(roseDesSablesReportPage.getByRole('button', { name: /Se connecter/i })).toBeVisible();
  });

  test('affiche les cases à cocher des actions', async ({ roseDesSablesReportPage }) => {
    await expect(roseDesSablesReportPage.getByText(/Actions réalisées/i)).toBeVisible();

    await expect(roseDesSablesReportPage.getByRole('checkbox', { name: /Contrôle visuel/i })).toBeVisible();
    await expect(roseDesSablesReportPage.getByRole('checkbox', { name: /Ancrages vérifiés/i })).toBeVisible();
    await expect(roseDesSablesReportPage.getByRole('checkbox', { name: /Nettoyage effectué/i })).toBeVisible();
    await expect(roseDesSablesReportPage.getByRole('checkbox', { name: /Purge effectuée/i })).toBeVisible();
    await expect(roseDesSablesReportPage.getByRole('checkbox', { name: /Rééquipement total/i })).toBeVisible();
  });

  test('affiche le champ de commentaire', async ({ roseDesSablesReportPage }) => {
    await expect(roseDesSablesReportPage.getByLabel(/Commentaire/i)).toBeVisible();
  });

  test('le bouton envoyer est désactivé sans authentification', async ({ roseDesSablesReportPage }) => {
    const submitButton = roseDesSablesReportPage.getByRole('button', { name: /Envoyer le rapport/i });
    await expect(submitButton).toBeDisabled();
  });

  test('peut cocher les cases à cocher', async ({ roseDesSablesReportPage }) => {
    const visualCheck = roseDesSablesReportPage.getByRole('checkbox', { name: /Contrôle visuel/i });
    await visualCheck.check();
    await expect(visualCheck).toBeChecked();

    const anchorCheck = roseDesSablesReportPage.getByRole('checkbox', { name: /Ancrages vérifiés/i });
    await anchorCheck.check();
    await expect(anchorCheck).toBeChecked();
  });

  test('peut remplir le commentaire', async ({ roseDesSablesReportPage }) => {
    const commentField = roseDesSablesReportPage.getByLabel(/Commentaire/i);
    await commentField.fill('Test comment for the report');
    await expect(commentField).toHaveValue('Test comment for the report');
  });

  test('clic sur "Se connecter" ouvre la modal d\'authentification', async ({ roseDesSablesReportPage }) => {
    await roseDesSablesReportPage.getByRole('button', { name: /Se connecter/i }).click();

    await expect(roseDesSablesReportPage.getByRole('dialog')).toBeVisible();
    await expect(roseDesSablesReportPage.getByText(/Connexion requise/i)).toBeVisible();
  });

  test('breadcrumb retourne vers la route', async ({ roseDesSablesReportPage }) => {
    await roseDesSablesReportPage.getByRole('link', { name: /Rose des Sables/i }).click();
    await expect(roseDesSablesReportPage).toHaveURL(/\/route\//);
    await expect(roseDesSablesReportPage).not.toHaveURL(/\/report/);
  });
});

test.describe('Rapport multi-longueurs', () => {
  test('affiche la section "Longueurs concernées"', async ({ pichenibuleReportPage }) => {
    await expect(pichenibuleReportPage.getByText(/Longueurs concernées/i)).toBeVisible();
  });

  test('affiche les boutons de sélection de longueur', async ({ pichenibuleReportPage }) => {
    await expect(pichenibuleReportPage.getByRole('button', { name: /L1/i })).toBeVisible();
    await expect(pichenibuleReportPage.getByRole('button', { name: /L2/i })).toBeVisible();
    await expect(pichenibuleReportPage.getByRole('button', { name: /L3/i })).toBeVisible();
  });

  test('peut sélectionner plusieurs longueurs', async ({ pichenibuleReportPage }) => {
    const l2Button = pichenibuleReportPage.getByRole('button', { name: /L2/i });
    await l2Button.click();

    await expect(l2Button).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Affichage des rapports existants', () => {
  test('affiche les rapports sur une route avec historique', async ({ pichenibulePage }) => {
    await expect(pichenibulePage.getByRole('heading', { name: /Historique des rapports/i })).toBeVisible();
    await expect(pichenibulePage.getByText('Jean Admin').first()).toBeVisible();
  });

  test('affiche les badges d\'actions complétées', async ({ pichenibulePage }) => {
    await expect(pichenibulePage.getByText('Contrôle visuel').first()).toBeVisible();
    await expect(pichenibulePage.getByText('Nettoyage').first()).toBeVisible();
  });

  test('affiche les commentaires des rapports', async ({ pichenibulePage }) => {
    await expect(pichenibulePage.getByText(/L1 en parfait état/i)).toBeVisible();
    await expect(pichenibulePage.getByText(/plaquette mobile/i)).toBeVisible();
  });

  test('affiche le numéro de longueur dans les rapports multi-pitch', async ({ pichenibulePage }) => {
    const l1Chip = pichenibulePage.locator('.MuiChip-root', { hasText: 'L1' });
    await expect(l1Chip.first()).toBeVisible();
  });
});

test.describe('Navigation depuis le bouton rapport', () => {
  test('le bouton "Nouveau rapport" navigue vers le formulaire', async ({ tabouAuNordPage }) => {
    await tabouAuNordPage.getByRole('link', { name: /Nouveau rapport/i }).click();

    await expect(tabouAuNordPage).toHaveURL(/\/report\?pitchId=/);
    await expect(
      tabouAuNordPage.getByRole('heading', { name: /Nouveau rapport/i }),
    ).toBeVisible();
  });

  test('clic sur longueur spécifique pré-sélectionne cette longueur', async ({ pichenibulePage }) => {
    await pichenibulePage.getByRole('link', { name: /L2.*6c/i }).click();

    await expect(pichenibulePage).toHaveURL(/\/report\?pitchId=/);

    const l2Button = pichenibulePage.getByRole('button', { name: /L2/i });
    await expect(l2Button).toHaveAttribute('aria-pressed', 'true');
  });
});
