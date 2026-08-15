import {test, expect} from '@playwright/test';

test.describe('Appearance', () => {
    test('header offers Light, Dark, and System default', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});

        const appearance = page.locator('header').getByLabel('Appearance');
        await expect(appearance).toBeVisible();
        await expect(appearance).toHaveValue('system');

        await appearance.selectOption('dark');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

        await appearance.selectOption('light');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    });
});
