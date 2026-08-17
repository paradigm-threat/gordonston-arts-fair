'use server';

import {auth, clerkClient} from '@clerk/nextjs/server';
import {addUserUserLogModel} from '@util/logActions';
import {fetchProfileByID} from '@util/profileActions';
import {validateAdminSession} from '@util/session';
import {formatActorTokenError} from '@util/impersonate';

type ImpersonationResult =
  | {ok: true; token: string}
  | {ok: false; message: string};

async function getClerkClient() {
  return clerkClient();
}

export async function createArtistImpersonationTicket(profileUserId: number): Promise<ImpersonationResult> {
  await validateAdminSession();
  const {userId: actorId} = await auth();
  if (!actorId) {
    return {ok: false, message: 'You must be signed in as an admin to log in as an artist.'};
  }

  const profile = await fetchProfileByID(profileUserId);
  if (profile.type === 'admin') {
    return {ok: false, message: 'Cannot log in as another admin.'};
  }

  const email = `${profile.email || ''}`.trim().toLowerCase();
  if (!email) {
    return {ok: false, message: 'This artist has no email address.'};
  }

  const client = await getClerkClient();
  const {data: clerkUsers} = await client.users.getUserList({
    emailAddress: [email],
    limit: 1,
  });
  const target = clerkUsers[0];
  if (!target) {
    return {
      ok: false,
      message: 'This artist has not signed in with Clerk yet. They need to create an account before you can log in as them.',
    };
  }
  if (target.id === actorId) {
    return {ok: false, message: 'You are already signed in as this user.'};
  }
  if (target.publicMetadata?.type === 'admin') {
    return {ok: false, message: 'Cannot log in as an admin account.'};
  }

  const secret = process.env.CLERK_SECRET_KEY || '';
  if (!secret) {
    return {ok: false, message: 'Clerk is not configured for impersonation on this server.'};
  }

  const res = await fetch('https://api.clerk.com/v1/actor_tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: target.id,
      expires_in_seconds: 120,
      actor: {
        sub: actorId,
      },
    }),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      ok: false,
      message: formatActorTokenError(payload),
    };
  }

  const token = payload && typeof payload === 'object' ? (payload as {token?: string}).token : '';
  if (!token) {
    return {ok: false, message: 'Clerk did not return an impersonation ticket.'};
  }

  const admin = await client.users.getUser(actorId);
  const adminEmail = admin.primaryEmailAddress?.emailAddress || actorId;
  await addUserUserLogModel(
    profile.id,
    'log-in',
    `Admin ${adminEmail} started impersonation`,
  );

  return {ok: true, token};
}
