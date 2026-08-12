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
            timeout: 15_000,
        });

        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.message).toMatch(/unauthorized/i);
    });

    test('public registration checkout is blocked before open date', async ({request}) => {
        const apply = await request.get('/apply');
        const html = await apply.text();
        const submissionsNotOpen = /save your profile now/i.test(html)
            || /not open for submission yet/i.test(html)
            || /Applications open Saturday, August 15th, 2026/i.test(html);

        test.skip(!submissionsNotOpen, 'Registration window is already open in this environment');

        const response = await request.post('/api/checkout-sessions-public/registration', {
            data: {email: 'playwright-registration-gate@example.com'},
        });

        expect(response.status()).toBe(403);
        const body = await response.json();
        expect(body.message).toMatch(/not open yet|submission/i);
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
