import { expect, test } from '@playwright/test';

test('auth and reporting layouts remain usable across viewports', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Create your citizen account' })).toBeVisible();
  await expect(page.getByLabel('Full name')).toBeVisible();
});
