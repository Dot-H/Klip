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

test.describe('Persistance du brouillon de rapport', () => {
  test('le brouillon est conservé après un rechargement de page (ex: retour de connexion)', async ({
    roseDesSablesReportPage: page,
  }) => {
    const visualCheck = page.getByRole('checkbox', { name: /Contrôle visuel/i });
    const commentField = page.getByLabel(/Commentaire/i);

    await visualCheck.check();
    await commentField.fill('Brouillon à conserver après connexion');

    // A full reload mimics returning to the form after the sign-in redirect.
    await page.reload({ waitUntil: 'networkidle' });

    await expect(
      page.getByRole('checkbox', { name: /Contrôle visuel/i }),
    ).toBeChecked();
    await expect(page.getByLabel(/Commentaire/i)).toHaveValue(
      'Brouillon à conserver après connexion',
    );
  });

  test('les détails de problème sont conservés après un rechargement', async ({
    roseDesSablesReportPage: page,
  }) => {
    await page.getByRole('checkbox', { name: /Problème détecté/i }).check();
    await page.getByRole('checkbox', { name: /Point défectueux/i }).check();

    await page.reload({ waitUntil: 'networkidle' });

    await expect(
      page.getByRole('checkbox', { name: /Problème détecté/i }),
    ).toBeChecked();
    await expect(
      page.getByRole('checkbox', { name: /Point défectueux/i }),
    ).toBeChecked();
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

test.describe('Rapport groupé (batch)', () => {
  test('le bouton "Rapport groupé" navigue vers le formulaire', async ({ buouxCragPage }) => {
    await buouxCragPage.getByRole('link', { name: /Rapport groupé/i }).click();

    await expect(buouxCragPage).toHaveURL(/\/crag\/[^/]+\/report/);
    await expect(
      buouxCragPage.getByRole('heading', { name: /Rapport groupé/i, level: 1 }),
    ).toBeVisible();
  });

  test('ne liste aucune voie tant qu\'aucune recherche n\'est faite', async ({ buouxBatchReportPage }) => {
    await expect(buouxBatchReportPage.getByText(/Longueurs concernées/i)).toBeVisible();
    await expect(
      buouxBatchReportPage.getByPlaceholder(/Rechercher une voie ou un secteur/i),
    ).toBeVisible();
    await expect(
      buouxBatchReportPage.getByText(/Recherchez une voie ou un secteur/i),
    ).toBeVisible();
    await expect(buouxBatchReportPage.getByText('1. Rose des Sables')).toHaveCount(0);
  });

  test('rechercher une voie par nom affiche le résultat', async ({ buouxBatchReportPage }) => {
    await buouxBatchReportPage
      .getByPlaceholder(/Rechercher une voie ou un secteur/i)
      .fill('Rose');

    await expect(buouxBatchReportPage.getByText('1. Rose des Sables')).toBeVisible();
    await expect(buouxBatchReportPage.getByText('2. Tabou au Nord')).toHaveCount(0);
  });

  test('rechercher un secteur liste toutes ses voies', async ({ buouxBatchReportPage }) => {
    await buouxBatchReportPage
      .getByPlaceholder(/Rechercher une voie ou un secteur/i)
      .fill('Styx');

    await expect(buouxBatchReportPage.getByText('1. Rose des Sables')).toBeVisible();
    await expect(buouxBatchReportPage.getByText('2. Tabou au Nord')).toBeVisible();
  });

  test('réutilise les champs du rapport (actions, commentaire)', async ({ buouxBatchReportPage }) => {
    await expect(buouxBatchReportPage.getByText(/Actions réalisées/i)).toBeVisible();
    await expect(
      buouxBatchReportPage.getByRole('checkbox', { name: /Contrôle visuel/i }),
    ).toBeVisible();
    await expect(buouxBatchReportPage.getByLabel(/Commentaire/i)).toBeVisible();
  });

  test('le bouton envoyer est désactivé sans authentification', async ({ buouxBatchReportPage }) => {
    await expect(
      buouxBatchReportPage.getByRole('button', { name: /Envoyer le rapport/i }),
    ).toBeDisabled();
  });

  test('sélectionner une longueur met à jour le compteur sans effacer la recherche', async ({
    buouxBatchReportPage,
  }) => {
    const search = buouxBatchReportPage.getByPlaceholder(/Rechercher une voie ou un secteur/i);
    await search.fill('Rose');
    await buouxBatchReportPage
      .getByRole('button', { name: /1\. Rose des Sables/i })
      .click();

    await expect(buouxBatchReportPage.getByText(/1 longueur sélectionnée/i)).toBeVisible();
    await expect(
      buouxBatchReportPage.getByRole('button', { name: /Envoyer le rapport pour 1 longueur/i }),
    ).toBeVisible();
    // The search must not be cleared by selecting, so the user can keep picking.
    await expect(search).toHaveValue('Rose');
    // The selection is shown as a removable chip.
    await expect(
      buouxBatchReportPage.locator('.MuiChip-root', { hasText: '1. Rose des Sables' }),
    ).toBeVisible();
  });

  test('une longueur sélectionnée reste sélectionnée après une nouvelle recherche', async ({
    buouxBatchReportPage,
  }) => {
    const search = buouxBatchReportPage.getByPlaceholder(/Rechercher une voie ou un secteur/i);
    await search.fill('Rose');
    await buouxBatchReportPage
      .getByRole('button', { name: /1\. Rose des Sables/i })
      .click();
    await search.fill('Tabou');

    // The chip persists even though the route is no longer in the results.
    await expect(buouxBatchReportPage.getByText(/1 longueur sélectionnée/i)).toBeVisible();
    await expect(
      buouxBatchReportPage.locator('.MuiChip-root', { hasText: '1. Rose des Sables' }),
    ).toBeVisible();
  });

  test('sélectionner un secteur sélectionne toutes ses longueurs', async ({ buouxBatchReportPage }) => {
    await buouxBatchReportPage
      .getByPlaceholder(/Rechercher une voie ou un secteur/i)
      .fill('Styx');
    await buouxBatchReportPage.getByText('Styx').click();

    await expect(buouxBatchReportPage.getByText(/2 longueurs sélectionnées/i)).toBeVisible();
  });

  test('une voie multi-longueurs affiche une ligne par longueur', async ({ verdonBatchReportPage }) => {
    // Pichenibule (Escalès) has 3 pitches and must expand into L1/L2/L3.
    await verdonBatchReportPage
      .getByPlaceholder(/Rechercher une voie ou un secteur/i)
      .fill('Pichenibule');

    await expect(verdonBatchReportPage.getByText('1. Pichenibule')).toBeVisible();
    await expect(verdonBatchReportPage.getByText(/L1 \(6b, 35m\)/i)).toBeVisible();
    await expect(verdonBatchReportPage.getByText(/L2 \(6c, 40m\)/i)).toBeVisible();
    await expect(verdonBatchReportPage.getByText(/L3 \(6a\+, 30m\)/i)).toBeVisible();
  });

  test('une longueur d\'une voie multi-longueurs est sélectionnable individuellement', async ({
    verdonBatchReportPage,
  }) => {
    await verdonBatchReportPage
      .getByPlaceholder(/Rechercher une voie ou un secteur/i)
      .fill('Pichenibule');
    await verdonBatchReportPage.getByText(/L2 \(6c, 40m\)/i).click();

    await expect(verdonBatchReportPage.getByText(/1 longueur sélectionnée/i)).toBeVisible();
  });

  test('clic sur "Se connecter" ouvre la modal d\'authentification', async ({ buouxBatchReportPage }) => {
    await buouxBatchReportPage.getByRole('button', { name: /Se connecter/i }).click();

    await expect(buouxBatchReportPage.getByRole('dialog')).toBeVisible();
    await expect(buouxBatchReportPage.getByText(/Connexion requise/i)).toBeVisible();
  });
});
