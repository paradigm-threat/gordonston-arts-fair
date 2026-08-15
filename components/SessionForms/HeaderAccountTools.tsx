'use client';

import React from 'react';
import {AppearanceSelect} from '@components/Theme/AppearanceSelect';
import {ClerkSessionContent} from '@components/SessionForms/ClerkSessionContent';

export function HeaderAccountTools() {
  return (
    <div className="header-tools">
      <AppearanceSelect />
      <ClerkSessionContent />
    </div>
  );
}
