export const APPEARANCE_STORAGE_KEY = 'gaf-appearance';
export const APPEARANCE_COOKIE = 'gaf-appearance';

export type AppearancePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const APPEARANCE_OPTIONS: {value: AppearancePreference; label: string}[] = [
  {value: 'system', label: 'System default'},
  {value: 'light', label: 'Light'},
  {value: 'dark', label: 'Dark'},
];

export function isAppearancePreference(value: string | null | undefined): value is AppearancePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function resolveAppearance(preference: AppearancePreference, systemDark = false): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return systemDark ? 'dark' : 'light';
}

/** Inline boot script: set data-theme before paint to avoid a flash. */
export const APPEARANCE_BOOTSTRAP = `(function(){try{var k=${JSON.stringify(APPEARANCE_STORAGE_KEY)};var p=localStorage.getItem(k)||'system';var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var t=d?'dark':'light';var r=document.documentElement;r.setAttribute('data-theme',t);r.style.colorScheme=t;}catch(e){}})();`;
