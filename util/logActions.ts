'use server';

import {ensureDatabase} from '@util/database';
import {UserLogModel, UserModel} from '@util/models';
import type {LogType} from '@types';
import {currentUser} from '@clerk/nextjs/server';

export interface UserLogSearchParams {
  type?: LogType,
  order?: 'asc' | 'desc',
  orderBy?: string,
  page?: number,
  limit?: number
}
export async function fetchUserLogs(userID: number, searchParams: UserLogSearchParams = {}) {
  await ensureDatabase();

  const {
    type,
    order,
    orderBy = 'id',
    page = 1,
    limit = 10,
  } = searchParams;
  const offset = (page - 1) * limit;

  const logs = await UserLogModel.findAll({
    where: {
      user_id: userID,
      ...(type ? { type } : {})
    },
    order: [[orderBy, order === 'desc' ? 'DESC' : 'ASC']],
    limit,
    offset
  });

  return logs.map((log) => log.toJSON()) as UserLogModel[];
}

export async function addUserUserLogModel(id: number | null, type: LogType, message: string = '') {
  await ensureDatabase();
  const trimmed = `${message}`.slice(0, 256);
  console[type === 'error' ? 'error' : 'log'](trimmed);

  await UserLogModel.create({
    user_id: id,
    type,
    message: trimmed,
    created_at: new Date()
  });
}

/** Best-effort client/server error breadcrumb. Never throws to the UI. */
export async function logClientError(message: string, context: {email?: string; feeType?: string} = {}) {
  const trimmed = `${message}`.slice(0, 256);
  console.error(JSON.stringify({
    event: 'client.error',
    ts: new Date().toISOString(),
    message: trimmed,
    email: context.email || undefined,
    feeType: context.feeType || undefined,
  }));
  try {
    const user = await currentUser();
    const email = `${user?.primaryEmailAddress?.emailAddress || ''}`.toLowerCase();
    if (!email) return;
    await ensureDatabase();
    const profile = await UserModel.findOne({where: {email}});
    if (profile) {
      await addUserUserLogModel(profile.id, 'error', trimmed);
    }
  } catch {
    // Public checkout and unauthenticated pages still get the console line above.
  }
}
