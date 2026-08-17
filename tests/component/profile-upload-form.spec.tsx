import {test, expect} from '@playwright/experimental-ct-react';
import {ProfileUploadForm} from '@components/User/ProfileUploadForm';
import {ProfileUploads} from '@components/User/ProfileUploads';
import type {IProfileStatus} from '@util/profile';
import type {UserFileUploadModel} from '@util/models';

const profileStatus: IProfileStatus = {
    status: 'imported',
    message: 'ok',
    complete: true,
    formFilled: true,
};

const baseUpload = {
    id: 41,
    user_id: 7,
    title: 'River Light',
    description: 'Oil on canvas from last year.',
    url: '/img/Gates-of-Gordonston-B-W.jpg',
    width: 800,
    height: 600,
    feature: false,
    featureApproved: false,
    featureDeclined: false,
} as unknown as UserFileUploadModel;

test.describe('Artist featured-photo request', () => {
    test('eligible artists get a request checkbox that does not publish immediately', async ({mount, page}) => {
        await mount(
            <table>
                <tbody>
                    <ProfileUploadForm
                        fileUpload={baseUpload}
                        lastFairYear={2026}
                        canRequestFeature
                        updateFile={async () => ({result: profileStatus, message: 'ok'})}
                        deleteFile={async () => ({result: profileStatus, message: 'ok'})}
                    />
                </tbody>
            </table>
        );

        await expect(page.getByRole('checkbox', {
            name: /Ask to feature this image on the 2026 Art Fair home page/i,
        })).toBeVisible();
        await expect(page.getByText(/Checking the box does not put the photo on the site/i)).toBeVisible();
        await expect(page.getByRole('button', {name: 'Update Image'})).toBeVisible();
    });

    test('pending requests stay off the home page until review', async ({mount, page}) => {
        await mount(
            <table>
                <tbody>
                    <ProfileUploadForm
                        fileUpload={{...baseUpload, feature: true}}
                        lastFairYear={2026}
                        canRequestFeature
                        updateFile={async () => ({result: profileStatus, message: 'ok'})}
                        deleteFile={async () => ({result: profileStatus, message: 'ok'})}
                    />
                </tbody>
            </table>
        );

        await expect(page.getByText(/This photo is not on the home page until an organizer reviews it/i)).toBeVisible();
    });

    test('hides the request checkbox for artists who did not exhibit last year', async ({mount, page}) => {
        await mount(
            <table>
                <tbody>
                    <ProfileUploadForm
                        fileUpload={baseUpload}
                        lastFairYear={2026}
                        canRequestFeature={false}
                        updateFile={async () => ({result: profileStatus, message: 'ok'})}
                        deleteFile={async () => ({result: profileStatus, message: 'ok'})}
                    />
                </tbody>
            </table>
        );

        await expect(page.getByRole('checkbox', {name: /feature this image/i})).toHaveCount(0);
    });
});

test.describe('Multi-image upload control', () => {
    test('keeps the multiple-image button', async ({mount, page}) => {
        await mount(
            <ProfileUploads
                userUploads={[]}
                uploadFile={async () => ({result: profileStatus, message: 'ok'})}
                updateFile={async () => ({result: profileStatus, message: 'ok'})}
                deleteFile={async () => ({result: profileStatus, message: 'ok'})}
            />
        );

        await expect(page.getByRole('button', {name: /Click here to Upload multiple images/i})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Choose photos of your work'})).toBeVisible();
        await expect(page.getByText('JPG or phone photos are fine.')).toBeVisible();
    });

    test('keeps a visible preview even for a tiny stored image', async ({mount, page}) => {
        await mount(
            <table>
                <tbody>
                    <ProfileUploadForm
                        fileUpload={{...baseUpload, width: 1, height: 1}}
                        lastFairYear={2026}
                        canRequestFeature={false}
                        updateFile={async () => ({result: profileStatus, message: 'ok'})}
                        deleteFile={async () => ({result: profileStatus, message: 'ok'})}
                    />
                </tbody>
            </table>,
        );

        const preview = page.getByRole('img', {name: 'River Light'});
        await expect(preview).toBeVisible();
        const box = await preview.boundingBox();
        expect(box).toBeTruthy();
        expect(box!.width).toBeGreaterThan(80);
        expect(box!.height).toBeGreaterThan(80);
    });
});
