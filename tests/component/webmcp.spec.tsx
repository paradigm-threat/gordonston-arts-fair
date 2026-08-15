import {test, expect} from '@playwright/experimental-ct-react';
import {
    getModelContext,
    isGoToDestination,
    parseToolInput,
    GO_TO_PATHS,
} from '@util/webmcp';

test.describe('WebMCP helpers', () => {
    test('parseToolInput accepts objects and JSON strings', () => {
        expect(parseToolInput({destination: 'apply'})).toEqual({destination: 'apply'});
        expect(parseToolInput('{"destination":"profile"}')).toEqual({destination: 'profile'});
        expect(parseToolInput('not-json')).toEqual({});
        expect(parseToolInput(undefined)).toEqual({});
    });

    test('go_to destinations map to existing routes', () => {
        expect(isGoToDestination('pay-registration')).toBe(true);
        expect(isGoToDestination('stripe')).toBe(false);
        expect(GO_TO_PATHS.apply).toContain('/apply');
        expect(GO_TO_PATHS['pay-registration']).toBe('/payment/registration');
    });

    test('getModelContext is absent without WebMCP', () => {
        expect(getModelContext()).toBeUndefined();
    });
});
