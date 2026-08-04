import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';
import { fetchTweet, tweetIdFrom, linkCode, checksLinkCode } from '@/lib/x-verify';

// X HESABI BAĞLAMA
//
// GET  → kullanıcıya tweetlemesi gereken tek kullanımlık kodu ve mevcut bağı döner.
// POST → kodu içeren tweet'in URL'sini alır, sunucuda doğrular, handle'ı cüzdana bağlar.
//
// Kod HMAC ile cüzdandan türetiliyor: sunucu ve cüzdan sahibi dışında kimse bilemez,
// dolayısıyla kodu tweetleyebilen kişi hesabın gerçek sahibidir.

export async function GET() {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  if (!wallet) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  const u = await prisma.user.findUnique({ where: { wallet }, select: { xHandle: true, xLinkedAt: true } });
  return NextResponse.json({
    handle: u?.xHandle ?? null,
    linkedAt: u?.xLinkedAt?.toISOString() ?? null,
    code: linkCode(wallet),
  });
}

export async function POST(req: Request) {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  if (!wallet) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  const { url } = await req.json().catch(() => ({ url: '' }));
  const id = tweetIdFrom(String(url || ''));
  if (!id) return NextResponse.json({ error: 'Paste a full X post link (x.com/…/status/…).' }, { status: 400 });

  const t = await fetchTweet(id);
  if (!t) {
    return NextResponse.json(
      { error: 'Could not read that post. Make sure your account is public and the link is correct.' },
      { status: 404 },
    );
  }

  if (!checksLinkCode(t, wallet)) {
    return NextResponse.json({ error: `That post does not contain your code (${linkCode(wallet)}).` }, { status: 400 });
  }

  // Handle başka bir cüzdana bağlıysa devralınamaz — ilk bağlayan sahiptir.
  const taken = await prisma.user.findFirst({ where: { xHandle: t.handle }, select: { wallet: true } });
  if (taken && taken.wallet !== wallet) {
    return NextResponse.json({ error: `@${t.handle} is already linked to another wallet.` }, { status: 409 });
  }

  await prisma.user.upsert({
    where: { wallet },
    create: { wallet, xHandle: t.handle, xLinkedAt: new Date() },
    update: { xHandle: t.handle, xLinkedAt: new Date() },
  });

  return NextResponse.json({ ok: true, handle: t.handle, name: t.name });
}

// Bağı kaldır — handle serbest kalır, geçmiş paylaşımlar defterde durur.
export async function DELETE() {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  if (!wallet) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  await prisma.user.update({ where: { wallet }, data: { xHandle: null, xLinkedAt: null } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
