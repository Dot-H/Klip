import { test, expect } from './fixtures';

test.describe('Page d\'accueil', () => {
  test('affiche le titre principal', async ({ homePage }) => {
    await expect(homePage.getByRole('heading', { name: 'Sites d\'escalade' })).toBeVisible();
  });

  test('affiche la liste des crags', async ({ homePage }) => {
    await expect(homePage.getByText('Buoux')).toBeVisible();
    await expect(homePage.getByText('Céüse')).toBeVisible();
    await expect(homePage.getByText('Verdon')).toBeVisible();
  });

  test('affiche les statistiques des crags', async ({ homePage }) => {
    await expect(homePage.getByText(/secteur/).first()).toBeVisible();
    await expect(homePage.getByText(/voie/).first()).toBeVisible();
  });

  test('navigation vers un crag', async ({ homePage }) => {
    await homePage.getByRole('link', { name: /Buoux/i }).click();

    await expect(homePage).toHaveURL(/\/crag\//);
    await expect(homePage.getByRole('heading', { name: 'Buoux' })).toBeVisible();
  });

  test('affiche le badge de convention', async ({ homePage }) => {
    // Buoux has convention signed
    await expect(homePage.getByText('Convention signée').first()).toBeVisible();

    // Verdon has no convention
    await expect(homePage.getByText('Sans convention')).toBeVisible();
  });
});

test.describe('Navigation globale', () => {
  test('le logo ramène à l\'accueil', async ({ buouxCragPage }) => {
    // Click logo/home link
    await buouxCragPage.getByRole('link', { name: 'KLIP' }).click();

    // Should be back on home page
    await expect(buouxCragPage).toHaveURL('/');
    await expect(buouxCragPage.getByRole('heading', { name: 'Sites d\'escalade' })).toBeVisible();
  });
});
