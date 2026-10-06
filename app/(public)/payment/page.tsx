import React from 'react';
import Checkout from '@components/Payment/Checkout';
import {fetchOrCreateProfileByEmail} from '@util/profileActions';
import {fetchTransactions} from '@util/transActions';
import {UserModel} from "@util/models";
import process from "node:process";
import {Typography} from "@mui/material";
import ApplicationsClosedInfo from '@components/Info/ApplicationsClosedInfo';
import {
    formatEasternEndOfDayDeadline,
    getRegistrationPaymentGraceDate,
    getRegistrationPhase,
    isRegistrationCheckoutAllowedForUser,
} from '@util/date';
import {hasPaidBoothThisCycle, hasPaidRegistrationThisCycle} from '@util/payments';

export const metadata = {
    title: 'Artist Payment',
};

const stripePublishableKey = `${process.env.TEST_MODE === 'false'
    ? process.env.STRIPE_PUBLISHABLE_KEY_LIVE
    : process.env.STRIPE_PUBLISHABLE_KEY_TEST}`;

function getDisplayName(user: UserModel, fallbackEmail: string) {
    const first = (user.first_name || '').trim();
    const last = (user.last_name || '').trim();
    const company = (user.company_name || '').trim();
    const name = company || [first, last].filter(Boolean).join(' ').trim();
    return name || fallbackEmail;
}

export default async function PublicPaymentPage({
                                                    searchParams,
                                                }: {
    searchParams: Promise<{ email?: string }>;
}) {
    const {email: emailUntrimmed} = await searchParams;
    const email = emailUntrimmed?.trim().toLowerCase();

    if (!email) {
        // Render simple email capture form
        return (
            <div className="mx-auto max-w-xl p-4">
                <h1 className="mb-4 text-[color:var(--gold-color)] italic">Artist Payment</h1>
                <p className="mb-4">Enter the artist email to make a payment for that artist.</p>
                <form method="get" action="/payment" className="flex gap-2">
                    <input
                        type="email"
                        name="email"
                        required
                        placeholder="artist@example.com"
                        className="flex-1 rounded border px-3 py-2"
                    />
                    <button type="submit" className="gold-button rounded px-4 py-2">
                        Continue
                    </button>
                </form>
            </div>
        );
    }

    const userProfile = await fetchOrCreateProfileByEmail(email);
    const transactions = await fetchTransactions(userProfile.id);
    const registrationPhase = getRegistrationPhase();

    const registrationFee = parseInt(`${process.env.NEXT_PUBLIC_REGISTRATION_FEE}`, 10);
    const boothFee = parseInt(`${process.env.NEXT_PUBLIC_BOOTH_FEE}`, 10);
    const boothDoubleFee = parseInt(`${process.env.NEXT_PUBLIC_BOOTH_DOUBLE_FEE}`, 10);

    const hasPaidRegistration = hasPaidRegistrationThisCycle(transactions, userProfile.status);
    const hasPaidBooth = hasPaidBoothThisCycle(transactions, userProfile.status);

    const registrationCheckoutAllowed = isRegistrationCheckoutAllowedForUser(userProfile);
    const showRegistrationButton = !hasPaidRegistration && registrationCheckoutAllowed;
    const showBoothButton = hasPaidRegistration && !hasPaidBooth && userProfile.status === 'approved';
    const graceDate = getRegistrationPaymentGraceDate();

    const artistName = getDisplayName(userProfile, email);

    if (!hasPaidRegistration && !registrationCheckoutAllowed) {
        return (
            <div className="mx-auto max-w-xl p-4">
                <h1 className="mb-2 text-[color:var(--gold-color)] italic">Artist Payment</h1>
                <p className="mb-4">Artist: <span className="font-semibold">{artistName}</span></p>
                <ApplicationsClosedInfo />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl p-4">
            <h1 className="mb-2 text-[color:var(--gold-color)] italic">Artist Payment</h1>
            <p className="mb-6">Artist: <span className="font-semibold">{artistName}</span></p>

            {registrationPhase === 'closed' && showRegistrationButton && graceDate && (
                <p className="mb-4">
                    Applications are closed to new applicants. This artist may still pay through{' '}
                    {formatEasternEndOfDayDeadline(graceDate)}.
                </p>
            )}

            <div className="grid gap-6">
                {showRegistrationButton && (
                    <Checkout
                        feeType="registration"
                        feeText={`Please click below to pay the $${registrationFee} registration fee.`}
                        buttonText="Pay Registration Fee"
                        stripePublishableKey={stripePublishableKey}
                        publicEmail={email}
                    />
                )}

                {showBoothButton && <>
                    <Checkout
                        feeType="booth"
                        feeText={`Please click below to pay the $${boothFee} booth fee.`}
                        buttonText="Pay Booth Fee"
                        stripePublishableKey={stripePublishableKey}
                        publicEmail={email}
                    />
                    <Typography>
                        If you are planning to have 2 booths, please pay the double booth fee instead:
                    </Typography>
                    <Checkout
                        feeType="booth-double"
                        feeText={`Please click below to pay the $${boothDoubleFee} double booth fee.`}
                        buttonText="Pay Double Booth Fee"
                        stripePublishableKey={stripePublishableKey}
                        publicEmail={email}
                    />
                                    </>}

                {!showRegistrationButton && !showBoothButton && (
                    <div className="rounded border p-4">
                        <p>
                            No payments are currently available for this artist.
                            Please contact the administrator for help.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
