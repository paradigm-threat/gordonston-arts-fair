import {test, expect} from '@playwright/test';

test.describe('Appearance', () => {
    test('header offers Light, Dark, and System default icons', async ({page}) => {
        await page.goto('/', {waitUntil: 'load'});

        const appearance = page.locator('header').getByRole('group', {name: 'Appearance'});
        await expect(appearance).toBeVisible();
        await expect(appearance).toHaveAttribute('data-hydrated', 'true', {timeout: 15_000});
        await expect(appearance.getByRole('button', {name: 'System default'})).toHaveAttribute('aria-pressed', 'true');

        await appearance.getByRole('button', {name: 'Dark'}).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

        await appearance.getByRole('button', {name: 'Light'}).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    });

    test('header chrome matches the page theme and stays grouped with tools', async ({page}) => {
        await page.setViewportSize({width: 1280, height: 800});
        await page.addInitScript(() => {
            localStorage.setItem('gaf-appearance', 'dark');
        });
        await page.goto('/', {waitUntil: 'domcontentloaded'});
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

        const header = page.locator('.header-container');
        await expect(header).toHaveCSS('background-color', 'rgb(18, 18, 18)');
        await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 18, 18)');

        const spacing = await page.evaluate(() => {
            const faq = [...document.querySelectorAll('.header-nav a')]
                .find((link) => link.textContent?.trim() === 'FAQ');
            const artists = [...document.querySelectorAll('.header-nav a')]
                .find((link) => link.textContent?.trim() === 'Artists');
            const tools = document.querySelector('.header-tools');
            if (!faq || !artists || !tools) return null;
            const linkGap = artists.getBoundingClientRect().left - faq.getBoundingClientRect().right;
            const toolsGap = tools.getBoundingClientRect().left - artists.getBoundingClientRect().right;
            return {linkGap, toolsGap};
        });

        expect(spacing).not.toBeNull();
        expect(Math.abs(spacing!.linkGap - spacing!.toolsGap)).toBeLessThan(2);
        expect(spacing!.toolsGap).toBeLessThan(24);
    });
});
