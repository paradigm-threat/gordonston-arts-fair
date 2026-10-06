import { IProfileStatus } from '@util/profile';
import {
  Alert, Step, StepLabel, Stepper
} from '@mui/material';
import Link from 'next/link';
import React from 'react';
import {
  formatDate,
  formatEasternEndOfDayDeadline,
  getRegistrationOpenDate,
  getRegistrationPaymentGraceDate,
  getRegistrationPhase,
  isRegistrationCheckoutAllowedForUser,
} from '@util/date';

interface ArtistStepperProps {
  profileStatus: IProfileStatus,
  showAlert?: boolean,
  /** Optional clock override for tests / previews */
  now?: Date,
  /** Needed so grace-period checkout can identify pre-deadline accounts */
  accountCreatedAt?: Date | string | null,
}

export function ArtistStepper({
  profileStatus: {
    status,
    complete,
    formFilled,
    message,
  }, showAlert,
  now,
  accountCreatedAt,
}: ArtistStepperProps) {
  let activeStep = 0;
  let returnMessage: ['info' | 'success', string] = ['info', message];
  let redirectURL: React.JSX.Element = <Link href="/profile/edit">Click here to return to profile editor</Link>;
  const registrationPhase = getRegistrationPhase(now);
  const canPayRegistration = isRegistrationCheckoutAllowedForUser(
    {status, createdAt: accountCreatedAt},
    now,
  );
  const registrationFee = process.env.NEXT_PUBLIC_REGISTRATION_FEE || '15';
  const pastApply = status === 'submitted'
    || status === 'approved'
    || status === 'standby'
    || status === 'declined'
    || status === 'paid';
  const showBooth = status === 'approved' || status === 'paid';
  const showComplete = status === 'paid';

  if (formFilled) {
    activeStep = 1;
    returnMessage = ['info', 'Please upload at least one image of your artwork to complete your profile.'];
    redirectURL = <Link href="/profile/upload">Click here to upload artist images</Link>;
  }

  if (complete) {
    activeStep = 2;
    if (registrationPhase === 'not-yet-open') {
      returnMessage = ['info', `Your profile is saved. Application submission opens ${formatDate(getRegistrationOpenDate())}.`];
      redirectURL = <Link href="/profile">Click here to return to your profile</Link>;
    } else if (canPayRegistration) {
      const graceDate = getRegistrationPaymentGraceDate();
      if (registrationPhase === 'closed' && graceDate) {
        returnMessage = ['info', `Applications are closed to new applicants, but you may still pay the artist registration fee through ${formatEasternEndOfDayDeadline(graceDate)}.`];
      } else {
        returnMessage = ['info', 'Please pay the artist registration fee to submit your profile for approval.'];
      }
      redirectURL = <Link href="/payment/registration">Click here to pay the Registration Fee</Link>;
    } else if (registrationPhase === 'closed') {
      returnMessage = ['info', 'The application period has closed. Your profile is saved, but new submissions are not being accepted.'];
      redirectURL = <Link href="/profile">Click here to return to your profile</Link>;
    } else {
      returnMessage = ['info', 'Please pay the artist registration fee to submit your profile for approval.'];
      redirectURL = <Link href="/payment/registration">Click here to pay the Registration Fee</Link>;
    }
  }

  if (status === 'submitted') {
    activeStep = 3;
    returnMessage = ['info', 'Please wait for approval from the Gordonston Arts Fair Administrators.'];
    redirectURL = <Link href="/profile">Click here to return to profile</Link>;
  }
  if (status === 'standby') {
    activeStep = 3;
    returnMessage = ['info', 'Your artist profile is on standby. Please wait for approval.'];
    redirectURL = <Link href="/profile">Click here to return to profile</Link>;
  }
  if (status === 'declined') {
    activeStep = 3;
    returnMessage = ['info', 'Your artist profile has been declined. Please contact us for more information.'];
    redirectURL = <Link href="/profile">Click here to return to profile</Link>;
  }
  if (status === 'approved') {
    activeStep = 4;
    returnMessage = ['info', 'Please pay the artist booth fee to complete your artist registration.'];
    redirectURL = <Link href="/payment/booth">Click here to pay the Booth Fee</Link>;
  }
  if (status === 'paid') {
    activeStep = 5;
    returnMessage = ['success', 'Your artist registration is complete!'];
    redirectURL = <Link href="/profile">Click here to return to profile</Link>;
  }

  return (
    <>
      <Stepper activeStep={activeStep} sx={{ padding: '1rem' }}>
        <Step>
          <Link href="/profile/edit">
            <StepLabel>Profile</StepLabel>
          </Link>
        </Step>
        <Step>
          <Link href="/profile/upload">
            <StepLabel>Photos</StepLabel>
          </Link>
        </Step>
        <Step>
          <Link href="/payment/registration">
            <StepLabel>{`Pay $${registrationFee}`}</StepLabel>
          </Link>
        </Step>
        {pastApply && (
          <Step>
            <StepLabel>Approval</StepLabel>
          </Step>
        )}
        {showBooth && (
          <Step>
            <Link href="/payment/booth">
              <StepLabel>Booth Fee</StepLabel>
            </Link>
          </Step>
        )}
        {showComplete && (
          <Step>
            <StepLabel>Complete</StepLabel>
          </Step>
        )}
      </Stepper>

      {showAlert && (
        <Alert severity={returnMessage[0]}>
          {returnMessage[1]}
          {' '}
          {redirectURL}
        </Alert>
      )}
    </>
  );
}
