import {
  deleteFile as deleteFileAction,
  fetchProfileFromSession,
  fetchProfileStatus,
  updateFile as updateFileAction,
  uploadFile as uploadFileAction,
} from '@util/profileActions';
import Link from 'next/link';
import { ArtistStepper } from '@components/User/ArtistStepper';
import { Stack } from '@mui/material';
import React from 'react';
import { ProfileUploads } from '@components/User/ProfileUploads';
import { fetchTransactions } from '@util/transActions';
import { canRequestWebsiteFeature } from '@util/payments';
import { getLastFairYear } from '@util/date';

export const metadata = {
  title: 'Upload Artist Images',
};

export default async function ProfileUploadsPage() {
  const userProfile = await fetchProfileFromSession();
  const {
    status: profileStatus,
    uploads: userUploads
  } = await fetchProfileStatus(userProfile);
  const transactions = await fetchTransactions(userProfile.id);
  const canRequestFeature = canRequestWebsiteFeature(transactions, userProfile.status);

  return (
    <Stack spacing={2}>
      <h1 className="m-auto text-[color:var(--gold-color)] italic">Upload Artist Images</h1>

      <ArtistStepper
        profileStatus={profileStatus}
        accountCreatedAt={userProfile.createdAt}
      />

      <ProfileUploads
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
      <Link href="/profile/edit">Click here to edit your Artist Profile</Link>
      <Link href="/profile">Click here to return to your profile</Link>
    </Stack>
  );
}
