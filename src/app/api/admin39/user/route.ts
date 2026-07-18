import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { levelFromXp } from '@/lib/levels';

const authed = () => verifySession(cookies().get(ADMIN_COOKIE)?.value);

// PATCH { wallet, banned?, xpDelta? } — kullanıcıyı ban/unban + XP ayarla (level yeniden hesaplanır).
export async function PATCH(req: Request) {
  if (!authed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const wallet = String(body.wallet || '');
  if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 });

  const data: { banned?: boolean; xp?: number; level?: number } = {};
  if (typeof body.banned === 'boolean') data.banned = body.banned;
  if (body.xpDelta != null && body.xpDelta !== '') {
    const cur = await prisma.user.findUnique({ where: { wallet }, select: { xp: true } });
    const nx = Math.max(0, (cur?.xp ?? 0) + Math.round(Number(body.xpDelta)));
    data.xp = nx; data.level = levelFromXp(nx);
  }
  const user = await prisma.user.update({
    where: { wallet }, data,
    select: { wallet: true, displayName: true, xp: true, level: true, banned: true },
  });
  return NextResponse.json({ ok: true, user });
}
