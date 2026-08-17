import {createClerkClient} from '@clerk/backend';
import {clerk} from '@clerk/testing/playwright';
import type {Page} from '@playwright/test';

export const E2E_ARTIST_EMAIL = process.env.E2E_CLERK_ARTIST_EMAIL
    || 'playwright-artist+clerk_test@example.com';
export const E2E_ADMIN_EMAIL = process.env.E2E_CLERK_ADMIN_EMAIL
    || 'playwright-admin+clerk_test@example.com';
export const E2E_USER_PASSWORD = process.env.E2E_CLERK_USER_PASSWORD
    || 'PlaywrightE2E-424242!';

export function clerkTestSecretKey() {
    const secret = process.env.CLERK_SECRET_KEY_TEST || process.env.CLERK_SECRET_KEY || '';
    return secret.startsWith('sk_test_') ? secret : '';
}

export function clerkTestPublishableKey() {
    const publishable = process.env.CLERK_PUBLISHABLE_KEY
        || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_TEST
        || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        || '';
    return publishable.startsWith('pk_test_') ? publishable : '';
}

export function hasClerkTestKeys() {
    return Boolean(clerkTestSecretKey() && clerkTestPublishableKey());
}

export function applyClerkTestEnv() {
    const secret = clerkTestSecretKey();
    const publishable = clerkTestPublishableKey();
    if (secret) process.env.CLERK_SECRET_KEY = secret;
    if (publishable) process.env.CLERK_PUBLISHABLE_KEY = publishable;
}

export async function ensureClerkTestUser(options: {
    email: string;
    password: string;
    lastName: string;
    publicMetadata?: Record<string, unknown>;
}) {
    const client = createClerkClient({secretKey: clerkTestSecretKey()});
    const {data: users} = await client.users.getUserList({
        emailAddress: [options.email],
    });
    if (users.length === 0) {
        return client.users.createUser({
            emailAddress: [options.email],
            password: options.password,
            skipPasswordChecks: true,
            skipLegalChecks: true,
            legalAcceptedAt: new Date(),
            firstName: 'Playwright',
            lastName: options.lastName,
            publicMetadata: options.publicMetadata,
        });
    }
    const user = users[0];
    await client.users.updateUser(user.id, {
        password: options.password,
        skipPasswordChecks: true,
        firstName: 'Playwright',
        lastName: options.lastName,
    });
    if (options.publicMetadata) {
        await client.users.updateUserMetadata(user.id, {
            publicMetadata: options.publicMetadata,
        });
    }
    return user;
}

export async function signInTestUser(page: Page, email: string) {
    applyClerkTestEnv();
    await clerk.loaded({page});
    try {
        await clerk.signIn({page, emailAddress: email});
    } catch {
        await clerk.signIn({
            page,
            signInParams: {
                strategy: 'password',
                identifier: email,
                password: E2E_USER_PASSWORD,
            },
        });
    }
}
