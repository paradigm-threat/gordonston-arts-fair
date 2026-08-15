import {test, expect} from '@playwright/experimental-ct-react';
import {AppearanceSelect} from '@components/Theme/AppearanceSelect';
import {resolveAppearance} from '@util/appearance';

test.describe('appearance helpers', () => {
    test('system follows the OS preference', () => {
        expect(resolveAppearance('system', false)).toBe('light');
        expect(resolveAppearance('system', true)).toBe('dark');
        expect(resolveAppearance('light', true)).toBe('light');
        expect(resolveAppearance('dark', false)).toBe('dark');
    });
});

test.describe('AppearanceSelect', () => {
    test('offers System default, Light, and Dark', async ({mount, page}) => {
        await mount(<AppearanceSelect />);

        const appearance = page.getByRole('group', {name: 'Appearance'});
        await expect(appearance).toBeVisible();
        await expect(appearance).toHaveAttribute('data-hydrated', 'true');
        await expect(appearance.getByRole('button', {name: 'System default'})).toHaveAttribute('aria-pressed', 'true');
        await appearance.getByRole('button', {name: 'Dark'}).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await appearance.getByRole('button', {name: 'Light'}).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    });
});
