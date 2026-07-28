import type { MetadataRoute } from 'next'

const SITE = 'https://gordonstonartfair.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/profile',
        '/profile/',
        '/user',
        '/user/',
        '/db',
        '/logs',
        '/payment/',
        '/redirect',
        '/test/',
      ],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
