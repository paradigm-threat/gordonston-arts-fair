import {test, expect} from '@playwright/test';
import {expectNoA11yViolations, expectNoContrastViolations} from '../helpers/a11y';

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

        await expect(page.getByRole('main').getByText(/October 5th, 2026/).first()).toBeVisible();
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

    test('has no WCAG A/AA violations, including contrast', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});
        await expectNoContrastViolations(page);
        await expectNoA11yViolations(page);
    });

    test('has no WCAG A/AA violations in dark mode, including contrast', async ({page}) => {
        await page.addInitScript(() => {
            localStorage.setItem('gaf-appearance', 'dark');
        });
        await page.goto('/', {waitUntil: 'domcontentloaded'});
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await expectNoContrastViolations(page);
        await expectNoA11yViolations(page);
    });

    test('featured slideshow stays off unless an approved photo is on the page', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});

        const slideshow = page.locator('#featured-artwork');
        if (await slideshow.count() === 0) {
            await expect(page.getByRole('heading', {name: /Artwork from the \d{4} Gordonston Art Fair/})).toHaveCount(0);
            return;
        }

        await expect(slideshow.getByRole('heading', {name: /Artwork from the \d{4} Gordonston Art Fair/})).toBeVisible();
        await expect(slideshow.getByText(/These pieces were shown at last year's fair/i)).toBeVisible();
        await expect(slideshow.getByText(/^by /)).toBeVisible();
        await expect(slideshow.locator('.featured-slide-description')).not.toBeEmpty();
    });
});
