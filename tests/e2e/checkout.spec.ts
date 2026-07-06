import {test, expect} from '@playwright/test';

test.describe('Checkout API', () => {
    test('public checkout rejects missing email', async ({request}) => {
        const response = await request.post('/api/checkout-sessions-public/registration', {
            data: {},
        });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.message).toMatch(/email/i);
    });

    test('authenticated checkout rejects unauthenticated requests', async ({request}) => {
        const response = await request.post('/api/checkout-sessions/registration', {
            data: {originUrl: 'http://127.0.0.1:3000'},
        });

        expect(response.status()).toBeGreaterThanOrEqual(401);
    });
});

test.describe('Public payment page', () => {
    test('shows email capture form without query params', async ({page}) => {
        await page.goto('/payment', {waitUntil: 'domcontentloaded'});

        await expect(page.getByRole('heading', {name: 'Artist Payment'})).toBeVisible();
        await expect(page.getByPlaceholder('artist@example.com')).toBeVisible();
        await expect(page.getByRole('button', {name: 'Continue'})).toBeVisible();
    });
});
