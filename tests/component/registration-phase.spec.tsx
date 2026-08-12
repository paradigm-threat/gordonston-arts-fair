import {test, expect} from '@playwright/experimental-ct-react';
import {
    getApplicationStatusText,
    getRegistrationPhase,
    isRegistrationCheckoutAllowed,
} from '@util/date';
import {ArtistStepper} from '@components/User/ArtistStepper';
import ApplicationsClosedInfo from '@components/Info/ApplicationsClosedInfo';

const ORIGINAL_ENV = {
    open: process.env.NEXT_PUBLIC_REGISTRATION_OPEN_DATE,
    end: process.env.NEXT_PUBLIC_REGISTRATION_END_DATE,
    event: process.env.NEXT_PUBLIC_EVENT_DATE,
};

function setRegistrationWindow(openDate: string, endDate: string) {
    process.env.NEXT_PUBLIC_REGISTRATION_OPEN_DATE = openDate;
    process.env.NEXT_PUBLIC_REGISTRATION_END_DATE = endDate;
    process.env.NEXT_PUBLIC_EVENT_DATE = '2027-03-06 12:00:00';
}

test.afterEach(() => {
    process.env.NEXT_PUBLIC_REGISTRATION_OPEN_DATE = ORIGINAL_ENV.open;
    process.env.NEXT_PUBLIC_REGISTRATION_END_DATE = ORIGINAL_ENV.end;
    process.env.NEXT_PUBLIC_EVENT_DATE = ORIGINAL_ENV.event;
});

test.describe('registration phase helpers', () => {
    test('returns not-yet-open before the open date', async () => {
        setRegistrationWindow('2099-08-15 12:00:00', '2099-10-01 12:00:00');
        expect(getRegistrationPhase(new Date('2099-08-01T12:00:00'))).toBe('not-yet-open');
        expect(getApplicationStatusText(new Date('2099-08-01T12:00:00'))).toMatch(/Applications open/);
    });

    test('returns open inside the registration window', async () => {
        setRegistrationWindow('2020-01-01 12:00:00', '2099-10-01 12:00:00');
        expect(getRegistrationPhase(new Date('2026-08-12T12:00:00'))).toBe('open');
        expect(getApplicationStatusText(new Date('2026-08-12T12:00:00'))).toMatch(/Applications open until/);
    });

    test('returns closed after the end date', async () => {
        setRegistrationWindow('2020-01-01 12:00:00', '2020-10-01 12:00:00');
        expect(getRegistrationPhase(new Date('2020-10-03T12:00:00'))).toBe('closed');
        expect(getApplicationStatusText(new Date('2020-10-03T12:00:00'))).toMatch(/closed/i);
        expect(isRegistrationCheckoutAllowed(new Date('2020-10-03T12:00:00'))).toBe(false);
    });

    test('allows checkout only while registration is open', async () => {
        setRegistrationWindow('2020-01-01 12:00:00', '2099-10-01 12:00:00');
        expect(isRegistrationCheckoutAllowed(new Date('2019-12-01T12:00:00'))).toBe(false);
        expect(isRegistrationCheckoutAllowed(new Date('2026-08-12T12:00:00'))).toBe(true);
    });
});

test.describe('ArtistStepper submission gate', () => {
    const completeProfile = {
        status: 'registered' as const,
        message: 'Profile complete',
        complete: true,
        formFilled: true,
        action: 'pay-fee-registration' as const,
    };

    test('does not push payment before submissions open', async ({mount, page}) => {
        await mount(
            <ArtistStepper
                profileStatus={completeProfile}
                showAlert
                now={new Date('2020-01-01T12:00:00')}
            />
        );

        // With default .env open date in 2026+, 2020 is before open → saved profile messaging
        await expect(page.getByText(/Your profile is saved/i)).toBeVisible();
        await expect(page.getByText(/Application submission opens/i)).toBeVisible();
        await expect(page.getByText(/pay the Registration Fee/i)).toHaveCount(0);
    });

    test('asks for registration fee while submissions are open', async ({mount, page}) => {
        await mount(
            <ArtistStepper
                profileStatus={completeProfile}
                showAlert
                now={new Date('2026-09-01T12:00:00')}
            />
        );

        await expect(page.getByText(/pay the artist registration fee/i)).toBeVisible();
        await expect(page.getByText(/pay the Registration Fee/i)).toBeVisible();
    });
});

test.describe('ApplicationsClosedInfo', () => {
    test('explains submissions are not open yet', async ({mount, page}) => {
        await mount(<ApplicationsClosedInfo now={new Date('2020-01-01T12:00:00')} />);

        await expect(page.getByText(/not open for submission yet/i)).toBeVisible();
        await expect(page.getByText(/save your profile and uploads/i)).toBeVisible();
    });

    test('explains applications are closed after the window', async ({mount, page}) => {
        await mount(<ApplicationsClosedInfo now={new Date('2099-12-01T12:00:00')} />);

        await expect(page.getByText(/Applications are closed/i)).toBeVisible();
    });
});
