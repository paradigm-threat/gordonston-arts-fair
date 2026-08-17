import {test, expect} from '@playwright/experimental-ct-react';
import {
    formatActorTokenError,
    impersonateRedirectPath,
    isAlreadySignedInError,
    ticketFromLocation,
} from '@util/impersonate';

test.describe('impersonation errors', () => {
    test('shows Clerk’s limit message only when the quota is exceeded', () => {
        expect(formatActorTokenError({
            errors: [{
                code: 'impersonation_limit_exceeded',
                long_message: 'Your application has reached the impersonation limit for your plan (%d/%d). The limit will reset at the beginning of the next billing period.',
                meta: {Used: 5, Limit: 5},
            }],
        })).toBe(
            'Your application has reached the impersonation limit for your plan (5/5). The limit will reset at the beginning of the next billing period.',
        );

        expect(formatActorTokenError({
            shortMessage: 'Impersonation limit exceeded',
            longMessage: 'Your application has reached the impersonation limit for your plan (%d/%d). The limit will reset at the beginning of the next billing period.',
            code: 'impersonation_limit_exceeded',
            meta: '{"Limit": 5, "Used": 5}',
        })).toBe(
            'Your application has reached the impersonation limit for your plan (5/5). The limit will reset at the beginning of the next billing period.',
        );
    });

    test('keeps other Clerk errors as-is', () => {
        expect(formatActorTokenError({
            errors: [{
                code: 'actor_token_cannot_be_revoked_code',
                long_message: 'Actor token cannot be revoked because its status is accepted.',
            }],
        })).toBe('Actor token cannot be revoked because its status is accepted.');
        expect(formatActorTokenError(null)).toBe('Clerk could not start impersonation.');
    });

    test('detects Clerk’s already-signed-in error', () => {
        expect(isAlreadySignedInError({
            errors: [{code: 'identifier_already_signed_in', message: "You're already signed in."}],
        })).toBe(true);
        expect(isAlreadySignedInError(new Error("You're already signed in."))).toBe(true);
        expect(isAlreadySignedInError({
            errors: [{code: 'impersonation_limit_exceeded'}],
        })).toBe(false);
    });

    test('reads the ticket from the fallback URL', () => {
        expect(ticketFromLocation('?ticket=abc%2Fdef', '')).toBe('abc/def');
        expect(ticketFromLocation('', '#abc%2Fdef')).toBe('abc/def');
        expect(impersonateRedirectPath('abc/def')).toBe('/impersonate?ticket=abc%2Fdef');
    });
});
