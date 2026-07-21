import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';

// POST /api/favorite { gameId } — favoriye ekle/çıkar (toggle). Oturum gerekli.
export async function POST(req: Request) {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  if (!wallet) return NextResponse.json({ error: 'Sign in to save favorites' }, { status: 401 });

  const { gameId } = await req.json().catch(() => ({}));
  const id = String(gameId || '');
  const game = await prisma.game.findFirst({ where: { OR: [{ id }, { slug: id }] }, select: { id: true } });
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const existing = await prisma.favorite.findUnique({ where: { wallet_gameId: { wallet, gameId: game.id } } });
  if (existing) {
    await prisma.favorite.delete({ where: { wallet_gameId: { wallet, gameId: game.id } } });
    return NextResponse.json({ ok: true, favorited: false });
  }
  // yeni kullanıcı yoksa oluştur (favori kaydı için User FK gerekli)
  await prisma.user.upsert({ where: { wallet }, create: { wallet }, update: {} });
  await prisma.favorite.create({ data: { wallet, gameId: game.id } });
  return NextResponse.json({ ok: true, favorited: true });
}
