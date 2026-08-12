import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Redirecting',
  robots: { index: false, follow: false },
};

export default function RedirectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
