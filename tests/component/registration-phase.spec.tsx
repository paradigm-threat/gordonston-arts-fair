import {test, expect} from '@playwright/experimental-ct-react';
import {
    getApplicationStatusText,
    getLastFairYear,
    getRegistrationPhase,
    isRegistrationCheckoutAllowed,
} from '@util/date';
import {ArtistStepper} from '@components/User/ArtistStepper';
import ApplicationsClosedInfo from '@components/Info/ApplicationsClosedInfo';
import {
    ApplicationStatusText,
    WhenRegistrationPhase,
} from '@components/Info/WhenRegistrationPhase';
import {
    hasPaidBoothThisCycle,
    hasPaidRegistrationThisCycle,
    hasPriorCycleRegistrationPayment,
    canRequestWebsiteFeature,
} from '@util/payments';

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
        expect(getLastFairYear()).toBe(2026);
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

test.describe('WhenRegistrationPhase', () => {
    test('renders only the matching registration-phase copy', async ({mount, page}) => {
        await mount(
            <>
                <WhenRegistrationPhase phase="not-yet-open" now={new Date('2020-01-01T12:00:00')}>
                    <span>pre-window copy</span>
                </WhenRegistrationPhase>
                <WhenRegistrationPhase phase="open" now={new Date('2020-01-01T12:00:00')}>
                    <span>in-window copy</span>
                </WhenRegistrationPhase>
            </>
        );

        await expect(page.getByText('pre-window copy')).toBeVisible();
        await expect(page.getByText('in-window copy')).toHaveCount(0);
    });

    test('shows open-window status text during the application period', async ({mount, page}) => {
        await mount(<ApplicationStatusText now={new Date('2026-09-01T12:00:00')} />);

        await expect(page.getByText(/Applications open until/i)).toBeVisible();
    });
});

test.describe('fee cycle helpers', () => {
    test.beforeEach(() => {
        setRegistrationWindow('2026-08-15 12:00:00', '2026-10-01 12:00:00');
    });

    test('ignores last year registration payments for returning artists', async () => {
        const lastYear = [{
            type: 'charge.succeeded' as const,
            amount: '15.00',
            createdAt: '2025-09-04T16:57:18.886Z',
        }];

        expect(hasPaidRegistrationThisCycle(lastYear, 'registered')).toBe(false);
        expect(hasPaidRegistrationThisCycle(lastYear, 'imported')).toBe(false);
        expect(hasPriorCycleRegistrationPayment(lastYear)).toBe(true);
    });

    test('counts this-cycle registration payments and submitted status', async () => {
        const thisCycle = [{
            type: 'charge.succeeded' as const,
            amount: '15.00',
            createdAt: '2026-08-15T13:16:16.279Z',
        }];

        expect(hasPaidRegistrationThisCycle(thisCycle, 'registered')).toBe(true);
        expect(hasPaidRegistrationThisCycle([], 'submitted')).toBe(true);
        expect(hasPriorCycleRegistrationPayment(thisCycle)).toBe(false);
    });

    test('ignores last year booth payments until this cycle is paid', async () => {
        const lastYearBooth = [{
            type: 'charge.succeeded' as const,
            amount: '85.00',
            createdAt: '2025-12-30T19:53:09.536Z',
        }];

        expect(hasPaidBoothThisCycle(lastYearBooth, 'approved')).toBe(false);
        expect(hasPaidBoothThisCycle(lastYearBooth, 'paid')).toBe(true);
    });

    test('counts last-year exhibitors for homepage feature requests', async () => {
        const lastYearReg = [{
            type: 'charge.succeeded' as const,
            amount: '15.00',
            createdAt: '2025-09-04T16:57:18.886Z',
        }];
        const lastYearBooth = [{
            type: 'charge.succeeded' as const,
            amount: '85.00',
            createdAt: '2025-12-30T19:53:09.536Z',
        }];
        const thisCycleOnly = [{
            type: 'charge.succeeded' as const,
            amount: '15.00',
            createdAt: '2026-08-15T13:16:16.279Z',
        }];

        expect(canRequestWebsiteFeature([], 'imported')).toBe(true);
        expect(canRequestWebsiteFeature(lastYearReg, 'registered')).toBe(true);
        expect(canRequestWebsiteFeature(lastYearBooth, 'registered')).toBe(true);
        expect(canRequestWebsiteFeature(thisCycleOnly, 'registered')).toBe(false);
        expect(canRequestWebsiteFeature(thisCycleOnly, 'submitted')).toBe(false);
        expect(canRequestWebsiteFeature([], 'paid')).toBe(false);
    });
});
