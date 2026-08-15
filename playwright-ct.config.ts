import {defineConfig, devices} from '@playwright/experimental-ct-react';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({path: path.resolve(__dirname, '.env')});

const publicEnv = {
    NEXT_PUBLIC_EVENT_DATE: process.env.NEXT_PUBLIC_EVENT_DATE ?? '',
    NEXT_PUBLIC_REGISTRATION_OPEN_DATE: process.env.NEXT_PUBLIC_REGISTRATION_OPEN_DATE ?? '',
    NEXT_PUBLIC_REGISTRATION_END_DATE: process.env.NEXT_PUBLIC_REGISTRATION_END_DATE ?? '',
    NEXT_PUBLIC_REGISTRATION_FEE_DATE: process.env.NEXT_PUBLIC_REGISTRATION_FEE_DATE ?? '',
    NEXT_PUBLIC_NOTIFY_DATE: process.env.NEXT_PUBLIC_NOTIFY_DATE ?? '',
    NEXT_PUBLIC_REGISTRATION_FEE: process.env.NEXT_PUBLIC_REGISTRATION_FEE ?? '',
    NEXT_PUBLIC_BOOTH_FEE: process.env.NEXT_PUBLIC_BOOTH_FEE ?? '',
};

export default defineConfig({
    testDir: './tests/component',
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    timeout: 60_000,
    use: {
        trace: 'on-first-retry',
        ctPort: 3100,
        ctTemplateDir: './playwright',
        ctViteConfig: {
            define: Object.fromEntries(
                Object.entries(publicEnv).map(([key, value]) => [
                    `process.env.${key}`,
                    JSON.stringify(value),
                ])
            ),
            resolve: {
                alias: [
                    {
                        find: '@util/logActions',
                        replacement: path.resolve(__dirname, './tests/mocks/logActions.ts'),
                    },
                    {find: '@components', replacement: path.resolve(__dirname, './components')},
                    {find: '@util', replacement: path.resolve(__dirname, './util')},
                    {find: '@types', replacement: path.resolve(__dirname, './types.ts')},
                    {find: '@template', replacement: path.resolve(__dirname, './template')},
                    {find: '@fragments', replacement: path.resolve(__dirname, './fragments')},
                    {find: '@app', replacement: path.resolve(__dirname, './app')},
                    {
                        find: 'next/navigation',
                        replacement: path.resolve(__dirname, './tests/mocks/next-navigation.ts'),
                    },
                    {
                        find: 'next/link',
                        replacement: path.resolve(__dirname, './tests/mocks/next-link.tsx'),
                    },
                ],
            },
        },
    },
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
        },
    ],
});
