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

        await expect(page.getByText('Upload Images')).toBeVisible();
        await expect(page.getByText(/pay the artist registration fee/i)).toBeVisible();
    });
});
