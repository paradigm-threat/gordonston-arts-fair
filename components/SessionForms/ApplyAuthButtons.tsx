'use client';

import {SignInButton, SignUpButton} from '@clerk/nextjs';
import React from 'react';

const buttonClassName = 'rounded-md bg-blue-700 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400';

export function ApplyAuthButtons() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <SignInButton forceRedirectUrl="/redirect">
        <button type="button" className={buttonClassName}>
          Sign in
        </button>
      </SignInButton>
      <SignUpButton forceRedirectUrl="/redirect">
        <button type="button" className={buttonClassName}>
          Register Now
        </button>
      </SignUpButton>
    </div>
  );
}
