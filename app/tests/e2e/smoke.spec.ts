import { expect, test } from '@playwright/test';

test('navigation smoke', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Champagne Room/);
  await page.setViewportSize({ width: 375, height: 667 });

  // Optionally, add a check for no console errors
  page.on('console', (message) => {
    if (message.type() === 'error') {
      throw new Error(`Console error: ${message.text()}`);
    }
  });
});
