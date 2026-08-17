export const APPEARANCE_STORAGE_KEY = 'gaf-appearance';
export const APPEARANCE_COOKIE = 'gaf-appearance';

export type AppearancePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const DEFAULT_APPEARANCE: AppearancePreference = 'system';

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

/** Dark only when the OS explicitly prefers it — not when the query is missing or no-preference. */
export function prefersDarkFromMedia(darkMatches: boolean, lightMatches: boolean) {
  return darkMatches && !lightMatches;
}

/** Inline boot script: set data-theme before paint to avoid a flash. */
export const APPEARANCE_BOOTSTRAP = `(function(){try{var k=${JSON.stringify(APPEARANCE_STORAGE_KEY)};var p=localStorage.getItem(k)||${JSON.stringify(DEFAULT_APPEARANCE)};var darkMq=window.matchMedia('(prefers-color-scheme: dark)');var lightMq=window.matchMedia('(prefers-color-scheme: light)');var systemDark=!!(darkMq&&darkMq.matches&&!(lightMq&&lightMq.matches));var d=p==='dark'||(p==='system'&&systemDark);var t=d?'dark':'light';var r=document.documentElement;r.setAttribute('data-theme',t);r.style.colorScheme=t;}catch(e){try{document.documentElement.setAttribute('data-theme','light');document.documentElement.style.colorScheme='light';}catch(_){}}})();`;
