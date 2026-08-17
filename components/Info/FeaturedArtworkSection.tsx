import {Suspense} from 'react';
import {fetchApprovedFeaturedArtwork} from '@util/featuredActions';
import {getLastFairYear} from '@util/date';
import {FeaturedArtworkSlideshow} from '@components/Info/FeaturedArtworkSlideshow';

/** Hidden until an organizer approves at least one photo. */
export function FeaturedArtworkSection() {
  return (
    <Suspense fallback={null}>
      <ApprovedFeaturedArtwork />
    </Suspense>
  );
}

async function ApprovedFeaturedArtwork() {
  try {
    const items = await fetchApprovedFeaturedArtwork();
    if (items.length === 0) return null;
    return (
      <FeaturedArtworkSlideshow
        items={items}
        lastFairYear={getLastFairYear()}
      />
    );
  } catch (error) {
    console.error('Could not load featured artwork', error);
    return null;
  }
}
