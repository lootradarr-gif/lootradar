import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin39', '/api/'] },
    sitemap: 'https://lootradar.io/sitemap.xml',
    host: 'https://lootradar.io',
  };
}
