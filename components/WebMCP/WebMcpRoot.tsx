'use client';

import {useEffect} from 'react';
import {fetchOwnApplicationStatusForAgent} from '@util/profileActions';
import {
  getModelContext,
  GO_TO_PATHS,
  isGoToDestination,
  parseToolInput,
  PROFILE_FILL_FIELDS,
  type ProfileFillField,
} from '@util/webmcp';

function clickNamedButton(names: string[]) {
  const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
  const match = buttons.find((el) => names.includes((el.textContent || '').trim()));
  if (!match) return false;
  (match as HTMLElement).click();
  return true;
}

function setFieldValue(name: string, value: string) {
  const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    `[name="${name}"]`
  );
  if (!el) return false;
  let proto: typeof HTMLInputElement.prototype | typeof HTMLTextAreaElement.prototype | typeof HTMLSelectElement.prototype;
  if (el instanceof HTMLTextAreaElement) proto = HTMLTextAreaElement.prototype;
  else if (el instanceof HTMLSelectElement) proto = HTMLSelectElement.prototype;
  else proto = HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
  el.dispatchEvent(new Event('input', {bubbles: true}));
  el.dispatchEvent(new Event('change', {bubbles: true}));
  return true;
}

function highlightMissing(names: string[]) {
  names.forEach((name) => {
    const el = document.querySelector<HTMLElement>(`[name="${name}"]`);
    if (!el) return;
    el.style.outline = '3px solid #c00';
    el.scrollIntoView({behavior: 'smooth', block: 'center'});
  });
}

export function WebMcpRoot() {
  useEffect(() => {
    const modelContext = getModelContext();
    if (!modelContext) return undefined;

    const abort = new AbortController();
    const {signal} = abort;

    const tools = [
      {
        name: 'get_application_status',
        description: 'Return whether the visitor is signed in, profile completeness, photo count, and whether this year\'s registration fee is paid.',
        inputSchema: {type: 'object', properties: {}},
        execute: async () => fetchOwnApplicationStatusForAgent(),
      },
      {
        name: 'go_to',
        description: 'Navigate to a Gordonston Art Fair page: home, apply, sign-in, profile, edit, uploads, or pay-registration.',
        inputSchema: {
          type: 'object',
          properties: {
            destination: {
              type: 'string',
              enum: Object.keys(GO_TO_PATHS),
            },
          },
          required: ['destination'],
        },
        execute: async (input?: unknown) => {
          const destination = `${parseToolInput(input).destination || ''}`;
          if (!isGoToDestination(destination)) {
            return {ok: false, message: 'Unknown destination.'};
          }
          window.location.assign(GO_TO_PATHS[destination]);
          return {ok: true, destination, url: GO_TO_PATHS[destination]};
        },
      },
      {
        name: 'start_sign_in',
        description: 'Open the Sign in dialog for a returning artist. Does not create an account.',
        inputSchema: {type: 'object', properties: {}},
        execute: async () => {
          const clicked = clickNamedButton(['Sign in']);
          if (!clicked) {
            window.location.assign('/apply#registration');
            return {ok: true, message: 'Opened the apply page. Use Sign in, not Register Now.'};
          }
          return {ok: true, message: 'Opened Sign in.'};
        },
      },
      {
        name: 'start_register',
        description: 'Open Register Now for a new artist. Returning artists should use start_sign_in instead.',
        inputSchema: {type: 'object', properties: {}},
        execute: async () => {
          const clicked = clickNamedButton(['Register Now']);
          if (!clicked) {
            window.location.assign('/apply#registration');
            return {ok: true, message: 'Opened the apply page for registration.'};
          }
          return {ok: true, message: 'Opened Register Now.'};
        },
      },
      {
        name: 'fill_profile',
        description: 'Fill labeled artist profile fields on /profile/edit. Does not submit the form or take payment.',
        inputSchema: {
          type: 'object',
          properties: Object.fromEntries(
            PROFILE_FILL_FIELDS.map((field) => [field, {type: 'string'}])
          ),
        },
        execute: async (input?: unknown) => {
          if (!window.location.pathname.startsWith('/profile/edit')) {
            return {
              ok: false,
              message: 'Open /profile/edit first, then call fill_profile again.',
              nextUrl: '/profile/edit',
            };
          }
          const values = parseToolInput(input);
          const filled: string[] = [];
          const missing: string[] = [];
          PROFILE_FILL_FIELDS.forEach((field: ProfileFillField) => {
            const raw = values[field];
            if (typeof raw !== 'string' || !raw.trim()) return;
            if (setFieldValue(field, raw.trim())) filled.push(field);
            else missing.push(field);
          });
          return {ok: true, filled, missing};
        },
      },
      {
        name: 'validate_application',
        description: 'Check the signed-in artist application against the same completeness rules as the site. Never clicks Pay.',
        inputSchema: {type: 'object', properties: {}},
        execute: async () => {
          const status = await fetchOwnApplicationStatusForAgent();
          if (!status.loggedIn) {
            return {
              ok: false,
              looksGood: false,
              message: 'Not signed in. Use start_sign_in for returning artists.',
              nextUrl: '/apply#registration',
            };
          }
          const missingFields: string[] = [];
          if (window.location.pathname.startsWith('/profile/edit')) {
            const required = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state', 'zipcode', 'category', 'description'];
            required.forEach((name) => {
              const el = document.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${name}"]`);
              if (!el || !`${el.value || ''}`.trim()) missingFields.push(name);
            });
            highlightMissing(missingFields);
          }
          const looksGood = status.complete && status.photoCount > 0;
          return {
            ok: true,
            looksGood,
            ...status,
            missingFields,
            payNote: 'Do not click Pay Registration Fee for the artist. Ask them to review the preview and pay themselves.',
          };
        },
      },
    ];

    tools.forEach((tool) => {
      try {
        void modelContext.registerTool(tool, {signal});
      } catch {
        // Unsupported browsers must stay unchanged.
      }
    });

    return () => abort.abort();
  }, []);

  return null;
}
