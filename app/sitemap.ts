import type { MetadataRoute } from 'next';

const SITE = 'https://gordonstonartfair.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE}/`,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE}/apply`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE}/terms`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
