'use client';

import * as React from 'react';
import {useEffect, useMemo, useState} from 'react';
import {ThemeProvider} from '@mui/material/styles';
import {AppRouterCacheProvider} from '@mui/material-nextjs/v13-appRouter';
import {ClerkProvider} from '@clerk/nextjs';
import {createAppTheme} from './theme';
import {subscribeToAppearance} from './AppearanceSelect';
import type {ResolvedTheme} from '@util/appearance';

function clerkAppearance(mode: ResolvedTheme) {
  const dark = mode === 'dark';
  return {
    variables: {
      colorBackground: dark ? '#1e1e1e' : '#ffffff',
      colorText: dark ? '#f3f3f3' : '#121212',
      colorPrimary: '#1976d2',
      colorInputBackground: dark ? '#121212' : '#ffffff',
      colorInputText: dark ? '#f3f3f3' : '#121212',
    },
  };
}

export default function ThemeRegistry({children}: {children: React.ReactNode}) {
  const [mode, setMode] = useState<ResolvedTheme>('light');

  useEffect(() => subscribeToAppearance(setMode), []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const appearance = useMemo(() => clerkAppearance(mode), [mode]);

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <ClerkProvider appearance={appearance}>
          {children}
        </ClerkProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
