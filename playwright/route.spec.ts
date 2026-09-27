import { test, expect } from './fixtures';

test.describe('Page de détail d\'une route simple', () => {
  test('affiche le nom de la route', async ({ roseDesSablesPage }) => {
    await expect(roseDesSablesPage.getByRole('heading', { name: /Rose des Sables/i })).toBeVisible();
  });

  test('affiche la longueur mais masque la cotation pour un utilisateur non connecté', async ({ roseDesSablesPage }) => {
    await expect(roseDesSablesPage.getByText('25m')).toBeVisible();
    await expect(roseDesSablesPage.getByText('7a')).not.toBeVisible();
  });

  test('affiche les breadcrumbs', async ({ roseDesSablesPage }) => {
    await expect(roseDesSablesPage.getByRole('link', { name: 'Accueil' })).toBeVisible();
    await expect(roseDesSablesPage.getByRole('link', { name: 'Buoux' })).toBeVisible();
    await expect(roseDesSablesPage.getByText('Styx', { exact: true })).toBeVisible();
  });

  test('affiche le bouton nouveau rapport', async ({ roseDesSablesPage }) => {
    await expect(roseDesSablesPage.getByRole('link', { name: /Nouveau rapport/i })).toBeVisible();
  });

  test('affiche le message "aucun rapport"', async ({ roseDesSablesPage }) => {
    await expect(roseDesSablesPage.getByText(/Aucun rapport pour cette voie/i)).toBeVisible();
  });

  test('breadcrumb navigue vers le crag', async ({ roseDesSablesPage }) => {
    await roseDesSablesPage.getByRole('link', { name: 'Buoux' }).click();
    await expect(roseDesSablesPage.getByRole('heading', { name: 'Buoux', level: 1 })).toBeVisible();
  });
});

test.describe('Page de détail d\'une route avec rapports', () => {
  test('affiche l\'historique des rapports', async ({ tabouAuNordPage }) => {
    await expect(tabouAuNordPage.getByRole('heading', { name: /Historique des rapports/i })).toBeVisible();

    // Check reporter name
    await expect(tabouAuNordPage.getByText('Pierre Ouvreur')).toBeVisible();

    // Check role badge (use chip locator to be specific)
    await expect(tabouAuNordPage.locator('.MuiChip-root', { hasText: /^Ouvreur$/ })).toBeVisible();

    // Check comment
    await expect(tabouAuNordPage.getByText(/Relais en bon état/i)).toBeVisible();
  });

  test('affiche les actions effectuées dans le rapport', async ({ tabouAuNordPage }) => {
    await expect(tabouAuNordPage.getByText('Contrôle visuel')).toBeVisible();
    await expect(tabouAuNordPage.getByText('Ancrages vérifiés')).toBeVisible();
  });
});

test.describe('Page de détail d\'une route multi-longueurs', () => {
  test('masque la cotation maximale pour un utilisateur non connecté', async ({ pichenibulePage }) => {
    await expect(pichenibulePage.locator('h1').getByText('6c')).not.toBeVisible();
  });

  test('affiche la section longueurs sans les cotations', async ({ pichenibulePage }) => {
    await expect(pichenibulePage.getByText(/Longueurs/i)).toBeVisible();

    // Check individual pitches are listed by length, without cotations
    await expect(pichenibulePage.getByRole('link', { name: /^L1 \(35m\)$/i })).toBeVisible();
    await expect(pichenibulePage.getByRole('link', { name: /^L2 \(40m\)$/i })).toBeVisible();
    await expect(pichenibulePage.getByRole('link', { name: /^L3 \(30m\)$/i })).toBeVisible();
  });

  test('affiche les rapports avec le numéro de longueur', async ({ pichenibulePage }) => {
    await expect(pichenibulePage.getByText('L1').first()).toBeVisible();
    await expect(pichenibulePage.getByText('L2').first()).toBeVisible();
    await expect(pichenibulePage.getByText('L3').first()).toBeVisible();
  });

  test('affiche plusieurs rapports de différents utilisateurs', async ({ pichenibulePage }) => {
    await expect(pichenibulePage.getByText('Jean Admin').first()).toBeVisible();
    await expect(pichenibulePage.getByText('Marie Grimpeuse')).toBeVisible();
  });

  test('affiche les rôles des rapporteurs', async ({ pichenibulePage }) => {
    await expect(pichenibulePage.locator('.MuiChip-root', { hasText: /^Admin$/ }).first()).toBeVisible();
    await expect(pichenibulePage.locator('.MuiChip-root', { hasText: /^Contributeur$/ }).first()).toBeVisible();
  });

  test('clic sur une longueur navigue vers le formulaire de rapport', async ({ pichenibulePage }) => {
    await pichenibulePage.getByRole('link', { name: /^L2 \(40m\)$/i }).click();
    await expect(pichenibulePage).toHaveURL(/\/crag\/[^/]+\/report\?pitchId=/);
  });
});

test.describe('Page route inexistante', () => {
  test('affiche une page 404', async ({ page }) => {
    await page.goto('/route/non-existent-id');
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  });
});
