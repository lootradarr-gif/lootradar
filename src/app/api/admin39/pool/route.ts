import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { POOL_MIN_HOLD, minHoldRaw, weekKey, weekRange, daysOfWeek, shareOut } from '@/lib/pool';
import { tokenBalance } from '@/lib/spl-verify';
import { LOOT, lootLive } from '@/lib/token';

const authed = () => verifySession(cookies().get(ADMIN_COOKIE)?.value);

// POST — haftalık havuzu AÇ veya SETTLE et.
//   { action:'open', poolLoot, week? }   → o hafta için havuz tanımla (tekrar çağrılırsa günceller)
//   { action:'settle', week?, dryRun? }  → uygunluk + payları hesapla, PoolEntry'ye yaz
//
// SETTLE geri alınamaz olduğu için dryRun DESTEKLİ: önce önizle, sonra çalıştır.
// weekKey @unique + settledAt kontrolü → aynı hafta iki kez settle edilemez.
export async function POST(req: Request) {
  if (!authed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || '');
  const wk = String(b.week || weekKey());
  const { start, end } = weekRange();

  if (action === 'open') {
    const poolLoot = Math.max(0, Number(b.poolLoot) || 0);
    const round = await prisma.poolRound.upsert({
      where: { weekKey: wk },
      create: { weekKey: wk, poolLoot, minHold: POOL_MIN_HOLD, startsAt: start, endsAt: end },
      update: { poolLoot },
    });
    return NextResponse.json({ ok: true, round });
  }

  if (action === 'settle') {
    if (!lootLive()) return NextResponse.json({ error: 'token_not_live' }, { status: 503 });
    const round = await prisma.poolRound.findUnique({ where: { weekKey: wk } });
    if (!round) return NextResponse.json({ error: 'round_not_open' }, { status: 404 });
    if (round.settledAt) return NextResponse.json({ error: 'already_settled', settledAt: round.settledAt }, { status: 409 });

    const grouped = await prisma.xpLog.groupBy({
      by: ['wallet'], where: { day: { in: daysOfWeek() } },
      _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } }, take: 200,
    });
    const all = grouped.map((g) => ({ wallet: g.wallet, xp: g._sum.amount ?? 0 })).filter((r) => r.xp > 0);

    // UYGUNLUK — zincirden bakiye. Sadece XP kazanmış cüzdanlar sorgulanır (RPC tasarrufu).
    const need = minHoldRaw();
    const checked: { wallet: string; xp: number; balance: number; eligible: boolean }[] = [];
    for (const r of all) {
      const raw = await tokenBalance(r.wallet, LOOT.mint);
      checked.push({ ...r, balance: Number(raw) / 10 ** LOOT.decimals, eligible: raw >= need });
    }
    const eligible = checked.filter((c) => c.eligible);
    const shares = shareOut(round.poolLoot, eligible);

    const rows = checked.map((c) => ({ ...c, amount: shares.get(c.wallet) ?? 0 }));
    const distributed = rows.reduce((a, r) => a + r.amount, 0);

    if (b.dryRun) {
      return NextResponse.json({ ok: true, dryRun: true, weekKey: wk, poolLoot: round.poolLoot,
        candidates: rows.length, eligible: eligible.length, distributed, rows });
    }

    await prisma.$transaction([
      prisma.poolEntry.deleteMany({ where: { roundId: round.id } }),
      prisma.poolEntry.createMany({
        data: rows.map((r) => ({ roundId: round.id, wallet: r.wallet, xp: r.xp, balance: r.balance, eligible: r.eligible, amount: r.amount })),
      }),
      prisma.poolRound.update({ where: { id: round.id }, data: { settledAt: new Date() } }),
    ]);
    return NextResponse.json({ ok: true, weekKey: wk, eligible: eligible.length, distributed, rows });
  }

  return NextResponse.json({ error: 'bad_action' }, { status: 400 });
}

// GET — geçmiş turlar + kazananlar (ödeme takibi için)
export async function GET() {
  if (!authed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const rounds = await prisma.poolRound.findMany({
    orderBy: { startsAt: 'desc' }, take: 20,
    include: { entries: { where: { amount: { gt: 0 } }, orderBy: { amount: 'desc' } } },
  });
  return NextResponse.json({ rounds });
}
