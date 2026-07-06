import {test, expect} from '@playwright/test';

test.describe('Apply page', () => {
    test('shows registration information', async ({page}) => {
        await page.goto('/apply', {waitUntil: 'domcontentloaded'});

        await expect(page.getByRole('heading', {name: 'Artist Registration'})).toBeVisible();
        await expect(page.getByText(/March 6th, 2027/).first()).toBeVisible();
        await expect(page.getByText(/October 1st, 2026/).first()).toBeVisible();
        await expect(page.getByText(/Only online applications will be accepted/)).toBeVisible();
    });

    test('links to terms from registration section', async ({page}) => {
        await page.goto('/apply#registration', {waitUntil: 'domcontentloaded'});

        await expect(page.locator('a[href="/terms"]').first()).toBeVisible();
    });
});
