import type {ReactNode} from 'react';
import {
  getApplicationStatusText,
  getRegistrationPhase,
  type RegistrationPhase,
} from '@util/date';

type WhenRegistrationPhaseProps = {
  phase: RegistrationPhase | RegistrationPhase[];
  children: ReactNode;
  /** Optional clock override for tests / previews */
  now?: Date;
};

/**
 * Render children only for the current registration window
 * (not-yet-open / open / closed), evaluated at request time.
 */
export function WhenRegistrationPhase({
  phase,
  children,
  now,
}: WhenRegistrationPhaseProps) {
  const current = getRegistrationPhase(now);
  const allowed = Array.isArray(phase) ? phase : [phase];
  if (!allowed.includes(current)) return null;
  return <>{children}</>;
}

/** Header/footer status line for the current registration phase. */
export function ApplicationStatusText({now}: {now?: Date} = {}) {
  return getApplicationStatusText(now);
}
