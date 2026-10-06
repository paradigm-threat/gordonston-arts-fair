import {expect, test, type Page} from '@playwright/test';
import {E2E_ARTIST_EMAIL} from './helpers/clerkUsers';
import {expectNoA11yViolations, expectNoContrastViolations} from '../helpers/a11y';

test.describe.configure({mode: 'serial'});

const TINY_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
);

async function closeCompletionDialog(page: Page) {
    const back = page.getByRole('button', {name: 'Return to Uploaded Images'});
    if (await back.isVisible().catch(() => false)) {
        await back.click();
        await expect(back).toHaveCount(0);
    }
}

test.describe('Signed-in artist', () => {
    test('opens profile, edit, and upload pages', async ({page}) => {
        await page.goto('/profile', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: 'Artist Profile'})).toBeVisible();
        await expect(page.getByRole('link', {name: /edit your profile/i})).toBeVisible();
        await expect(page.getByRole('link', {name: /manage your image uploads/i})).toBeVisible();
        await expect(page.getByText(/Artist Transactions|User Transactions/i)).toHaveCount(0);
        await expect(page.getByText(/Artist Logs|User Logs/i)).toHaveCount(0);
        await expect(page.locator('header').getByRole('button', {name: 'Sign in'})).toHaveCount(0);

        await page.goto('/profile/edit', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: /Edit Artist Profile|Artist Profile/i})).toBeVisible();
        await expect(page.getByLabel(/First Name/i)).toBeVisible();

        await page.goto('/profile/upload', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: 'Upload Artist Images'})).toBeVisible();
        await expect(page.getByRole('button', {name: /Upload multiple images/i})).toBeVisible();
        await expect(page.locator('#file-upload-multiple')).toHaveAttribute('accept', 'image/*');
        await expect(page.locator('#file-upload-multiple')).toHaveAttribute('multiple', '');
    });

    test('saves required profile fields', async ({page}) => {
        await page.goto('/profile/edit', {waitUntil: 'domcontentloaded'});
        await expect(page.getByLabel(/First Name/i)).toBeVisible();

        await page.locator('input[name="first_name"]').fill('Playwright');
        await page.locator('input[name="last_name"]').fill('Artist');
        await page.locator('input[name="phone"]').fill('9125550100');
        await page.locator('input[name="address"]').fill('1 Arts Way');
        await page.locator('input[name="city"]').fill('Savannah');

        await page.getByRole('combobox', {name: /state/i}).click();
        await page.getByRole('option', {name: 'Georgia'}).click();

        await page.locator('input[name="zipcode"]').fill('31404');

        await page.getByRole('combobox', {name: /category/i}).click();
        await page.getByRole('option', {name: 'Painting'}).click();

        await page.locator('textarea[name="description"]').fill(`Playwright e2e exhibit ${Date.now()}.`);

        await page.getByRole('button', {name: 'Update Profile'}).click();
        // After save, stepper/dialog/alert may all mention the next step; use .first() to avoid strict-mode clashes.
        await expect(page.getByText(
            /Profile updated successfully|Please upload at least one (file|image)|Please pay (your|the artist) registration fee|you may still pay the artist registration fee/i,
        ).first()).toBeVisible({timeout: 20_000});
    });

    test('cannot open the admin artist list', async ({page}) => {
        await page.goto('/user', {waitUntil: 'domcontentloaded'});
        // Admin layout shows a loading shell before the unauthorized error renders.
        await expect(page.getByText(/Unauthorized|Admin access required/i)).toBeVisible({timeout: 20_000});
        await expect(page.getByRole('heading', {name: /Manage/})).toHaveCount(0);
    });

    test('shows the feature request checkbox after last-year exhibitor status', async ({page}) => {
        test.skip(!process.env.DATABASE_URL, 'DATABASE_URL is required to mark the test artist imported');

        await page.goto('/profile', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: 'Artist Profile'})).toBeVisible();

        const pg = await import('pg');
        const client = new pg.Client({connectionString: process.env.DATABASE_URL});
        await client.connect();
        try {
            await client.query(
                'UPDATE "user" SET status = $1 WHERE email = $2 AND "deletedAt" IS NULL',
                ['imported', E2E_ARTIST_EMAIL.toLowerCase()],
            );
        } finally {
            await client.end();
        }

        await page.goto('/profile/upload', {waitUntil: 'domcontentloaded'});
        await expect(page.getByText(/you can ask to feature a photo on the home page/i)).toBeVisible();
        await expect(page.getByText(/Checking the box and clicking Update Image sends a request/i)).toBeVisible();
    });

    test('uploads a photo and can delete it', async ({page}) => {
        test.setTimeout(90_000);
        await page.goto('/profile/upload', {waitUntil: 'domcontentloaded'});
        await expect(page.locator('#file-upload-multiple')).toBeAttached();
        await closeCompletionDialog(page);

        if (await page.getByRole('button', {name: 'Update Image'}).count()) {
            await page.getByRole('button', {name: 'Delete Image'}).click();
            await page.getByRole('dialog').getByRole('button', {name: 'Delete', exact: true}).click();
            await expect(page.getByRole('button', {name: 'Update Image'})).toHaveCount(0, {timeout: 20_000});
        }

        await page.locator('#file-upload-multiple').setInputFiles({
            name: 'playwright-e2e.png',
            mimeType: 'image/png',
            buffer: TINY_PNG,
        });
        await expect(page.getByText(/file has been uploaded/i)).toBeVisible({timeout: 30_000});
        await closeCompletionDialog(page);

        await expect(page.getByRole('button', {name: 'Update Image'})).toBeVisible({timeout: 15_000});
        await page.locator('input[name="title"]').fill('Playwright e2e sample');
        await page.getByRole('button', {name: 'Update Image'}).click();
        await expect(page.getByText(/updated successfully|request to feature/i).first()).toBeVisible({timeout: 20_000});

        await page.getByRole('button', {name: 'Delete Image'}).click();
        await page.getByRole('dialog').getByRole('button', {name: 'Delete', exact: true}).click();
        await expect(page.getByRole('button', {name: 'Update Image'})).toHaveCount(0, {timeout: 20_000});
    });

    test('profile pages have no WCAG A/AA violations, including contrast', async ({page}) => {
        await page.goto('/profile', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: 'Artist Profile'})).toBeVisible();
        await expectNoContrastViolations(page);
        await expectNoA11yViolations(page);

        await page.goto('/profile/edit', {waitUntil: 'domcontentloaded'});
        await expect(page.getByRole('heading', {name: /Edit Artist Profile|Artist Profile/i})).toBeVisible();
        await expectNoContrastViolations(page);
        await expectNoA11yViolations(page);
    });
});
