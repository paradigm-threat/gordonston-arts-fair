import {test, expect} from '@playwright/experimental-ct-react';
import {MenuItem} from '@mui/material';
import {AdminSelect} from '@components/Admin/AdminSelect';
import {PaginationLinks} from '@components/Pagination/PaginationLinks';
import SelectField from '@components/FormFields/SelectField';

test.describe('Admin filters', () => {
    test('status filter is a labeled dropdown', async ({mount, page}) => {
        await mount(
            <AdminSelect
                id="artist-status-filter"
                label="Status"
                value="all"
                onChange={() => undefined}
                options={[
                    {value: 'all', label: 'All statuses'},
                    {value: 'registered', label: 'Registered'},
                ]}
            />
        );

        await expect(page.getByLabel('Status')).toBeVisible();
        await expect(page.getByRole('button', {name: 'All'})).toHaveCount(0);
    });

    test('pagination uses a page dropdown instead of numbered buttons', async ({mount, page}) => {
        await mount(
            <PaginationLinks
                page={1}
                pageCount={3}
                setPage={() => undefined}
            />
        );

        await expect(page.getByRole('button', {name: 'Previous'})).toBeVisible();
        await expect(page.getByRole('button', {name: 'Next'})).toBeVisible();
        await expect(page.getByLabel('Page')).toBeVisible();
        await expect(page.getByRole('button', {name: '1', exact: true})).toHaveCount(0);
    });

    test('status editor dropdown uses a valid label id', async ({mount, page}) => {
        await mount(
            <SelectField name="status" label="Select new status" value="registered">
                <MenuItem value="registered">Registered</MenuItem>
            </SelectField>
        );

        await expect(page.getByLabel('Select new status')).toBeVisible();
        await expect(page.locator('#status-label')).toHaveText('Select new status');
    });
});
