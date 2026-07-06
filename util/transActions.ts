/* eslint-disable no-await-in-loop,no-restricted-syntax */

'use server';

import { ensureDatabase } from '@util/database';
import { UserTransactionModel } from '@util/models';
import { TransactionType, UserStatus } from '@types';
import { validateAdminSession } from '@util/session';
import { fetchProfileByID, fetchProfileFromSession, updateUserStatus } from '@util/profileActions';

export interface UserTransactionSearchParams {
    type?: TransactionType,
    amount?: number,
    order?: 'asc' | 'desc',
    orderBy?: string,
    page?: number,
    limit?: number
}

export async function fetchTransactions(userID: number, options: UserTransactionSearchParams = {}) {
    await ensureDatabase();

    const { type, amount } = options;

    const whereCondition: { [key: string]: string | number } = { user_id: userID };
    if (type) whereCondition.type = type;
    if (amount !== undefined && amount !== null) whereCondition.amount = amount;

    const transactions = await UserTransactionModel.findAll({
        where: whereCondition,
        order: [['createdAt', 'DESC']]
    });

    return transactions.map((transaction) => transaction.toJSON()) as UserTransactionModel[];
}

export async function addTransaction(
    userID: number | null,
    type: TransactionType,
    amount: number,
    fullName: string | null,
    email: string | null,
    phone: string | null,
    provider_id: string,
    content: object
) {
    await ensureDatabase();

    await UserTransactionModel.create({
        user_id: userID,
        type,
        amount,
        full_name: fullName,
        email,
        phone,
        created_at: new Date(),
        provider_id,
        content
    });
}

export async function addManualTransaction(
    userID: number,
    type: TransactionType,
    amount: number,
    provider: string,
    provider_id: string,
    newStatus?: UserStatus
) {
    await validateAdminSession();
    const adminProfile = await fetchProfileFromSession();

    const userProfile = await fetchProfileByID(userID);

    await addTransaction(
        userID,
        type,
        amount,
        `${userProfile.first_name} ${userProfile.last_name}`,
        userProfile.email,
        userProfile.phone || null,
        provider_id,
        {
            provider,
            manual: true,
            adminEmail: adminProfile.email,
            date: new Date().toISOString()
        }
    );

    if (newStatus) {
        await updateUserStatus(
            userID,
            newStatus,
            `Status updated to ${newStatus} via manual transaction entry by admin ${adminProfile.email}`,
            true // send email
        );
    }

    return { status: 'success', message: 'Transaction added successfully' };
}
