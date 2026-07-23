import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';
import { grantXp } from '@/lib/xp';
import { passesAntibot, logIp } from '@/lib/antibot';

const utcDay = () => new Date().toISOString().slice(0, 10);

// GET /api/vote[?gameId=] — bugün oy verdim mi + (gameId verilirse) o oyunun CANLI voteCount'u.
// Canlı sayı → game sayfası ISR-cache'li olsa da buton doğru sayıyı gösterir (bayat 0 görünmez).
export async function GET(req: Request) {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  const gameId = new URL(req.url).searchParams.get('gameId');
  let count: number | undefined;
  if (gameId) {
    const g = await prisma.game.findFirst({ where: { OR: [{ id: gameId }, { slug: gameId }] }, select: { voteCount: true } });
    count = g?.voteCount;
  }
  if (!wallet) return NextResponse.json({ votedToday: false, gameId: null, count });
  const v = await prisma.vote.findUnique({ where: { voterWallet_day: { voterWallet: wallet, day: utcDay() } }, select: { gameId: true } });
  return NextResponse.json({ votedToday: !!v, gameId: v?.gameId ?? null, count });
}

// POST /api/vote { gameId } — günde 1 oy. Oy = puan (voteCount) + XP.
export async function POST(req: Request) {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  if (!wallet) return NextResponse.json({ error: 'Sign in to vote' }, { status: 401 });
  const { gameId } = await req.json().catch(() => ({}));
  const key = String(gameId || '');
  const game = await prisma.game.findFirst({ where: { OR: [{ id: key }, { slug: key }], reviewStatus: 'APPROVED' }, select: { id: true } });
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const day = utcDay();
  const already = await prisma.vote.findUnique({ where: { voterWallet_day: { voterWallet: wallet, day } } });
  if (already) return NextResponse.json({ error: "You already voted today — come back tomorrow." }, { status: 409 });

  // anti-bot: hesap yaşı >=24h + IP/gün limiti
  const ab = await passesAntibot(req, wallet, 'vote');
  if (!ab.ok) return NextResponse.json({ error: ab.error }, { status: 429 });

  try {
    const [, g] = await prisma.$transaction([
      prisma.vote.create({ data: { gameId: game.id, voterWallet: wallet, day } }),
      prisma.game.update({ where: { id: game.id }, data: { voteCount: { increment: 1 } }, select: { voteCount: true } }),
    ]);
    await grantXp(wallet, 'vote');
    await logIp(ab.ipHash, 'vote');
    return NextResponse.json({ ok: true, voteCount: g.voteCount });
  } catch {
    return NextResponse.json({ error: 'You already voted today.' }, { status: 409 });
  }
}
