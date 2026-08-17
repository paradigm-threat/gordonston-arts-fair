import {clerkSetup} from '@clerk/testing/playwright';
import {test as setup} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
    applyClerkTestEnv,
    E2E_ADMIN_EMAIL,
    E2E_ARTIST_EMAIL,
    E2E_USER_PASSWORD,
    ensureClerkTestUser,
    hasClerkTestKeys,
    signInTestUser,
} from './helpers/clerkUsers';

setup.describe.configure({mode: 'serial'});

const clerkDir = path.join(__dirname, '../../playwright/.clerk');
const artistState = path.join(clerkDir, 'artist.json');
const adminState = path.join(clerkDir, 'admin.json');

setup('create Clerk testing token and users', async () => {
    if (!hasClerkTestKeys()) {
        throw new Error('Clerk test keys (pk_test_ / sk_test_) are required for authenticated e2e.');
    }
    applyClerkTestEnv();
    await clerkSetup({dotenv: false});
    fs.mkdirSync(clerkDir, {recursive: true});

    await ensureClerkTestUser({
        email: E2E_ARTIST_EMAIL,
        password: E2E_USER_PASSWORD,
        lastName: 'Artist',
        publicMetadata: {type: 'user'},
    });
    await ensureClerkTestUser({
        email: E2E_ADMIN_EMAIL,
        password: E2E_USER_PASSWORD,
        lastName: 'Admin',
        publicMetadata: {type: 'admin'},
    });
});

setup('authenticate artist', async ({page}) => {
    applyClerkTestEnv();
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    await signInTestUser(page, E2E_ARTIST_EMAIL);
    await page.goto('/profile', {waitUntil: 'domcontentloaded'});
    await page.getByRole('heading', {name: 'Artist Profile'}).waitFor({timeout: 30_000});
    await page.context().storageState({path: artistState});
});

setup('authenticate admin', async ({page}) => {
    applyClerkTestEnv();
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    await signInTestUser(page, E2E_ADMIN_EMAIL);
    await page.goto('/user', {waitUntil: 'domcontentloaded'});
    await page.getByRole('heading', {name: /Manage/}).waitFor({timeout: 30_000});
    await page.context().storageState({path: adminState});
});
