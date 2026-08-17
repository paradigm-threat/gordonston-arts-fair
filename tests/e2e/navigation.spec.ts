import {test, expect} from '@playwright/test';

test.describe('Site navigation', () => {
    test('header links navigate to landing sections', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});

        const header = page.locator('header');
        await header.getByRole('link', {name: 'Gordonston', exact: true}).click();
        await expect(page).toHaveURL(/#gordonston-history/);

        await header.getByRole('link', {name: 'FAQ', exact: true}).click();
        await expect(page).toHaveURL(/#faq/);
    });

    test('apply link opens apply page', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});

        await page.locator('header').getByRole('link', {name: 'Apply', exact: true}).click();
        await page.waitForURL(/\/apply/);
        await expect(page.getByRole('heading', {name: 'Artist Registration'})).toBeVisible();
    });

    test('impersonate page explains a missing ticket', async ({page}) => {
        await page.goto('/impersonate', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: 'Log in as artist'})).toBeVisible();
        await expect(page.getByText(/missing or expired/i)).toBeVisible();
        await expect(page.getByRole('link', {name: 'Return to the artist list'})).toBeVisible();
    });
});
