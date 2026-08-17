import { fetchProfileFromSession, fetchProfileStatus } from '@util/profileActions';
import ProfileView from '@components/User/ProfileView';
import Link from 'next/link';
import { ArtistStepper } from '@components/User/ArtistStepper';
import React from 'react';
import { Stack } from '@mui/material';

export const metadata = {
  title: 'Artist Profile',
};

export default async function ProfilePage() {
  const userProfile = await fetchProfileFromSession();
  const {
    status: profileStatus,
    uploads: userUploads
  } = await fetchProfileStatus(userProfile);

  return (
    <Stack spacing={2}>
      <h1 className="m-auto text-[color:var(--gold-color)] italic">Artist Profile</h1>

      <ArtistStepper profileStatus={profileStatus} showAlert />

      <Link href="/profile/edit">Click here to edit your profile</Link>
      <ProfileView
        userProfile={userProfile}
        userUploads={userUploads}
      />
      <Link href="/profile/upload">Click here to manage your image uploads</Link>
    </Stack>
  );
}
