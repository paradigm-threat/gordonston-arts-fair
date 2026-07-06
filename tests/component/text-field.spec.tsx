import {test, expect} from '@playwright/experimental-ct-react';
import TextField from '@components/FormFields/TextField';

test.describe('TextField', () => {
    test('renders labeled input', async ({mount, page}) => {
        await mount(
            <TextField
                name="test"
                label="Test Field"
                defaultValue=""
                onChange={() => undefined}
            />
        );

        await expect(page.getByRole('textbox', {name: 'Test Field'})).toBeVisible();
    });
});
