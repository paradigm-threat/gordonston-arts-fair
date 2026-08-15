'use client';

import React, {useEffect, useState} from 'react';
import {
  APPEARANCE_COOKIE,
  APPEARANCE_OPTIONS,
  APPEARANCE_STORAGE_KEY,
  isAppearancePreference,
  resolveAppearance,
  type AppearancePreference,
  type ResolvedTheme,
} from '@util/appearance';

const APPEARANCE_CHANGE_EVENT = 'gaf-appearance';

function readStoredPreference(): AppearancePreference {
  try {
    const stored = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (isAppearancePreference(stored)) return stored;
  } catch {
    // Ignore private-mode / blocked storage.
  }
  return 'system';
}

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyResolvedTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
}

export function persistAppearancePreference(preference: AppearancePreference) {
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, preference);
  } catch {
    // Ignore private-mode / blocked storage.
  }
  document.cookie = `${APPEARANCE_COOKIE}=${preference}; path=/; max-age=31536000; SameSite=Lax`;
  applyResolvedTheme(resolveAppearance(preference, systemPrefersDark()));
  window.dispatchEvent(new Event(APPEARANCE_CHANGE_EVENT));
}

export function subscribeToAppearance(onChange: (theme: ResolvedTheme) => void) {
  const emit = () => {
    onChange(resolveAppearance(readStoredPreference(), systemPrefersDark()));
  };
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', emit);
  window.addEventListener(APPEARANCE_CHANGE_EVENT, emit);
  emit();
  return () => {
    media.removeEventListener('change', emit);
    window.removeEventListener(APPEARANCE_CHANGE_EVENT, emit);
  };
}

export function AppearanceSelect() {
  const [preference, setPreference] = useState<AppearancePreference>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setPreference(readStoredPreference());
    sync();
    setHydrated(true);
    window.addEventListener(APPEARANCE_CHANGE_EVENT, sync);
    return () => window.removeEventListener(APPEARANCE_CHANGE_EVENT, sync);
  }, []);

  return (
    <label className="appearance-control">
      Appearance
      <select
        aria-label="Appearance"
        name="appearance"
        data-hydrated={hydrated ? 'true' : 'false'}
        value={preference}
        onChange={(event) => {
          const next = event.target.value;
          if (!isAppearancePreference(next)) return;
          setPreference(next);
          persistAppearancePreference(next);
        }}
      >
        {APPEARANCE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
