'use client';

import React, {useEffect, useState} from 'react';
import {useSignIn} from '@clerk/nextjs';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {
  clearImpersonationTicket,
  formatActorTokenError,
  readImpersonationTicket,
  stripImpersonationTicketFromUrl,
} from '@util/impersonate';

type ConsumeResult = {ok: true} | {ok: false; message: string};
type ConsumeState =
  | {status: 'idle'}
  | {status: 'pending'; ticket: string; promise: Promise<ConsumeResult>}
  | {status: 'success'}
  | {status: 'failure'; ticket: string; message: string};

let consumeState: ConsumeState = {status: 'idle'};

export function ImpersonateComplete() {
  const router = useRouter();
  const {isLoaded, signIn, setActive} = useSignIn();
  const [message, setMessage] = useState('Signing you in as the artist…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isLoaded || !signIn || !setActive) return undefined;

    const storedTicket = readImpersonationTicket();
    if (consumeState.status === 'success' && !storedTicket) {
      router.replace('/profile');
      return undefined;
    }
    if (consumeState.status === 'failure' && (!storedTicket || storedTicket === consumeState.ticket)) {
      setFailed(true);
      setMessage(consumeState.message);
      return undefined;
    }

    const ticket = consumeState.status === 'pending' ? consumeState.ticket : storedTicket;
    if (!ticket) {
      consumeState = {status: 'idle'};
      setFailed(true);
      setMessage('The impersonation ticket is missing or expired. Go back to the artist page and try again.');
      return undefined;
    }

    stripImpersonationTicketFromUrl();

    if (consumeState.status !== 'pending' || consumeState.ticket !== ticket) {
      consumeState = {
        status: 'pending',
        ticket,
        promise: (async (): Promise<ConsumeResult> => {
          try {
            const attempt = await signIn.create({
              strategy: 'ticket',
              ticket,
            });
            if (attempt.status !== 'complete' || !attempt.createdSessionId) {
              return {ok: false, message: 'Clerk did not finish the impersonation session.'};
            }
            await setActive({session: attempt.createdSessionId});
            return {ok: true};
          } catch (err) {
            return {
              ok: false,
              message: formatActorTokenError(err, 'Could not finish impersonation.'),
            };
          }
        })(),
      };
    }

    let cancelled = false;
    void consumeState.promise.then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        consumeState = {status: 'failure', ticket, message: result.message};
        setFailed(true);
        setMessage(result.message);
        return;
      }
      consumeState = {status: 'success'};
      clearImpersonationTicket();
      router.replace('/profile');
      router.refresh();
    });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, router, setActive, signIn]);

  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="mb-4 text-[color:var(--gold-color)] italic">Log in as artist</h1>
      <p role={failed ? 'alert' : 'status'}>{message}</p>
      {failed ? (
        <p className="mt-4">
          <Link href="/user">Return to the artist list</Link>
        </p>
      ) : null}
    </div>
  );
}
