import { test, expect, type Page } from '@playwright/test';

/**
 * Akzeptanzkriterien: Blog-Liste
 *
 * 1. Wenn die Seite geladen wird, werden Blog-Einträge angezeigt.
 * 2. Jeder Blog-Eintrag zeigt einen Titel und eine Zusammenfassung.
 * 3. Wenn ein Autor im Filter gewählt wird, zeigt die Liste nur noch Blogs
 *    dieses Autors, und der Zähler passt sich an.
 *
 * Das Backend wird per page.route() gemockt: Der Test hängt so nicht vom
 * Azure-Backend ab, und die erwarteten Werte sind bekannt und stabil.
 */

const blogs = [
  { id: 1, title: 'Angular Signals', contentPreview: 'Reaktiver State ohne RxJS.', author: 'Anna' },
  { id: 2, title: 'Playwright Tipps', contentPreview: 'E2E-Tests stabil halten.', author: 'Ben' },
  { id: 3, title: 'Material Theming', contentPreview: 'Farben und Dark Mode.', author: 'Anna' },
].map((blog) => ({
  ...blog,
  likes: 0,
  comments: 0,
  likedByMe: false,
  createdByMe: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}));

async function mockBackend(page: Page): Promise<void> {
  // Blog-API (liegt auf einer anderen Origin -> CORS-Header nötig)
  await page.route('**/entries', (route) =>
    route.fulfill({
      json: { data: blogs },
      headers: { 'access-control-allow-origin': '*' },
    }),
  );
  // Session-Check des AuthStore: nicht eingeloggt
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { isAuthenticated: false, user: null } }),
  );
}

test.describe('Blog-Liste', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
    await page.goto('/');
  });

  test('zeigt nach dem Laden die Blog-Einträge an', async ({ page }) => {
    const cards = page.locator('app-blog-card');

    await expect(cards).toHaveCount(3);
    await expect(page.getByText('3 Blog(s)')).toBeVisible();
  });

  test('zeigt pro Blog-Eintrag Titel und Zusammenfassung', async ({ page }) => {
    const cards = page.locator('app-blog-card');
    await expect(cards).toHaveCount(3);

    for (const blog of blogs) {
      const card = cards.filter({ hasText: blog.title });
      await expect(card.locator('mat-card-title')).toHaveText(blog.title);
      await expect(card.locator('mat-card-content')).toContainText(blog.contentPreview);
    }
  });

  test('filtert die Liste nach Autor', async ({ page }) => {
    const cards = page.locator('app-blog-card');
    await expect(cards).toHaveCount(3);

    await page.getByLabel('Autor').selectOption('Anna');

    await expect(cards).toHaveCount(2);
    await expect(page.getByText('2 Blog(s)')).toBeVisible();
    await expect(cards.locator('mat-card-subtitle')).toHaveText(['Anna', 'Anna']);
    await expect(page.getByText('Playwright Tipps')).toHaveCount(0);
  });
});
