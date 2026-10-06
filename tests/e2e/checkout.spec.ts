import {test, expect} from '@playwright/test';
import {expectNoA11yViolations, expectNoContrastViolations} from '../helpers/a11y';
import {getRegistrationPhase, isRegistrationCheckoutAllowed} from '../../util/date';

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

    test('public registration checkout is blocked outside the open window for new emails', async ({request}) => {
        test.skip(isRegistrationCheckoutAllowed(), 'Registration window is already open in this environment');

        const phase = getRegistrationPhase();
        const email = `playwright-registration-gate-${Date.now()}@example.com`;
        const response = await request.post('/api/checkout-sessions-public/registration', {
            data: {email},
        });

        expect(response.status()).toBe(403);
        const body = await response.json();
        if (phase === 'not-yet-open') {
            expect(body.message).toMatch(/not open yet|submission/i);
        } else {
            expect(body.message).toMatch(/closed|new applicants|already started/i);
        }
    });

    test('public payment page hides registration checkout for new emails outside the open window', async ({page}) => {
        test.skip(isRegistrationCheckoutAllowed(), 'Registration window is already open in this environment');

        const email = `playwright-registration-gate-${Date.now()}@example.com`;
        await page.goto(`/payment?email=${encodeURIComponent(email)}`, {
            waitUntil: 'domcontentloaded',
        });

        await expect(page.getByRole('button', {name: /Pay Registration Fee/i})).toHaveCount(0);
    });
});

test.describe('Public payment page', () => {
    test('shows email capture form without query params', async ({page}) => {
        await page.goto('/payment', {waitUntil: 'domcontentloaded'});

        await expect(page.getByRole('heading', {name: 'Artist Payment'})).toBeVisible();
        await expect(page.getByPlaceholder('artist@example.com')).toBeVisible();
        await expect(page.getByRole('button', {name: 'Continue'})).toBeVisible();
    });

    test('has no WCAG A/AA violations, including contrast', async ({page}) => {
        await page.goto('/payment', {waitUntil: 'domcontentloaded'});
        await expectNoContrastViolations(page);
        await expectNoA11yViolations(page);
    });
});
