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

        const select = page.getByLabel('Appearance');
        await expect(select).toBeVisible();
        await expect(select).toHaveValue('system');
        await select.selectOption('dark');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await select.selectOption('light');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    });
});
