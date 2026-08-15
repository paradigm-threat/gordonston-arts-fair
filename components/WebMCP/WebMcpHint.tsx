'use client';

import {useEffect, useState} from 'react';
import {getModelContext} from '@util/webmcp';

export function WebMcpHint() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(Boolean(getModelContext()));
  }, []);

  if (!supported) return null;

  return (
    <p className="webmcp-hint">
      Gemini in Chrome can help you sign in, fill your profile, and check your application on this site.
      Payment still requires you to click Pay.
    </p>
  );
}
