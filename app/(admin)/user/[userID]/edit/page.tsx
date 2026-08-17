import ProfileEditor from '@components/User/ProfileEditor';
import {
    deleteFile as deleteFileAction,
    fetchProfileByID,
    fetchProfileStatus,
    updateFile as updateFileAction,
    updateProfile as updateProfileAction,
    uploadFile as uploadFileAction,
} from '@util/profileActions';
import {validateAdminSession} from '@util/session';
import Link from 'next/link';
import {Box, Stack} from '@mui/material';
import React from 'react';
import {ProfileUploads} from "@components/User/ProfileUploads";
import {EditProfileTabs} from '@components/Admin/EditProfileTabs';
import {ImpersonateUserButton} from '@components/Admin/ImpersonateUserButton';
import {getFullName} from '@util/profile';
import {fetchTransactions} from '@util/transActions';
import {canRequestWebsiteFeature} from '@util/payments';
import {getLastFairYear} from '@util/date';

export const metadata = {
    title: 'Edit Artist Profile',
};

const USER_LABEL = process.env.NEXT_PUBLIC_USER_LABEL || 'User';

export default async function AdminEditUserProfilePage({
                                                           params,
                                                       }: {
    params: Promise<{ userID: number }>
}) {
    await validateAdminSession();

    const {userID} = await params;
    const userProfile = await fetchProfileByID(userID);
    const {
        status: profileStatus,
        uploads: userUploads
    } = await fetchProfileStatus(userProfile);
    const transactions = await fetchTransactions(userProfile.id);
    const canRequestFeature = canRequestWebsiteFeature(transactions, userProfile.status);

    return (
        <Stack spacing={2}>
            <h1 className="m-auto text-[color:var(--gold-color)] italic">Edit Artist Profile</h1>

            <Box className="flex flex-row flex-wrap items-center gap-3">
                <Link href={`/user/${userProfile.id}`}>
                    {`← Back to ${USER_LABEL} Management`}
                </Link>
                {userProfile.type !== 'admin' && (
                    <ImpersonateUserButton
                        userId={userProfile.id}
                        displayName={getFullName(userProfile.first_name, userProfile.last_name)}
                    />
                )}
            </Box>

            <EditProfileTabs
                contact={(
                    <ProfileEditor
                        adminMode
                        profileStatus={profileStatus}
                        userProfile={userProfile.toJSON()}
                        updateProfile={async (updated) => {
                            'use server';
                            return updateProfileAction(userProfile.id, updated);
                        }}
                    />
                )}
                photos={(
                    <ProfileUploads
                        adminMode
                        userUploads={userUploads.map((u) => u.toJSON())}
                        canRequestFeature={canRequestFeature}
                        lastFairYear={getLastFairYear()}
                        updateFile={async (file) => {
                            'use server';
                            return updateFileAction(userProfile.id, file);
                        }}
                        uploadFile={async (file) => {
                            'use server';
                            return uploadFileAction(userProfile.id, file);
                        }}
                        deleteFile={async (fileID) => {
                            'use server';
                            return deleteFileAction(userProfile.id, fileID);
                        }}
                    />
                )}
            />
        </Stack>
    );
}
