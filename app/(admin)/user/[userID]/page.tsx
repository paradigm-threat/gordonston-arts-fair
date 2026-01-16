import {fetchProfileByID, fetchProfileFromSession, fetchUserFiles, updateUserStatus} from '@util/profileActions';
import Link from 'next/link';
import UserStatusEditorAdmin from '@components/Admin/UserStatusEditorAdmin';
import ProfileView from '@components/User/ProfileView';
import {Box, Stack} from '@mui/material';
import UserLogView from '@components/User/UserLogView';
import React from 'react';
import {fetchUserLogs} from '@util/logActions';
import {validateAdminSession} from '@util/session';
import UserTransactionView from '@components/User/UserTransactionView';
import {fetchTransactions, addManualTransaction} from '@util/transActions';
import {sendMail} from '@util/emailActions';
import SendEmailAdmin from '@components/Admin/SendEmailAdmin';
import ManualTransactionAdmin from '@components/Admin/ManualTransactionAdmin';

export const metadata = {
    title: 'Manage an Artist',
};

const USER_LABEL = process.env.NEXT_PUBLIC_USER_LABEL || 'User';

export default async function AdminUserManagementPage({
                                                          params,
                                                      }: {
    params: Promise<{ userID: number }>
}) {
    await validateAdminSession();
    const adminProfile = await fetchProfileFromSession();

    const {userID} = await params;
    const userProfile = await fetchProfileByID(userID);
    const userUploads = await fetchUserFiles(userProfile.id);

    return (
        <Stack spacing={2}>
            <h1 className="m-auto text-[color:var(--gold-color)] italic">Manage an Artist</h1>

            <Stack spacing={2} padding={2}>

                <Box className="flex flex-row gap-2">
                    <Link
                        href="/user"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2"
                    >
                        {`← Back to ${USER_LABEL} List`}
                    </Link>
                    <Link
                        href={`/user/${userProfile.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2"
                    >
                        Click here to Edit Profile
                    </Link>
                </Box>
                <UserStatusEditorAdmin
                    userStatus={userProfile.status}
                    updateUserStatus={async (newStatus, sendEmailTemplate) => {
                        'use server';

                        return updateUserStatus(
                            userProfile.id,
                            newStatus,
                            `${newStatus} set by admin #${adminProfile.email}`,
                            sendEmailTemplate
                        );
                    }}
                />
                <ProfileView
                    userProfile={userProfile.toJSON()}
                    userUploads={userUploads.map((u) => u.toJSON())}
                />
                <Box className="flex flex-row gap-2">
                    <Link
                        href={`/user/${userProfile.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2"
                    >
                        Click here to edit {USER_LABEL} profile information or manage/delete images
                    </Link>
                </Box>

                <SendEmailAdmin
                    userProfile={userProfile.toJSON()}
                    sendMail={sendMail}
                />

                <ManualTransactionAdmin
                    userID={userProfile.id}
                    addManualTransaction={addManualTransaction}
                />

                <UserLogView
                    title={`${USER_LABEL} Logs`}
                    fetchUserLogs={async (args) => {
                        'use server';

                        return fetchUserLogs(userProfile.id, args);
                    }}
                />
                <UserTransactionView
                    title={`${USER_LABEL} Transactions`}
                    fetchUserTransactions={async (options) => {
                        'use server';

                        return fetchTransactions(userProfile.id, options);
                    }}
                />
            </Stack>
        </Stack>
    );
}
