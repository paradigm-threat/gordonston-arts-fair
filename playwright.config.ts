import {defineConfig, devices} from '@playwright/test';
import path from 'node:path';
import dotenv from 'dotenv';
import {clerkSetup} from '@clerk/testing/playwright';
import {
    applyClerkTestEnv,
    clerkTestPublishableKey,
    clerkTestSecretKey,
    hasClerkTestKeys,
} from './tests/e2e/helpers/clerkUsers';

dotenv.config({path: path.resolve(__dirname, '.env')});
dotenv.config({path: path.resolve(__dirname, '.env.local')});
applyClerkTestEnv();

const PORT = process.env.PLAYWRIGHT_PORT || '3333';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;
const clerkAuth = hasClerkTestKeys();
const chrome = {...devices['Desktop Chrome']};

export default (async () => {
    if (clerkAuth) {
        await clerkSetup({dotenv: false});
    }

    return defineConfig({
        testDir: './tests/e2e',
        fullyParallel: true,
        forbidOnly: !!process.env.CI,
        retries: process.env.CI ? 2 : 1,
        // Clerk + Next webServer are flaky under parallel workers (ERR_ABORTED / auth races).
        workers: 1,
        timeout: 60_000,
        reporter: process.env.CI
            ? [['list'], ['junit', {outputFile: 'test-results/junit.xml'}], ['html', {open: 'never'}]]
            : [['list'], ['html', {open: 'never'}]],
        use: {
            baseURL,
            trace: 'on-first-retry',
            screenshot: 'only-on-failure',
        },
        projects: [
            {
                name: 'chromium',
                use: chrome,
                testIgnore: /global\.setup|authenticated|clerk-signin/,
            },
            ...(clerkAuth
                ? [
                    {
                        name: 'setup',
                        testMatch: /global\.setup\.ts/,
                        use: chrome,
                        timeout: 120_000,
                    },
                    {
                        name: 'clerk',
                        testMatch: /clerk-signin\.spec\.ts/,
                        use: chrome,
                        dependencies: ['setup'],
                    },
                    {
                        name: 'artist',
                        testMatch: /artist\.authenticated\.spec\.ts/,
                        use: {
                            ...chrome,
                            storageState: 'playwright/.clerk/artist.json',
                        },
                        dependencies: ['setup'],
                    },
                    {
                        name: 'admin',
                        testMatch: /admin\.authenticated\.spec\.ts/,
                        use: {
                            ...chrome,
                            storageState: 'playwright/.clerk/admin.json',
                        },
                        dependencies: ['setup'],
                    },
                ]
                : []),
        ],
        webServer: {
            command: `npm run dev -- --port ${PORT}`,
            url: baseURL,
            reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === '1',
            timeout: 120_000,
            env: {
                ...process.env,
                CLERK_SECRET_KEY: clerkTestSecretKey() || process.env.CLERK_SECRET_KEY || '',
                NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
                    clerkTestPublishableKey() || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
            },
        },
    });
})();
