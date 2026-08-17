'use client';

import React, {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type {AlertColor} from '@mui/material/Alert';
import {useRouter} from 'next/navigation';
import type {FeaturedRequestItem} from '@util/featuredActions';
import {getFeaturedQueueSummary} from '@util/featuredStatus';

type ReviewAction = 'approve' | 'decline' | 'unpublish';

export function FeaturedPhotosAdmin({
  pending,
  approved,
  declined,
  lastFairYear,
  reviewFeaturedUpload,
}: {
  pending: FeaturedRequestItem[];
  approved: FeaturedRequestItem[];
  declined: FeaturedRequestItem[];
  lastFairYear: number;
  reviewFeaturedUpload(uploadId: number, action: ReviewAction): Promise<{message: string}>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<[AlertColor, string]>(['info', '']);
  const [busyId, setBusyId] = useState<number | null>(null);
  const summary = getFeaturedQueueSummary(pending.length, approved.length, declined.length);

  async function handleReview(id: number, action: ReviewAction) {
    setBusyId(id);
    setMessage(['info', 'Saving…']);
    try {
      const {message: nextMessage} = await reviewFeaturedUpload(id, action);
      setMessage(['success', nextMessage]);
      router.refresh();
    } catch (error: unknown) {
      setMessage(['error', error instanceof Error ? error.message : 'Could not update this photo.']);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        This is a new feature. Last year&apos;s exhibitors can ask to show a photo on the home page.
        These are images the artists want featured, not a random selection of their uploads.
        Checking the box on their photo form only sends a request. Nothing appears on the public
        site until you approve it here.
      </Alert>

      <Alert severity={summary.frontPageLive ? 'success' : 'warning'}>
        {summary.frontPageLabel}
        {' '}
        {summary.frontPageLive
          ? 'Visitors see the last-year slideshow on the front page.'
          : 'When you approve the first image, it will automatically appear in the front page slideshow.'}
      </Alert>

      <Box className="admin-panel">
        <Typography component="h2" variant="h6">Current counts</Typography>
        <Typography>
          Waiting for review:
          {' '}
          {summary.pendingCount}
        </Typography>
        <Typography>
          Approved (on the front page):
          {' '}
          {summary.approvedCount}
        </Typography>
        <Typography>
          Declined:
          {' '}
          {summary.declinedCount}
        </Typography>
        <Typography sx={{mt: 1}}>
          Artists from the
          {' '}
          {lastFairYear}
          {' '}
          Art Fair send these requests from their photo page.
        </Typography>
      </Box>

      {message[1] && (
        <Alert severity={message[0]}>{message[1]}</Alert>
      )}

      <PhotoQueueTable
        heading={`Waiting for review: ${pending.length}`}
        emptyText="No photos are waiting for review."
        items={pending}
        busyId={busyId}
        actions={(item) => (
          <>
            <Button
              variant="contained"
              color="primary"
              disabled={busyId === item.id}
              onClick={() => handleReview(item.id, 'approve')}
            >
              Approve for home page
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              disabled={busyId === item.id}
              onClick={() => handleReview(item.id, 'decline')}
            >
              Decline request
            </Button>
          </>
        )}
      />

      <PhotoQueueTable
        heading={`On the home page: ${approved.length}`}
        emptyText="No photos are on the home page yet."
        items={approved}
        busyId={busyId}
        actions={(item) => (
          <Button
            variant="outlined"
            color="secondary"
            disabled={busyId === item.id}
            onClick={() => handleReview(item.id, 'unpublish')}
          >
            Remove from home page
          </Button>
        )}
      />

      <PhotoQueueTable
        heading={`Declined: ${declined.length}`}
        emptyText="No featured-photo requests have been declined."
        items={declined}
        busyId={busyId}
        actions={(item) => (
          <Button
            variant="contained"
            color="primary"
            disabled={busyId === item.id}
            onClick={() => handleReview(item.id, 'approve')}
          >
            Approve for home page
          </Button>
        )}
      />
    </Stack>
  );
}

function PhotoQueueTable({
  heading,
  emptyText,
  items,
  busyId,
  actions,
}: {
  heading: string;
  emptyText: string;
  items: FeaturedRequestItem[];
  busyId: number | null;
  actions: (item: FeaturedRequestItem) => React.ReactNode;
}) {
  return (
    <Box className="admin-panel">
      <Typography component="h2" variant="h6">{heading}</Typography>
      {items.length === 0 ? (
        <Typography>{emptyText}</Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow className="admin-table-head">
                <TableCell>Photo</TableCell>
                <TableCell>Request</TableCell>
                <TableCell>Review</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{width: '28%', verticalAlign: 'top'}}>
                    <Link href={item.url} target="_blank" rel="noreferrer">
                      <Image
                        src={item.url}
                        alt={item.title}
                        width={item.width}
                        height={item.height}
                        style={{width: '100%', height: 'auto'}}
                      />
                    </Link>
                  </TableCell>
                  <TableCell sx={{verticalAlign: 'top'}}>
                    <Typography fontWeight={700}>{item.title}</Typography>
                    <Typography>
                      {item.artistName}
                      {item.email ? ` · ${item.email}` : ''}
                      {item.artistStatus ? ` · ${item.artistStatus}` : ''}
                    </Typography>
                    <Typography sx={{mt: 1, whiteSpace: 'pre-wrap'}}>
                      {item.description || 'No description provided.'}
                    </Typography>
                    <Typography sx={{mt: 1}}>
                      <Link href={`/user/${item.userId}`}>Open artist record</Link>
                    </Typography>
                  </TableCell>
                  <TableCell sx={{verticalAlign: 'top', minWidth: '12rem'}}>
                    <Stack spacing={1}>
                      {actions(item)}
                      {busyId === item.id && (
                        <Typography>Saving…</Typography>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
