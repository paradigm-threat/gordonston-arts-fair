import {fetchProfileFromSession, fetchProfileStatus} from '@util/profileActions';
import Link from 'next/link';
import Checkout from '@components/Payment/Checkout';
import {ArtistStepper} from '@components/User/ArtistStepper';
import React from 'react';
import {Stack, Typography} from '@mui/material';
import process from 'node:process';
import {fetchTransactions} from '@util/transActions';
import UserTransactionView from '@components/User/UserTransactionView';
import {hasPaidBoothThisCycle} from '@util/payments';

export const metadata = {
    title: 'Artist Checkout',
};

const stripePublishableKey = `${process.env.TEST_MODE === 'false'
    ? process.env.STRIPE_PUBLISHABLE_KEY_LIVE
    : process.env.STRIPE_PUBLISHABLE_KEY_TEST}`;

// TODO: setup userID in checkout session
export default async function CheckoutPage() {
    const userProfile = await fetchProfileFromSession();
    const feeAmount = parseInt(`${process.env.NEXT_PUBLIC_BOOTH_FEE}`, 10);
    const feeAmountDouble = parseInt(`${process.env.NEXT_PUBLIC_BOOTH_DOUBLE_FEE}`, 10);
    const {
        status: profileStatus,
    } = await fetchProfileStatus(userProfile);
    const transactions = await fetchTransactions(userProfile.id);
    const alreadyPaid = hasPaidBoothThisCycle(transactions, userProfile.status);
    const eligibleToRegister = userProfile.status === 'approved';
    const USER_LABEL = process.env.NEXT_PUBLIC_USER_LABEL || 'User';

    return (
        <Stack spacing={2}>
            <h1 className="m-auto text-[color:var(--gold-color)] italic">Pay Artist Booth Fee</h1>

            <ArtistStepper
                profileStatus={profileStatus}
                accountCreatedAt={userProfile.createdAt}
            />

            {alreadyPaid ? (
                <p>You have already paid this year&apos;s booth fee.</p>
            ) : <>
                <Checkout
                    title="Pay Booth Fee"
                    feeType="booth"
                    feeText={`Please click below to pay the $${feeAmount} booth fee.`}
                    buttonText="Pay Booth Fee"
                    stripePublishableKey={stripePublishableKey}
                    disabled={alreadyPaid || !eligibleToRegister}
                />
                <Typography>
                    If you are planning to have 2 booths, please pay the double booth fee instead:
                </Typography>
                <Checkout
                    title="Pay Double Booth Fee"
                    feeType="booth-double"
                    feeText={`Please click below to pay the $${feeAmountDouble} double booth fee.`}
                    buttonText="Pay Double Booth Fee"
                    stripePublishableKey={stripePublishableKey}
                    disabled={alreadyPaid || !eligibleToRegister}
                />
                </>}

            <UserTransactionView
                title={`${USER_LABEL} Transactions`}
                fetchUserTransactions={async (options) => {
                    'use server';

                    return fetchTransactions(userProfile.id, options);
                }}
            />

            <Link href="/profile">Click here to return to your profile</Link>
        </Stack>
    );
}
