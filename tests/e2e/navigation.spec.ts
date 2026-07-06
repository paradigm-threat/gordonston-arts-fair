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

    test('artists link opens apply page', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});

        await page.locator('header a[href="/apply#registration"]').click();
        await page.waitForURL(/\/apply/);
        await expect(page.getByRole('heading', {name: 'Artist Registration'})).toBeVisible();
    });
});
