import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE = 'https://lootradar.io';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let games: { slug: string; updatedAt: Date }[] = [];
  try {
    games = await prisma.game.findMany({ where: { reviewStatus: 'APPROVED' }, select: { slug: true, updatedAt: true } });
  } catch { /* DB erişilemezse statik sitemap döner */ }

  const staticRoutes = ['', '/rankings', '/community', '/boost', '/submit'].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: p === '' ? 1 : 0.7,
  }));

  const gameRoutes = games.map((g) => ({
    url: `${BASE}/game/${g.slug}`,
    lastModified: g.updatedAt,
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...gameRoutes];
}
