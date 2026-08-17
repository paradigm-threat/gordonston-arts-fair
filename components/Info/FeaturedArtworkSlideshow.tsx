'use client';

import React, {useCallback, useEffect, useId, useState} from 'react';
import Image from 'next/image';
import type {FeaturedArtworkItem} from '@util/featuredActions';

const SLIDE_MS = 8000;

export function FeaturedArtworkSlideshow({
  items,
  lastFairYear,
}: {
  items: FeaturedArtworkItem[];
  lastFairYear: number;
}) {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const count = items.length;
  const current = items[index] || items[0];

  const go = useCallback((delta: number) => {
    setIndex((prev) => (prev + delta + count) % count);
  }, [count]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, reduceMotion]);

  if (count === 0 || !current) return null;

  const caption = current.description
    ? current.description
    : 'No description was provided for this piece.';

  return (
    <section
      id="featured-artwork"
      className="featured-artwork"
      aria-labelledby={labelId}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <h2 id={labelId} className="featured-artwork-heading">
        Artwork from the
        {' '}
        {lastFairYear}
        {' '}
        Gordonston Art Fair
      </h2>
      <p className="featured-artwork-intro">
        These pieces were shown at last year&apos;s fair. Each slide names the artist and
        includes the description they wrote for the work.
      </p>

      <div className="featured-slide">
        <div className="featured-slide-image-wrap">
          <Image
            src={current.url}
            alt={`${current.title} by ${current.artistName}`}
            width={current.width}
            height={current.height}
            className="featured-slide-image"
            sizes="(max-width: 900px) 100vw, 900px"
            priority={index === 0}
          />
        </div>
        <div className="featured-slide-caption" aria-live="polite">
          <p className="featured-slide-title">{current.title}</p>
          <p className="featured-slide-artist">
            by
            {' '}
            {current.artistName}
          </p>
          <p className="featured-slide-description">{caption}</p>
          {count > 1 && (
            <p className="featured-slide-count">
              {index + 1}
              {' '}
              of
              {' '}
              {count}
            </p>
          )}
        </div>
      </div>

      {count > 1 && (
        <div className="featured-slide-controls">
          <button type="button" className="featured-slide-btn" onClick={() => go(-1)}>
            Previous artwork
          </button>
          {!reduceMotion && (
            <button
              type="button"
              className="featured-slide-btn"
              onClick={() => setPaused((prev) => !prev)}
              aria-pressed={paused}
            >
              {paused ? 'Play slideshow' : 'Pause slideshow'}
            </button>
          )}
          <button type="button" className="featured-slide-btn" onClick={() => go(1)}>
            Next artwork
          </button>
        </div>
      )}
    </section>
  );
}
