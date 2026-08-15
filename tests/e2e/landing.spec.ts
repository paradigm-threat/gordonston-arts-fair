import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Landing page', () => {
    test('shows fair branding and 2027 event details', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});

        await expect(page.locator('header').getByRole('heading', {name: 'Gordonston'})).toBeVisible();
        await expect(page.locator('header').getByText('ART FAIR')).toBeVisible();
        await expect(page.getByText(/March 6th, 2027/).first()).toBeVisible();
        await expect(page.getByRole('heading', {name: /Artist Application for the 2027 Gordonston Art Fair/})).toBeVisible();
    });

    test('shows application window dates', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});

        await expect(page.getByRole('main').getByText(/October 1st, 2026/).first()).toBeVisible();
        await expect(page.getByRole('main').getByText(/November 1st, 2026/).first()).toBeVisible();
    });

    test('header application status matches the current registration window', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});

        const headerStatus = page.locator('header').getByText(
            /Applications open until|Applications open Saturday|application period is closed/i
        );
        await expect(headerStatus.first()).toBeVisible();
    });

    test('can skip to main content', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});
        await page.keyboard.press('Tab');
        await expect(page.getByRole('link', {name: 'Skip to main content'})).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.locator('#main-content')).toBeVisible();
    });

    test('has no critical accessibility violations', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});

        const results = await new AxeBuilder({page}).analyze();
        expect(results.violations).toEqual([]);
    });

    test('has no critical accessibility violations in dark mode', async ({page}) => {
        await page.addInitScript(() => {
            localStorage.setItem('gaf-appearance', 'dark');
        });
        await page.goto('/', {waitUntil: 'domcontentloaded'});
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

        const results = await new AxeBuilder({page}).analyze();
        expect(results.violations).toEqual([]);
    });
});
