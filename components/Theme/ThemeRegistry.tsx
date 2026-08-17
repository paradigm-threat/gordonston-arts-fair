'use client';

import * as React from 'react';
import {useEffect, useMemo, useState} from 'react';
import {ThemeProvider} from '@mui/material/styles';
import {AppRouterCacheProvider} from '@mui/material-nextjs/v13-appRouter';
import {ClerkProvider} from '@clerk/nextjs';
import {
  createAppTheme,
  DARK_INPUT,
  DARK_PAGE,
  DARK_PAPER,
  DARK_TEXT,
  DARK_TEXT_MUTED,
  GOLD_DARK,
  GOLD_LIGHT,
} from './theme';
import {subscribeToAppearance} from './AppearanceSelect';
import type {ResolvedTheme} from '@util/appearance';

function clerkAppearance(mode: ResolvedTheme) {
  const dark = mode === 'dark';
  const text = dark ? DARK_TEXT : '#121212';
  const muted = dark ? DARK_TEXT_MUTED : '#333333';
  const background = dark ? DARK_PAPER : '#ffffff';
  return {
    variables: {
      colorBackground: background,
      colorText: text,
      colorTextSecondary: muted,
      colorNeutral: text,
      colorPrimary: dark ? GOLD_DARK : GOLD_LIGHT,
      colorInputBackground: dark ? DARK_INPUT : '#ffffff',
      colorInputText: text,
    },
    elements: {
      userButtonPopoverCard: {
        backgroundColor: background,
        color: text,
      },
      userButtonPopoverMain: {
        color: text,
      },
      userButtonPopoverActionButton: {
        color: text,
      },
      userButtonPopoverActionButtonText: {
        color: text,
      },
      userButtonPopoverActionButtonIcon: {
        color: text,
      },
      userButtonPopoverCustomItemButton: {
        color: text,
      },
      userButtonPopoverCustomItemButton__inner: {
        color: text,
      },
      userButtonPopoverFooter: {
        backgroundColor: dark ? DARK_PAGE : '#f4f4f4',
      },
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
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          appearance={appearance}
        >
          {children}
        </ClerkProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
