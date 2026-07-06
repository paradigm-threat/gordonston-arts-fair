import type {Page, Route} from '@playwright/test';

export async function mockStripeJs(page: Page) {
    await page.route('https://js.stripe.com/**', async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/javascript',
            body: `
                window.Stripe = function() {
                    return {
                        redirectToCheckout: async () => ({ error: null }),
                    };
                };
            `,
        });
    });
}

export async function mockCheckoutSessionApi(
    page: Page,
    options: {
        endpoint?: string;
        status?: number;
        body?: Record<string, unknown>;
    } = {}
) {
    const {
        endpoint = '**/api/checkout-sessions-public/**',
        status = 200,
        body = {sessionId: 'cs_test_mock_session'},
    } = options;

    await page.route(endpoint, async (route: Route) => {
        if (route.request().method() !== 'POST') {
            await route.continue();
            return;
        }
        await route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(body),
        });
    });
}

export async function mockCheckoutSessionError(page: Page, message: string) {
    await mockCheckoutSessionApi(page, {
        status: 400,
        body: {message},
    });
}
