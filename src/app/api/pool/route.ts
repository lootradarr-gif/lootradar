import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { POOL_MIN_HOLD, weekKey, weekRange, daysOfWeek, shareOut } from '@/lib/pool';
import { tokenBalance } from '@/lib/spl-verify';
import { LOOT, lootLive } from '@/lib/token';

export const dynamic = 'force-dynamic';

// CANLI havuz tablosu — bu haftanın XP sıralaması + tahmini paylar.
// Bakiye (uygunluk) SADECE sorgulayan kendi cüzdanı için zincirden okunur; listedeki
// herkes için okumak 100+ RPC çağrısı demek olurdu. Kesin uygunluk settle anında
// hesaplanır ve PoolEntry'ye yazılır.
export async function GET(req: Request) {
  const me = new URL(req.url).searchParams.get('wallet') || '';
  const wk = weekKey();
  const { start, end } = weekRange();

  // bu hafta dağıtılacak havuz (admin önceden açar); yoksa 0 göster
  const round = await prisma.poolRound.findUnique({ where: { weekKey: wk } });
  const pool = round?.poolLoot ?? 0;

  // haftalık XP toplamı — XpLog.day string olduğu için gün listesiyle sorgulanır
  const grouped = await prisma.xpLog.groupBy({
    by: ['wallet'],
    where: { day: { in: daysOfWeek() } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 100,
  });
  const rows = grouped.map((g) => ({ wallet: g.wallet, xp: g._sum.amount ?? 0 }));

  // isim/avatar
  const users = await prisma.user.findMany({
    where: { wallet: { in: rows.map((r) => r.wallet) } },
    select: { wallet: true, displayName: true, avatarUrl: true, level: true },
  });
  const uMap = new Map(users.map((u) => [u.wallet, u]));

  const shares = shareOut(pool, rows);
  const totalXp = rows.reduce((a, r) => a + r.xp, 0);

  // sorgulayanın kendi uygunluğu
  let mine: { wallet: string; xp: number; rank: number | null; balance: number; eligible: boolean; estimate: number } | null = null;
  if (me.length >= 32) {
    const idx = rows.findIndex((r) => r.wallet === me);
    const xp = idx >= 0 ? rows[idx].xp : 0;
    let balance = 0;
    if (lootLive()) {
      const raw = await tokenBalance(me, LOOT.mint);
      balance = Number(raw) / 10 ** LOOT.decimals;
    }
    mine = {
      wallet: me, xp, rank: idx >= 0 ? idx + 1 : null,
      balance, eligible: balance >= POOL_MIN_HOLD,
      estimate: shares.get(me) ?? 0,
    };
  }

  return NextResponse.json({
    weekKey: wk, startsAt: start.toISOString(), endsAt: end.toISOString(),
    poolLoot: pool, minHold: POOL_MIN_HOLD, totalXp, settled: !!round?.settledAt,
    rows: rows.map((r, i) => ({
      rank: i + 1, wallet: r.wallet, xp: r.xp,
      displayName: uMap.get(r.wallet)?.displayName ?? null,
      avatarUrl: uMap.get(r.wallet)?.avatarUrl ?? null,
      level: uMap.get(r.wallet)?.level ?? 1,
      estimate: shares.get(r.wallet) ?? 0,
    })),
    mine,
  });
}
