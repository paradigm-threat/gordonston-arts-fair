import {test, expect} from '@playwright/experimental-ct-react';
import {ArtistStepper} from '@components/User/ArtistStepper';

test.describe('ArtistStepper', () => {
    test('renders registration step state', async ({mount, page}) => {
        await mount(
            <ArtistStepper
                profileStatus={{
                    status: 'registered',
                    message: 'Please upload at least one file',
                    complete: true,
                    formFilled: true,
                    action: 'upload-files',
                }}
                showAlert
                now={new Date('2026-09-01T12:00:00')}
            />
        );

        await expect(page.getByText('Photos', {exact: true})).toBeVisible();
        await expect(page.getByText('Approval', {exact: true})).toHaveCount(0);
        await expect(page.getByText('Booth Fee', {exact: true})).toHaveCount(0);
        await expect(page.getByText(/pay the artist registration fee/i)).toBeVisible();
    });

    test('asks returning imported artists to pay this year', async ({mount, page}) => {
        await mount(
            <ArtistStepper
                profileStatus={{
                    status: 'imported',
                    message: 'Please pay your registration fee to submit your profile for approval.',
                    complete: true,
                    formFilled: true,
                    action: 'pay-fee-registration',
                }}
                showAlert
                now={new Date('2026-09-01T12:00:00')}
            />
        );

        await expect(page.getByText(/pay the artist registration fee/i)).toBeVisible();
        await expect(page.getByText(/pay the Registration Fee/i)).toBeVisible();
        await expect(page.getByText('Approval', {exact: true})).toHaveCount(0);
        await expect(page.getByText('Booth Fee', {exact: true})).toHaveCount(0);
    });

    test('shows approval after the artist has submitted', async ({mount, page}) => {
        await mount(
            <ArtistStepper
                profileStatus={{
                    status: 'submitted',
                    message: 'Your profile is pending approval. Please wait for approval.',
                    complete: true,
                    formFilled: true,
                }}
                showAlert
                now={new Date('2026-09-01T12:00:00')}
            />
        );

        await expect(page.getByText('Approval', {exact: true})).toBeVisible();
        await expect(page.getByText('Booth Fee', {exact: true})).toHaveCount(0);
        await expect(page.getByText(/wait for approval/i)).toBeVisible();
    });
});
