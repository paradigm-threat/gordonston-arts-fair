import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Apply page', () => {
    test('shows registration information', async ({page}) => {
        await page.goto('/apply', {waitUntil: 'domcontentloaded'});

        await expect(page.getByRole('heading', {name: 'Artist Registration'})).toBeVisible();
        await expect(page.getByText(/March 6th, 2027/).first()).toBeVisible();
        await expect(page.getByText(/October 1st, 2026/).first()).toBeVisible();
        await expect(page.getByText(/Only online applications will be accepted/)).toBeVisible();
    });

    test('allows early account creation but not submission before open date', async ({page}) => {
        await page.goto('/apply', {waitUntil: 'domcontentloaded'});

        const body = await page.locator('body').innerText();
        const submissionsNotOpen = /save your profile now/i.test(body);

        test.skip(!submissionsNotOpen, 'Registration window is already open in this environment');

        await expect(page.getByText(/August 15th, 2026/).first()).toBeVisible();
        await expect(page.getByText(/save your profile now/i)).toBeVisible();
        await expect(page.getByRole('button', {name: 'Register Now'})).toBeVisible();
    });

    test('shows copy for the current registration window', async ({page}) => {
        await page.goto('/apply', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: 'Artist Registration'})).toBeVisible();

        const body = await page.locator('article').innerText();
        const notYetOpen = /will open on/i.test(body);
        const open = /Applications are open until/i.test(body);
        const closed = /application period has closed/i.test(body);

        expect([notYetOpen, open, closed].filter(Boolean)).toHaveLength(1);

        if (open) {
            await expect(page.getByText(/Applications are open until/i)).toBeVisible();
            await expect(page.getByText(/save your profile now/i)).toHaveCount(0);
        }
        if (notYetOpen) {
            await expect(page.getByText(/save your profile now/i)).toBeVisible();
        }
        if (closed) {
            await expect(page.getByText(/application period has closed/i)).toBeVisible();
        }
    });

    test('offers Sign in for returning artists and Register Now for new applicants', async ({page}) => {
        await page.goto('/apply', {waitUntil: 'domcontentloaded'});

        await expect(page.getByRole('heading', {name: /Sign in or register as an artist/i})).toBeVisible();
        await expect(page.locator('article').getByRole('button', {name: 'Sign in'})).toBeVisible();
        await expect(page.locator('article').getByRole('button', {name: 'Register Now'})).toBeVisible();
    });

    test('links to terms from registration section', async ({page}) => {
        await page.goto('/apply#registration', {waitUntil: 'domcontentloaded'});

        await expect(page.locator('a[href="/terms"]').first()).toBeVisible();
    });

    test('has no critical accessibility violations', async ({page}) => {
        await page.goto('/apply', {waitUntil: 'domcontentloaded'});

        const results = await new AxeBuilder({page}).analyze();
        expect(results.violations).toEqual([]);
    });
});
