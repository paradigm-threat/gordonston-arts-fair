export function getFeaturedQueueSummary(
  pendingCount: number,
  approvedCount: number,
  declinedCount: number,
) {
  const frontPageLive = approvedCount > 0;
  return {
    pendingCount,
    approvedCount,
    declinedCount,
    frontPageLive,
    frontPageLabel: frontPageLive
      ? `The front page slideshow is showing ${approvedCount} photo${approvedCount === 1 ? '' : 's'}.`
      : 'Nothing is showing on the front page yet.',
  };
}
