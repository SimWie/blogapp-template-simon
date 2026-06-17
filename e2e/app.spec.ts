import { test, expect } from '@playwright/test';

test('should display the blog overview page', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('mat-toolbar')).toContainText('HFTM Web Applications');
  await expect(page.locator('h1')).toContainText('Blog-Übersicht');
  await expect(page.locator('app-blog-card').first()).toBeVisible();
});
