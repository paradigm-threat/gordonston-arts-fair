'use client';

import React, {useState} from 'react';
import {useClerk, useSignIn} from '@clerk/nextjs';
import {useRouter} from 'next/navigation';
import {FaUserSecret} from 'react-icons/fa';
import {createArtistImpersonationTicket} from '@util/impersonateActions';
import {
  formatActorTokenError,
  impersonateRedirectPath,
  isAlreadySignedInError,
  storeImpersonationTicket,
} from '@util/impersonate';

export function ImpersonateUserButton({
  userId,
  displayName,
}: {
  userId: number;
  displayName: string;
}) {
  const router = useRouter();
  const {signOut} = useClerk();
  const {isLoaded, signIn, setActive} = useSignIn();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const name = displayName && displayName !== 'N/A' ? displayName : 'this artist';

  async function activateTicket(ticket: string) {
    if (!signIn || !setActive) {
      throw new Error('Clerk is not ready to finish impersonation. Try again.');
    }
    const attempt = await signIn.create({
      strategy: 'ticket',
      ticket,
    });
    if (attempt.status !== 'complete' || !attempt.createdSessionId) {
      throw new Error('Clerk did not finish the impersonation session.');
    }
    await setActive({session: attempt.createdSessionId});
    router.replace('/profile');
    router.refresh();
  }

  async function handleClick() {
    if (busy) return;

    const confirmed = window.confirm(
      `Log in as ${name}?\n\nYou will leave your admin session and need to sign back in as yourself when you are done.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setError('');
    try {
      if (!isLoaded) {
        setError('Clerk is not ready to finish impersonation. Try again.');
        return;
      }

      const result = await createArtistImpersonationTicket(userId);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      try {
        await activateTicket(result.token);
        return;
      } catch (err) {
        if (!isAlreadySignedInError(err)) {
          setError(formatActorTokenError(err, err instanceof Error ? err.message : 'Could not log in as this artist.'));
          return;
        }
      }

      storeImpersonationTicket(result.token);
      await signOut({
        redirectUrl: new URL(impersonateRedirectPath(result.token), window.location.origin).toString(),
      });
    } catch (err) {
      setError(formatActorTokenError(err, err instanceof Error ? err.message : 'Could not log in as this artist.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="impersonate-user-control">
      <button
        type="button"
        className="impersonate-user-button"
        onClick={() => {
          void handleClick();
        }}
        disabled={busy}
        aria-label={`Log in as ${name}`}
      >
        <FaUserSecret aria-hidden size={16} />
        {busy ? 'Logging in…' : 'Log in as this artist'}
      </button>
      {error ? <span className="impersonate-user-error" role="alert">{error}</span> : null}
    </span>
  );
}
