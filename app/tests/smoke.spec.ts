import { expect, test } from '@playwright/test';

test('navigation smoke', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Champagne Room/);
  await page.setViewportSize({ width: 375, height: 667 });

  if (isMobile) {
    // Open the sidebar

    // Click on each menu item and verify the navigation
    const menuItems = [
      'About',
      'The Show',
      'FAQ',
      'Creators',
      'Token',
      'Contact',
      'Open App'
    ];
    for (const item of menuItems) {
      await page.getByLabel('open sidebar').getByRole('img').click();
      await page.getByRole('link', { name: item }).first().click();
      expect(page.url().endsWith('#' + item.toLowerCase()));
    }
  } else {
    // Test for each menu item
    await expect(
      page.getByRole('link', { name: 'About' }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'The Show' }).first()
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'FAQ' }).first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Creators' }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Token' }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Contact' }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Open App' }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Sign Up' }).first()
    ).toBeVisible();
  }

  // Optionally, add a check for no console errors
  page.on('console', (message) => {
    if (message.type() === 'error') {
      throw new Error(`Console error: ${message.text()}`);
    }
  });
});
