import type { Metadata } from 'next';
import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import './globals.scss';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ThemeRegistry from '@components/Theme/ThemeRegistry';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  metadataBase: new URL('https://gordonstonartfair.com'),
  title: {
    default: 'Gordonston Art Fair',
    template: '%s | Gordonston Art Fair',
  },
  description:
    'Annual fine arts and crafts fair in historic Gordonston’s Juliette Gordon Low Park, Savannah, GA.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Gordonston Art Fair',
    url: 'https://gordonstonartfair.com',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ThemeRegistry>
            {children}
          </ThemeRegistry>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>

  );
}
