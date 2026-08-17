'use client';

import React, {useEffect, useState} from 'react';
import {Button} from '@mui/material';
import {FaImages, FaUserEdit} from 'react-icons/fa';

export function EditProfileTabs({
  contact,
  photos,
}: {
  contact: React.ReactNode;
  photos: React.ReactNode;
}) {
  const [tab, setTab] = useState<'contact' | 'photos'>('contact');

  useEffect(() => {
    if (window.location.hash === '#photos') {
      setTab('photos');
    }
  }, []);

  return (
    <div className="edit-profile-tabs">
      <div className="edit-profile-tablist" role="tablist" aria-label="Edit artist">
        <Button
          role="tab"
          aria-selected={tab === 'contact'}
          variant={tab === 'contact' ? 'contained' : 'outlined'}
          startIcon={<FaUserEdit />}
          onClick={() => {
            setTab('contact');
            window.history.replaceState(null, '', window.location.pathname);
          }}
        >
          Contact information
        </Button>
        <Button
          role="tab"
          aria-selected={tab === 'photos'}
          variant={tab === 'photos' ? 'contained' : 'outlined'}
          startIcon={<FaImages />}
          onClick={() => {
            setTab('photos');
            window.history.replaceState(null, '', `${window.location.pathname}#photos`);
          }}
        >
          Photos
        </Button>
      </div>
      <div role="tabpanel">
        {tab === 'contact' ? contact : photos}
      </div>
    </div>
  );
}
