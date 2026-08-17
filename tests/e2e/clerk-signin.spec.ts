import {expect, test} from '@playwright/test';
import {setupClerkTestingToken} from '@clerk/testing/playwright';
import {
    applyClerkTestEnv,
    E2E_ARTIST_EMAIL,
    E2E_USER_PASSWORD,
} from './helpers/clerkUsers';

test.describe('Clerk sign-in', () => {
    test.beforeEach(async ({page}) => {
        applyClerkTestEnv();
        await setupClerkTestingToken({page});
    });

    test('header Sign in opens the Clerk sign-in UI', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});

        await page.locator('header').getByRole('button', {name: 'Sign in'}).click();

        const clerkUi = page.locator('[data-clerk-component], .cl-signIn-root, .cl-modalContent, .cl-card');
        await expect(clerkUi.first()).toBeVisible({timeout: 20_000});
    });

    test('artist can finish sign-in through the Clerk modal', async ({page}) => {
        await page.goto('/', {waitUntil: 'domcontentloaded'});
        await page.locator('header').getByRole('button', {name: 'Sign in'}).click();

        const identifier = page.locator('input[name="identifier"], input[type="email"]').first();
        await expect(identifier).toBeVisible({timeout: 20_000});
        await identifier.fill(E2E_ARTIST_EMAIL);

        await page.getByRole('button', {name: /^continue$/i}).click();

        const password = page.getByLabel(/^password$/i);
        const otp = page.locator('input[name="code"], input[autocomplete="one-time-code"]').first();
        await expect(password.or(otp)).toBeVisible({timeout: 20_000});

        if (await password.isVisible()) {
            await password.fill(E2E_USER_PASSWORD);
            await page.getByRole('button', {name: /^(continue|sign in)$/i}).click();
        } else {
            await otp.fill('424242');
        }

        await page.waitForURL(/\/(profile|redirect|user)/, {timeout: 30_000});
        await page.goto('/profile', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: 'Artist Profile'})).toBeVisible({timeout: 30_000});
        await expect(page.locator('header').getByRole('button', {name: 'Sign in'})).toHaveCount(0);
    });
});
