export function snakeCaseToTitleCase(snakeCaseString: string): string {
  if (!snakeCaseString) {
    return '';
  }

  return snakeCaseString
    .split('_') // Split by underscore
    .filter((word) => word.length > 0) // Remove empty strings if multiple underscores
  // Capitalize the first letter and lowercase the rest
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' '); // Join with spaces
}

export function displayUploadTitle(title?: string): string {
  if (!title) return 'Untitled';
  return title
    .replace(/(\.jpe?g|\.png|\.webp|\.gif)+$/ig, '')
    .replace(/_/g, ' ')
    .trim() || title;
}

export function displayArtistName(user?: {
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
} | null): string {
  if (!user) return 'Artist';
  const company = `${user.company_name || ''}`.trim();
  const first = `${user.first_name || ''}`.trim();
  const last = `${user.last_name || ''}`.trim();
  const person = [first, last].filter(Boolean).join(' ');
  return company || person || 'Artist';
}
