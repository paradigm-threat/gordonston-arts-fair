import type {UserStatus} from '@types';

export function getTimeSpan(startDate: Date, endDate: Date) {
  const diffMilliseconds = endDate.getTime() - startDate.getTime();

  // Calculate total days
  const totalDays = Math.floor(diffMilliseconds / (1000 * 60 * 60 * 24));

  // Calculate months (approximate, as months have varying days)
  const months = Math.floor(totalDays / 30.44); // Average days in a month

  // Calculate remaining days after accounting for full months
  const remainingDaysAfterMonths = totalDays % 30.44;

  // Calculate weeks from remaining days
  const weeks = Math.floor(remainingDaysAfterMonths / 7);

  // Calculate remaining days after accounting for full weeks
  const days = Math.floor(remainingDaysAfterMonths % 7);

  const result = [];
  if (months > 0) {
    result.push(`${months} month${months !== 1 ? 's' : ''}`);
  }
  if (weeks > 0) {
    result.push(`${weeks} week${weeks !== 1 ? 's' : ''}`);
  }
  if (days > 0 || result.length === 0) { // Always include days
    result.push(`${result.length > 0 ? ' and ' : ''}${days} day${days !== 1 ? 's' : ''}`);
  }
  return result.join(', ');
}

export function formatDate(date: Date, showDayName = true, showYear = true) {
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  const ordinalSuffix = getOrdinalSuffix(day);

  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = weekday[date.getDay()];

  return `${showDayName ? `${dayName}, ` : ''
  }${month} ${day}${ordinalSuffix}${
    showYear ? `, ${year}` : ''}`;
}

function getOrdinalSuffix(day: number) {
  if (day > 3 && day < 21) return 'th'; // Handles 11th, 12th, 13th
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export type RegistrationPhase = 'not-yet-open' | 'open' | 'closed';

/** Fair calendar dates are interpreted in Eastern Time. */
export const REGISTRATION_TIME_ZONE = 'America/New_York';

/**
 * Format a fair deadline in America/New_York with an explicit end-of-day time.
 * Use for registration/grace/booth cutoffs so artists are never left guessing timezone.
 */
export function formatEasternEndOfDayDeadline(date: Date, showDayName = true): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: REGISTRATION_TIME_ZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  const dayNum = Number(map.day);
  const dateCore = `${map.month} ${dayNum}${getOrdinalSuffix(dayNum)}, ${map.year}`;
  const dayPrefix = showDayName && map.weekday ? `${map.weekday}, ` : '';
  return `${dayPrefix}${dateCore}, 11:59 PM Eastern Time`;
}

export type RegistrationCheckoutUser = {
  status?: UserStatus | string | null;
  createdAt?: Date | string | null;
};

function parseEnvDateYmd(envValue: string | undefined): string | null {
  const match = `${envValue || ''}`.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return asUTC - date.getTime();
}

/** Convert a wall-clock datetime in `timeZone` to a UTC Date. */
export function zonedLocalDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone = REGISTRATION_TIME_ZONE,
): Date {
  let utc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = getTimeZoneOffsetMs(utc, timeZone);
  utc = new Date(Date.UTC(year, month - 1, day, hour, minute, second) - offset);
  const offset2 = getTimeZoneOffsetMs(utc, timeZone);
  if (offset2 !== offset) {
    utc = new Date(Date.UTC(year, month - 1, day, hour, minute, second) - offset2);
  }
  return utc;
}

/**
 * Instant when the given calendar date (YYYY-MM-DD) ends in Eastern Time
 * — i.e. the start of the next calendar day in America/New_York.
 */
export function endOfZonedCalendarDay(ymd: string, timeZone = REGISTRATION_TIME_ZONE): Date {
  const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error(`Invalid calendar date: ${ymd}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Start of the following day in the zone
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return zonedLocalDateTimeToUtc(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
    0,
    0,
    0,
    timeZone,
  );
}

export function getRegistrationOpenDate() {
  return new Date(`${process.env.NEXT_PUBLIC_REGISTRATION_OPEN_DATE}`);
}

export function getRegistrationEndDate() {
  return new Date(`${process.env.NEXT_PUBLIC_REGISTRATION_END_DATE}`);
}

export function getRegistrationFeeDueDate() {
  return new Date(`${process.env.NEXT_PUBLIC_REGISTRATION_FEE_DATE}`);
}

/**
 * Extra calendar days after REGISTRATION_END_DATE that pre-close accounts
 * may still pay the registration fee. 0 / unset = no grace.
 * Example: end 2026-10-05 + 5 days → grace through end of 2026-10-10 Eastern.
 */
export function getRegistrationPaymentGraceDays(): number {
  const raw = `${process.env.NEXT_PUBLIC_REGISTRATION_PAYMENT_GRACE_DAYS || ''}`.trim();
  if (!raw) return 0;
  const days = Number.parseInt(raw, 10);
  if (!Number.isFinite(days) || days <= 0) return 0;
  return days;
}

function addCalendarDaysToYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function getRegistrationEndDateFromYmd(ymd: string) {
  // Display helper: noon Eastern on that calendar day
  const [y, m, d] = ymd.split('-').map(Number);
  return zonedLocalDateTimeToUtc(y, m, d, 12, 0, 0);
}

/** Calendar day (noon Eastern) when grace payment ends; null if no grace. */
export function getRegistrationPaymentGraceDate(): Date | null {
  const endYmd = parseEnvDateYmd(process.env.NEXT_PUBLIC_REGISTRATION_END_DATE);
  const days = getRegistrationPaymentGraceDays();
  if (!endYmd || !days) return null;
  return getRegistrationEndDateFromYmd(addCalendarDaysToYmd(endYmd, days));
}

/** Public applications close at end of REGISTRATION_END_DATE (Eastern). */
export function getRegistrationPublicCloseInstant(): Date | null {
  const ymd = parseEnvDateYmd(process.env.NEXT_PUBLIC_REGISTRATION_END_DATE);
  return ymd ? endOfZonedCalendarDay(ymd) : null;
}

/** Existing-artist $15 checkout grace ends at end of (END_DATE + GRACE_DAYS) Eastern. */
export function getRegistrationPaymentGraceCloseInstant(): Date | null {
  const endYmd = parseEnvDateYmd(process.env.NEXT_PUBLIC_REGISTRATION_END_DATE);
  const days = getRegistrationPaymentGraceDays();
  if (!endYmd || !days) return null;
  return endOfZonedCalendarDay(addCalendarDaysToYmd(endYmd, days));
}

/** Public note about unpaid pre-deadline accounts; null when grace is off or over. */
export function getRegistrationGracePublicNote(now = new Date()): string | null {
  const days = getRegistrationPaymentGraceDays();
  const graceDate = getRegistrationPaymentGraceDate();
  const graceClose = getRegistrationPaymentGraceCloseInstant();
  if (!days || !graceDate || !graceClose || now >= graceClose) return null;
  return (
    `Artists who already started an application before the deadline but have not paid ` +
    `the registration fee may still sign in and pay through ${formatEasternEndOfDayDeadline(graceDate)}.`
  );
}

function isRegistrationClosedAt(now: Date) {
  const closeAt = getRegistrationPublicCloseInstant();
  return closeAt ? now >= closeAt : false;
}

export function getRegistrationPhase(now = new Date()): RegistrationPhase {
  if (now < getRegistrationOpenDate()) return 'not-yet-open';
  if (isRegistrationClosedAt(now)) return 'closed';
  return 'open';
}

/**
 * True while the public registration window is open (not grace).
 * Prefer {@link isRegistrationCheckoutAllowedForUser} for checkout.
 */
export function isRegistrationCheckoutAllowed(now = new Date()): boolean {
  return getRegistrationPhase(now) === 'open';
}

/** Account existed before the public close, or is an imported returning artist. */
export function accountExistedBeforeRegistrationClose(
  user: RegistrationCheckoutUser,
): boolean {
  if (user.status === 'imported') return true;
  const closeAt = getRegistrationPublicCloseInstant();
  if (!closeAt) return false;
  if (!user.createdAt) return false;
  const created = new Date(user.createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return created < closeAt;
}

/**
 * Registration-fee checkout: public open window, or grace period for
 * accounts that already existed before the public close.
 */
export function isRegistrationCheckoutAllowedForUser(
  user: RegistrationCheckoutUser,
  now = new Date(),
): boolean {
  if (getRegistrationPhase(now) === 'open') return true;
  if (getRegistrationPhase(now) === 'not-yet-open') return false;

  const graceClose = getRegistrationPaymentGraceCloseInstant();
  if (!graceClose || now >= graceClose) return false;
  return accountExistedBeforeRegistrationClose(user);
}

export function getRegistrationCheckoutBlockedMessage(
  user?: RegistrationCheckoutUser,
  now = new Date(),
): string {
  const phase = getRegistrationPhase(now);
  if (phase === 'not-yet-open') {
    return `Application submission is not open yet. You can save your profile now; submissions open ${formatDate(getRegistrationOpenDate())}.`;
  }
  if (phase === 'closed') {
    const graceClose = getRegistrationPaymentGraceCloseInstant();
    const graceDate = getRegistrationPaymentGraceDate();
    if (graceClose && graceDate && now < graceClose) {
      if (user && !accountExistedBeforeRegistrationClose(user)) {
        return 'Applications are closed to new applicants. Only artists who already started an application before the deadline may still pay.';
      }
      if (user && accountExistedBeforeRegistrationClose(user)) {
        return '';
      }
      return `Applications are closed to new applicants. If you already started an application, sign in and you may pay through ${formatEasternEndOfDayDeadline(graceDate)}.`;
    }
    return 'Artist registration is closed for this year\'s event.';
  }
  return '';
}

export function getEventYear(): number {
  const eventDateStr = process.env.NEXT_PUBLIC_EVENT_DATE || '';
  const yearMatch = eventDateStr.trim().match(/^(\d{4})/);
  if (yearMatch) return parseInt(yearMatch[1], 10);
  return new Date().getFullYear();
}

/** Calendar year of the most recently held Art Fair (the year before NEXT_PUBLIC_EVENT_DATE). */
export function getLastFairYear(): number {
  return getEventYear() - 1;
}

export function getApplicationStatusText(now = new Date()): string {
  const registrationOpenDateString = formatDate(getRegistrationOpenDate());
  const registrationEndDeadline = formatEasternEndOfDayDeadline(getRegistrationEndDate(), false);
  const phase = getRegistrationPhase(now);

  if (phase === 'not-yet-open') {
    return `Applications open ${registrationOpenDateString}`;
  }
  if (phase === 'closed') {
    return 'The artist application period is closed.';
  }
  return `Applications open until ${registrationEndDeadline}`;
}
