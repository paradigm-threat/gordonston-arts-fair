import type {Metadata} from 'next';
import React, {Suspense} from 'react';
import Link from 'next/link';
import FloatingDiv from '@components/FloatingDiv/FloatingDiv';
import {ClerkSessionContent} from '@components/SessionForms/ClerkSessionContent';
import {FooterContent} from '@components/Layout/FooterContent';

import {SuspenseContent} from "@components/Suspense/SuspenseContent";

export const metadata: Metadata = {
    title: 'Artist Portal',
    description: 'Gordonston Art Fair artist account area.',
    robots: {
        index: false,
        follow: false,
    },
};

export default function ArtistLayout({
                                         children,
                                     }: Readonly<{
    children: React.ReactNode;
}>) {
    const testMode = process.env.TEST_MODE !== 'false';
    return (
        <>
            <header>
                <FloatingDiv className="header-container">
                    <Link href="/">Home</Link>
                    <Link href="/profile">Your Artist Profile</Link>
                    <Link href="/profile/edit">Edit Profile</Link>
                    <Link href="/profile/upload">Upload Images</Link>
                    <ClerkSessionContent/>
                </FloatingDiv>
            </header>
            <article role="main" className="max-w-screen-lg flex flex-col z-[2] m-auto p-4">
                {testMode && <div className="bg-red-800 text-white font-bold text-center p-2">TEST MODE</div>}
                <Suspense fallback={<SuspenseContent/>}>
                    {children}
                </Suspense>
            </article>
            <FooterContent/>
        </>
    );
}
