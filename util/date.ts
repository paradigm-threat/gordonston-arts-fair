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

export function getRegistrationOpenDate() {
  return new Date(`${process.env.NEXT_PUBLIC_REGISTRATION_OPEN_DATE}`);
}

export function getRegistrationEndDate() {
  return new Date(`${process.env.NEXT_PUBLIC_REGISTRATION_END_DATE}`);
}

export function getRegistrationFeeDueDate() {
  return new Date(`${process.env.NEXT_PUBLIC_REGISTRATION_FEE_DATE}`);
}

function isRegistrationClosedAt(now: Date) {
  const endMatch = (process.env.NEXT_PUBLIC_REGISTRATION_END_DATE || '').trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return endMatch
    ? now >= new Date(new Date(`${endMatch[1]}T00:00:00`).getTime() + 24 * 60 * 60 * 1000)
    : false;
}

export function getRegistrationPhase(now = new Date()): RegistrationPhase {
  if (now < getRegistrationOpenDate()) return 'not-yet-open';
  if (isRegistrationClosedAt(now)) return 'closed';
  return 'open';
}

export function getApplicationStatusText(now = new Date()): string {
  const registrationOpenDateString = formatDate(getRegistrationOpenDate());
  const registrationEndDateString = formatDate(getRegistrationEndDate(), false, false);
  const phase = getRegistrationPhase(now);

  if (phase === 'not-yet-open') {
    return `Applications open ${registrationOpenDateString}`;
  }
  if (phase === 'closed') {
    return 'The artist application period is closed.';
  }
  return `Applications open until ${registrationEndDateString}`;
}
