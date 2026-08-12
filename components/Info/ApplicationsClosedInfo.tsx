import React from 'react';
import {
  formatDate,
  getRegistrationOpenDate,
  getRegistrationPhase,
} from '@util/date';

/**
 * Information box when registration payment is unavailable
 * (not yet open or already closed).
 */
export default function ApplicationsClosedInfo({ now }: { now?: Date } = {}) {
  const phase = getRegistrationPhase(now);
  const eventDateStr = process.env.NEXT_PUBLIC_EVENT_DATE || '';

  let eventYear: string = '';
  if (eventDateStr) {
    const yearMatch = eventDateStr.trim().match(/^\s*(\d{4})/);
    eventYear = yearMatch ? yearMatch[1] : '';
  }

  const yearText = eventYear || 'the upcoming';
  if (phase === 'open') {
    return null;
  }

  const message =
    phase === 'not-yet-open'
      ? `Applications are not open for submission yet. Online submission opens ${formatDate(getRegistrationOpenDate())}. You can still save your profile and uploads until then.`
      : `Applications are closed for the ${yearText} Gordonston Art Fair. Please consider applying next year.`;

  return (
    <div
      style={{
        border: '1px solid var(--gold-color)',
        background: 'rgba(255, 215, 0, 0.08)',
        padding: '1rem',
        borderRadius: '8px',
      }}
      role="status"
      aria-live="polite"
    >
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
}
