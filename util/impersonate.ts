export const IMPERSONATE_TICKET_KEY = 'gaf-actor-ticket';
export const IMPERSONATE_TICKET_PARAM = 'ticket';

type ClerkErrorMeta = {
  Limit?: number;
  Used?: number;
  limit?: number;
  used?: number;
};

type ClerkErrorItem = {
  message?: string;
  short_message?: string;
  shortMessage?: string;
  long_message?: string;
  longMessage?: string;
  code?: string;
  meta?: ClerkErrorMeta | string;
};

function firstClerkError(payload: unknown): ClerkErrorItem | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const obj = payload as {errors?: ClerkErrorItem[]} & ClerkErrorItem;
  if (Array.isArray(obj.errors) && obj.errors[0]) return obj.errors[0];
  if (obj.code || obj.long_message || obj.longMessage || obj.message) return obj;
  return undefined;
}

function clerkErrorMeta(meta: ClerkErrorItem['meta']): ClerkErrorMeta {
  if (!meta) return {};
  if (typeof meta === 'string') {
    try {
      return JSON.parse(meta) as ClerkErrorMeta;
    } catch {
      return {};
    }
  }
  return meta;
}

function clerkErrorDetail(err: ClerkErrorItem) {
  return err.long_message || err.longMessage || err.message || err.short_message || err.shortMessage || '';
}

function fillLimitPlaceholders(message: string, used?: number, limit?: number) {
  if (!message.includes('%d')) return message;
  if (typeof used !== 'number' || typeof limit !== 'number') {
    return message.replace(/\s*\(%d\/%d\)/g, '').replace(/\s+/g, ' ').trim();
  }
  const values = [used, limit];
  let i = 0;
  return message.replace(/%d/g, () => String(values[i++] ?? '%d'));
}

export function formatActorTokenError(payload: unknown, fallback = 'Clerk could not start impersonation.') {
  const err = firstClerkError(payload);
  const code = err?.code || '';
  const detail = err ? clerkErrorDetail(err) : '';
  const isLimit = code === 'impersonation_limit_exceeded'
    || /impersonation limit/i.test(`${code} ${detail}`);

  if (isLimit) {
    const meta = clerkErrorMeta(err?.meta);
    const used = meta.Used ?? meta.used;
    const limit = meta.Limit ?? meta.limit;
    const clerkCopy = detail
      || 'Your application has reached the impersonation limit for your plan (%d/%d). The limit will reset at the beginning of the next billing period.';
    return fillLimitPlaceholders(clerkCopy, used, limit);
  }

  return detail || fallback;
}

export function isAlreadySignedInError(err: unknown) {
  const item = firstClerkError(err);
  const code = item?.code || '';
  const detail = [
    item ? clerkErrorDetail(item) : '',
    err instanceof Error ? err.message : '',
  ].join(' ');
  return code === 'identifier_already_signed_in'
    || code === 'session_exists'
    || /already signed in/i.test(`${code} ${detail}`);
}

export function ticketFromLocation(search: string, hash = '') {
  const fromQuery = new URLSearchParams(search).get(IMPERSONATE_TICKET_PARAM);
  if (fromQuery) return fromQuery;
  const rawHash = hash.replace(/^#/, '');
  if (!rawHash) return null;
  if (!rawHash.includes('=')) return decodeURIComponent(rawHash);
  return new URLSearchParams(rawHash).get(IMPERSONATE_TICKET_PARAM);
}

export function impersonateRedirectPath(ticket: string) {
  return `/impersonate?${IMPERSONATE_TICKET_PARAM}=${encodeURIComponent(ticket)}`;
}

export function readImpersonationTicket() {
  const fromLocation = ticketFromLocation(window.location.search, window.location.hash);
  if (fromLocation) return fromLocation;
  try {
    return window.sessionStorage.getItem(IMPERSONATE_TICKET_KEY);
  } catch {
    return null;
  }
}

export function storeImpersonationTicket(ticket: string) {
  window.sessionStorage.setItem(IMPERSONATE_TICKET_KEY, ticket);
}

export function clearImpersonationTicket() {
  try {
    window.sessionStorage.removeItem(IMPERSONATE_TICKET_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}

export function stripImpersonationTicketFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(IMPERSONATE_TICKET_PARAM) && !url.hash) return;
  url.searchParams.delete(IMPERSONATE_TICKET_PARAM);
  url.hash = '';
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}
