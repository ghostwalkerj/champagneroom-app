import { expect, test } from '@playwright/test';
test('navigation smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Champagne Room/);
});
