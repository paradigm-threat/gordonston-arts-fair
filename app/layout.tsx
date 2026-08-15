import type { Metadata } from 'next';
import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import './globals.scss';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ThemeRegistry from '@components/Theme/ThemeRegistry';
import { WebMcpRoot } from '@components/WebMCP/WebMcpRoot';
import { APPEARANCE_BOOTSTRAP } from '@util/appearance';

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
  const originTrial = process.env.NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {originTrial ? <meta httpEquiv="origin-trial" content={originTrial} /> : null}
      </head>
      <body>
        <script dangerouslySetInnerHTML={{__html: APPEARANCE_BOOTSTRAP}} />
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <ThemeRegistry>
          {children}
          <WebMcpRoot />
          <Analytics />
          <SpeedInsights />
        </ThemeRegistry>
      </body>
    </html>
  );
}
