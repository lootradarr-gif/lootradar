import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchOnline } from '@/lib/online';
import { fetchHolderCount } from '@/lib/holders';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // holder sayfalaması + paralel oyunlar

// Vercel cron (6 saatte bir) veya elle tetikleme: onlineApiUrl olan oyunların online'ını,
// tokenAddress olan oyunların holder sayısını (Helius) günceller.
function authed(req: Request): boolean {
  const key = process.env.CRON_SECRET || '';
  if (!key) return true; // env yoksa (dev) serbest
  const auth = req.headers.get('authorization') || '';
  const qkey = new URL(req.url).searchParams.get('key') || '';
  return auth === `Bearer ${key}` || qkey === key;
}

export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const games = await prisma.game.findMany({
    where: { reviewStatus: 'APPROVED' },
    select: { id: true, slug: true, tokenAddress: true, onlineApiUrl: true },
  });

  let onlineUpdated = 0, holdersUpdated = 0;
  // oyunları PARALEL işle (sıralı = timeout). Her oyunun holder sayfalaması kendi içinde sıralı.
  await Promise.allSettled(games.map(async (g) => {
    const data: Record<string, unknown> = {};
    if (g.onlineApiUrl) {
      const o = await fetchOnline(g.onlineApiUrl).catch(() => null);
      if (o !== null) { data.playersOnline = o; data.onlineFetchedAt = new Date(); onlineUpdated++; }
    }
    if (g.tokenAddress) {
      const h = await fetchHolderCount(g.tokenAddress).catch(() => null);
      if (h !== null && h > 0) { data.holders = h; data.holdersFetchedAt = new Date(); holdersUpdated++; }
    }
    if (Object.keys(data).length) await prisma.game.update({ where: { id: g.id }, data }).catch(() => {});
  }));

  return NextResponse.json({ ok: true, games: games.length, onlineUpdated, holdersUpdated });
}
