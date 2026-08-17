import {test, expect} from '@playwright/test';
import {expectNoContrastViolations} from '../helpers/a11y';

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
            const apply = [...document.querySelectorAll('.header-nav a')]
                .find((link) => link.textContent?.trim() === 'Apply');
            const tools = document.querySelector('.header-tools');
            if (!faq || !apply || !tools) return null;
            const linkGap = apply.getBoundingClientRect().left - faq.getBoundingClientRect().right;
            const toolsGap = tools.getBoundingClientRect().left - apply.getBoundingClientRect().right;
            return {linkGap, toolsGap};
        });

        expect(spacing).not.toBeNull();
        expect(Math.abs(spacing!.linkGap - spacing!.toolsGap)).toBeLessThan(2);
        expect(spacing!.toolsGap).toBeLessThan(24);
    });

    test('appearance control and gold headings pass contrast in light and dark', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});
        const appearance = page.locator('header').getByRole('group', {name: 'Appearance'});
        await expect(appearance).toHaveAttribute('data-hydrated', 'true', {timeout: 15_000});

        await appearance.getByRole('button', {name: 'Light'}).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
        await expectNoContrastViolations(page);

        await appearance.getByRole('button', {name: 'Dark'}).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await expectNoContrastViolations(page);
    });
});
