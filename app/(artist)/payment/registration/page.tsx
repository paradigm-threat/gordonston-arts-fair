import { fetchProfileFromSession, fetchProfileStatus, fetchUserFiles } from '@util/profileActions';
import Link from 'next/link';
import Checkout from '@components/Payment/Checkout';
import { ArtistStepper } from '@components/User/ArtistStepper';
import React from 'react';
import { Stack } from '@mui/material';
import process from 'node:process';
import { fetchTransactions } from '@util/transActions';
import UserTransactionView from '@components/User/UserTransactionView';
import ApplicationPreview from '@components/User/ApplicationPreview';
import ApplicationsClosedInfo from '@components/Info/ApplicationsClosedInfo';
import {
  formatEasternEndOfDayDeadline,
  getRegistrationPaymentGraceDate,
  getRegistrationPhase,
  isRegistrationCheckoutAllowedForUser,
} from '@util/date';
import { hasPaidRegistrationThisCycle, hasPriorCycleRegistrationPayment } from '@util/payments';

export const metadata = {
  title: 'Artist Checkout',
};

const stripePublishableKey = `${process.env.TEST_MODE === 'false'
  ? process.env.STRIPE_PUBLISHABLE_KEY_LIVE
  : process.env.STRIPE_PUBLISHABLE_KEY_TEST}`;

// TODO: setup userID in checkout session
export default async function CheckoutPage() {
  const userProfile = await fetchProfileFromSession();
  const feeAmount = parseInt(`${process.env.NEXT_PUBLIC_REGISTRATION_FEE}`, 10);
  const {
    status: profileStatus,
  } = await fetchProfileStatus(userProfile);
  const transactions = await fetchTransactions(userProfile.id);
  const alreadyPaid = hasPaidRegistrationThisCycle(transactions, userProfile.status);
  const priorYearPayment = !alreadyPaid && hasPriorCycleRegistrationPayment(transactions);
  const userUploads = await fetchUserFiles(userProfile.id);
  const {
    complete: eligibleToRegister,
    message: eligibleToRegisterString
  } = profileStatus;
  let feeText = alreadyPaid
    ? 'You have already paid this year\'s registration fee.'
    : `Please click below to pay the $${feeAmount} registration fee.`;
  if (priorYearPayment) {
    feeText = `Please pay this year's $${feeAmount} registration fee. Last year's payment does not carry over.`;
  }
  if (!eligibleToRegister) {
    feeText = `You have not yet completed your profile. ${eligibleToRegisterString}`;
  }
  const USER_LABEL = process.env.NEXT_PUBLIC_USER_LABEL || 'User';
  const registrationPhase = getRegistrationPhase();
  const registrationAvailable = isRegistrationCheckoutAllowedForUser(userProfile);
  const graceDate = getRegistrationPaymentGraceDate();
  const showGraceNote = registrationPhase === 'closed' && registrationAvailable && graceDate;

  return (
    <Stack spacing={2}>
      <h1 className="items-center text-[color:var(--gold-color)] italic">Pay Artist Registration Fee</h1>

      <ArtistStepper
        profileStatus={profileStatus}
        accountCreatedAt={userProfile.createdAt}
      />

      <ApplicationPreview userProfile={userProfile} userUploads={userUploads} />

      {showGraceNote && (
        <p>
          Applications are closed to new applicants. Because you already had an account,
          you may still pay through {formatEasternEndOfDayDeadline(graceDate)}.
        </p>
      )}

      {!registrationAvailable ? (
        <ApplicationsClosedInfo />
      ) : (
        <Checkout
          feeType="registration"
          feeText={feeText}
          buttonText="Pay Registration Fee"
          stripePublishableKey={stripePublishableKey}
          disabled={alreadyPaid || !eligibleToRegister}
        />
      )}

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
