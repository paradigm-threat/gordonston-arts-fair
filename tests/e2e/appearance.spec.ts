import {test, expect} from '@playwright/test';

test.describe('Appearance', () => {
    test('header offers Light, Dark, and System default icons', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});

        const appearance = page.locator('header').getByRole('group', {name: 'Appearance'});
        await expect(appearance).toBeVisible();
        await expect(appearance).toHaveAttribute('data-hydrated', 'true');
        await expect(appearance.getByRole('button', {name: 'System default'})).toHaveAttribute('aria-pressed', 'true');

        await appearance.getByRole('button', {name: 'Dark'}).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

        await appearance.getByRole('button', {name: 'Light'}).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    });
});
