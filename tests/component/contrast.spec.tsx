import {test, expect} from '@playwright/experimental-ct-react';
import {EditProfileLink} from '@components/Admin/EditProfileLink';
import {expectNoContrastViolations} from '../helpers/a11y';

test.describe('color contrast', () => {
    test('gold headings and gold buttons pass WCAG contrast in light mode', async ({mount, page}) => {
        await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
        await mount(
            <main>
                <h1 className="m-auto text-[color:var(--gold-color)] italic">Manage an Artist</h1>
                <EditProfileLink href="/user/1/edit" label="Edit profile" />
                <EditProfileLink href="/user/1/edit#photos" label="Edit photos" variant="photos" />
                <button type="button" className="gold-button rounded px-4 py-2">Continue</button>
                <button type="button" className="featured-slide-btn">Next artwork</button>
            </main>
        );

        await expect(page.getByRole('heading', {name: 'Manage an Artist'})).toBeVisible();
        await expectNoContrastViolations(page, {include: '#root'});
    });

    test('gold headings and gold buttons pass WCAG contrast in dark mode', async ({mount, page}) => {
        await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
        await mount(
            <main style={{background: '#252422', color: '#f4f0e8', padding: '1.5rem'}}>
                <h1 className="m-auto text-[color:var(--gold-color)] italic">Manage an Artist</h1>
                <EditProfileLink href="/user/1/edit" label="Edit profile" />
                <button type="button" className="gold-button rounded px-4 py-2">Continue</button>
                <button type="button" className="featured-slide-btn">Next artwork</button>
            </main>
        );

        await expect(page.getByRole('heading', {name: 'Manage an Artist'})).toBeVisible();
        await expectNoContrastViolations(page, {include: '#root'});
    });
});
