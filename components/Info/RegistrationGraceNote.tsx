import {getRegistrationGracePublicNote} from '@util/date';

type RegistrationGraceNoteProps = {
  now?: Date;
  /** Wrap in a list item when used inside deadline bullet lists */
  asListItem?: boolean;
};

/** Note next to deadline copy about the unpaid-account payment grace window. */
export function RegistrationGraceNote({
  now,
  asListItem = false,
}: RegistrationGraceNoteProps = {}) {
  const note = getRegistrationGracePublicNote(now);
  if (!note) return null;
  if (asListItem) return <li>{note}</li>;
  return <p>{note}</p>;
}
