import {test, expect} from '@playwright/experimental-ct-react';
import Checkout from '@components/Payment/Checkout';

test.describe('Checkout component', () => {
    test('renders checkout UI', async ({mount, page}) => {
        await mount(
            <Checkout
                stripePublishableKey="pk_test_mock"
                feeType="registration"
                feeText="Registration fee is $15"
                buttonText="Pay Now"
                disabled={false}
                publicEmail="artist@example.com"
            />
        );

        await expect(page.getByRole('heading', {name: 'Checkout'})).toBeVisible();
        await expect(page.getByRole('button', {name: 'Pay Now'})).toBeVisible();
        await expect(page.getByText(/Registration fee is \$15/)).toBeVisible();
    });

    test('shows API error from mocked checkout endpoint', async ({mount, page}) => {
        await page.route('**/api/checkout-sessions-public/**', async (route) => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({message: 'Mock checkout failed'}),
            });
        });
        await page.route('https://js.stripe.com/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: 'window.Stripe = () => ({ redirectToCheckout: async () => ({}) });',
            });
        });

        await mount(
            <Checkout
                stripePublishableKey="pk_test_mock"
                feeType="registration"
                feeText="Registration fee is $15"
                buttonText="Pay Now"
                publicEmail="artist@example.com"
            />
        );

        await page.getByRole('button', {name: 'Pay Now'}).click();
        await expect(page.getByText('Mock checkout failed')).toBeVisible();
    });

    test('shows a fallback when checkout returns non-JSON', async ({mount, page}) => {
        await page.route('**/api/checkout-sessions-public/**', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'text/html',
                body: '<html>Internal Server Error</html>',
            });
        });
        await page.route('https://js.stripe.com/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: 'window.Stripe = () => ({ redirectToCheckout: async () => ({}) });',
            });
        });

        await mount(
            <Checkout
                stripePublishableKey="pk_test_mock"
                feeType="registration"
                feeText="Registration fee is $15"
                buttonText="Pay Now"
                publicEmail="artist@example.com"
            />
        );

        await page.getByRole('button', {name: 'Pay Now'}).click();
        await expect(page.getByText(/Checkout failed \(500\)/)).toBeVisible();
    });
});
