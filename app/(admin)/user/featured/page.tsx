import {Stack} from '@mui/material';
import {validateAdminSession} from '@util/session';
import {fetchFeaturedPhotoQueue, reviewFeaturedUpload as reviewFeaturedUploadAction} from '@util/featuredActions';
import {getLastFairYear} from '@util/date';
import {FeaturedPhotosAdmin} from '@components/Admin/FeaturedPhotosAdmin';

export const metadata = {
  title: 'Featured photos',
};

export default async function AdminFeaturedPhotosPage() {
  await validateAdminSession();
  const {pending, approved, declined} = await fetchFeaturedPhotoQueue();
  const lastFairYear = getLastFairYear();

  return (
    <Stack spacing={2}>
      <h1 className="m-auto text-[color:var(--gold-color)] italic">
        Featured photos
      </h1>
      <FeaturedPhotosAdmin
        pending={pending}
        approved={approved}
        declined={declined}
        lastFairYear={lastFairYear}
        reviewFeaturedUpload={async (uploadId, action) => {
          'use server';
          return reviewFeaturedUploadAction(uploadId, action);
        }}
      />
    </Stack>
  );
}
