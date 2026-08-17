import {expect, test} from '@playwright/test';
import {E2E_ARTIST_EMAIL} from './helpers/clerkUsers';
import {expectNoA11yViolations, expectNoContrastViolations} from '../helpers/a11y';

test.describe('Signed-in admin', () => {
    test('opens the artist list', async ({page}) => {
        await page.goto('/user', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: /Manage/})).toBeVisible();
        await expect(page.getByRole('link', {name: 'Featured photos'})).toBeVisible();
        await expect(page.getByText(/Unauthorized/i)).toHaveCount(0);
        await expect(page.locator('header').getByRole('button', {name: 'Sign in'})).toHaveCount(0);
    });

    test('can search for the Playwright artist', async ({page}) => {
        await page.goto('/user', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: /Manage/})).toBeVisible();

        await page.getByLabel('Search').fill(E2E_ARTIST_EMAIL);
        await expect(page.getByText(E2E_ARTIST_EMAIL, {exact: false})).toBeVisible({timeout: 20_000});
        await expect(page.getByRole('link', {name: /Playwright/i}).first()).toBeVisible();
    });

    test('featured queue explains the new artist-request flow', async ({page}) => {
        await page.goto('/user/featured', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: 'Featured photos'})).toBeVisible();
        await expect(page.getByText(/This is a new feature/i)).toBeVisible();
        await expect(page.getByText(/artists want featured/i)).toBeVisible();
        await expect(page.getByText(/not a random selection/i)).toBeVisible();
        await expect(page.getByText(/Approved \(on the front page\):/i)).toBeVisible();
        await expect(page.getByText(/Waiting for review:/i).first()).toBeVisible();
        await expect(page.getByText(/Declined:/i).first()).toBeVisible();
        await expect(
            page.getByText(/When you approve the first image, it will automatically appear|The front page slideshow is showing/i),
        ).toBeVisible();
    });

    test('artist list has no WCAG A/AA violations, including contrast', async ({page}) => {
        await page.goto('/user', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: /Manage/})).toBeVisible();
        await expectNoContrastViolations(page);
        await expectNoA11yViolations(page);
    });

    test('manage-artist page has no WCAG A/AA violations, including contrast', async ({page}) => {
        await page.goto('/user', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: /Manage/})).toBeVisible();
        await page.getByLabel('Search').fill(E2E_ARTIST_EMAIL);
        const artistRow = page.locator('table tbody tr').filter({hasText: E2E_ARTIST_EMAIL});
        await expect(artistRow).toBeVisible({timeout: 20_000});
        await artistRow.getByRole('link').first().click();
        await expect(page.getByRole('heading', {name: 'Manage an Artist'})).toBeVisible({timeout: 20_000});
        await expect(page.getByRole('link', {name: 'Edit profile'})).toBeVisible();
        await expect(page.getByRole('button', {name: /Log in as /i})).toBeVisible();
        await expectNoContrastViolations(page);
        await expectNoA11yViolations(page);
    });

    test('edit page offers Clerk impersonation', async ({page}) => {
        await page.goto('/user', {waitUntil: 'domcontentloaded'});
        await page.getByLabel('Search').fill(E2E_ARTIST_EMAIL);
        const artistRow = page.locator('table tbody tr').filter({hasText: E2E_ARTIST_EMAIL});
        await expect(artistRow).toBeVisible({timeout: 20_000});
        await artistRow.getByRole('link').first().click();
        await expect(page.getByRole('heading', {name: 'Manage an Artist'})).toBeVisible({timeout: 20_000});

        const editHref = await page.getByRole('link', {name: 'Edit profile'}).getAttribute('href');
        expect(editHref).toBeTruthy();
        await page.goto(editHref!, {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: 'Edit Artist Profile'})).toBeVisible({timeout: 20_000});
        await expect(page.getByRole('button', {name: /Log in as /i})).toBeVisible();
        await expect(page.getByText(/Admin mode: You are editing this profile/i)).toBeVisible();
    });
});
