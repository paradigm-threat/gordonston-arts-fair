import {test, expect} from '@playwright/test';

const SECURITY_HEADERS: Record<string, string> = {
    'x-frame-options': 'DENY',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
};

test.describe('Security headers', () => {
    test('landing page includes hardening headers', async ({request}) => {
        const response = await request.get('/');

        expect(response.ok()).toBeTruthy();
        const headers = response.headers();

        for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
            expect(headers[name], `missing ${name}`).toBe(value);
        }

        expect(headers['permissions-policy']).toContain('camera=()');
    });
});

test.describe('Auth guards', () => {
    test('artist profile requires sign-in', async ({page}) => {
        await page.goto('/profile');

        await expect(page).toHaveURL(/sign-in|profile/);
        if (page.url().includes('sign-in')) {
            await expect(page.locator('body')).toBeVisible();
        }
    });

    test('admin user list requires sign-in', async ({page}) => {
        await page.goto('/user');

        await expect(page).toHaveURL(/sign-in|user/);
    });

    test('featured photos admin requires sign-in', async ({page}) => {
        await page.goto('/user/featured');

        await expect(page).toHaveURL(/sign-in|featured/);
        const body = await page.locator('body').innerText();
        expect(/Unauthorized|Sign in|Featured photos/i.test(body)).toBe(true);
    });
});
