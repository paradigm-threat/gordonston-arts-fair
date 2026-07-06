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
            />
        );

        await expect(page.getByText('Upload Images')).toBeVisible();
    });
});
