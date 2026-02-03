import { test, expect } from './fixtures';

test.describe('Page de détail d\'un crag', () => {
  test('affiche le nom du crag et ses informations', async ({ buouxCragPage }) => {
    // Check heading
    await expect(buouxCragPage.getByRole('heading', { name: 'Buoux', level: 1 })).toBeVisible();

    // Check convention badge
    await expect(buouxCragPage.getByText('Convention signée')).toBeVisible();

    // Check sector and route count
    await expect(buouxCragPage.getByText(/2 secteurs/)).toBeVisible();
    await expect(buouxCragPage.getByText(/3 voies/)).toBeVisible();
  });

  test('affiche les secteurs', async ({ buouxCragPage }) => {
    await expect(buouxCragPage.getByRole('heading', { name: 'Styx' })).toBeVisible();
    await expect(buouxCragPage.getByRole('heading', { name: 'Bout du Monde' })).toBeVisible();
  });

  test('affiche les routes dans chaque secteur', async ({ buouxCragPage }) => {
    // Check routes in Styx sector
    await expect(buouxCragPage.getByText('Rose des Sables')).toBeVisible();
    await expect(buouxCragPage.getByText('Tabou au Nord')).toBeVisible();

    // Check route without name shows "Voie X"
    await expect(buouxCragPage.getByText('Voie 1')).toBeVisible();
  });

  test('affiche la cotation et longueur des routes', async ({ buouxCragPage }) => {
    await expect(buouxCragPage.getByText('7a')).toBeVisible();
    await expect(buouxCragPage.getByText('7b+')).toBeVisible();

    await expect(buouxCragPage.getByText('25m')).toBeVisible();
    await expect(buouxCragPage.getByText('30m')).toBeVisible();
  });

  test('navigation vers une route', async ({ buouxCragPage }) => {
    await buouxCragPage.getByRole('link', { name: /Rose des Sables/i }).click();
    await expect(buouxCragPage.getByRole('heading', { name: /Rose des Sables/i })).toBeVisible();
  });

  test('breadcrumbs affiche le lien Accueil', async ({ buouxCragPage }) => {
    await expect(buouxCragPage.getByRole('link', { name: 'Accueil' })).toBeVisible();
  });
});

test.describe('Crag sans convention', () => {
  test('affiche le badge "Sans convention"', async ({ verdonCragPage }) => {
    await expect(verdonCragPage.getByRole('heading', { name: 'Verdon', level: 1 })).toBeVisible();
    await expect(verdonCragPage.getByText('Sans convention')).toBeVisible();
  });
});

test.describe('Page crag inexistant', () => {
  test('affiche une page 404', async ({ page }) => {
    await page.goto('/crag/non-existent-id');
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  });
});
