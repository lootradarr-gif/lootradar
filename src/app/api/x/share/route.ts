import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';
import { grantXp } from '@/lib/xp';
import { fetchTweet, tweetIdFrom, checkShare } from '@/lib/x-verify';

// X PAYLAŞIMI → XP
//
// Doğrulama zinciri (hepsi sunucuda, hiçbiri istemciye güvenmiyor):
//   1. Oturum var mı            → cüzdan kim?
//   2. X hesabı bağlı mı        → handle ↔ cüzdan bağı önceden kanıtlanmış olmalı
//   3. Tweet gerçekten var mı   → syndication ucundan çekilir
//   4. Yazar bağlı handle mı    → başkasının gönderisi sayılmaz
//   5. İçerik + tazelik uygun mu→ siteden bahsetmeli, 7 günden yeni olmalı
//   6. Daha önce sayılmış mı    → tweetId @unique
//   7. Günlük cap dolmuş mu     → grantXp içinde

export async function GET() {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  if (!wallet) return NextResponse.json({ shares: [], today: 0 });

  const since = new Date(Date.now() - 30 * 86_400_000);
  const [shares, today] = await Promise.all([
    prisma.xShare.findMany({
      where: { wallet, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' }, take: 10,
      select: { tweetId: true, url: true, xp: true, createdAt: true },
    }),
    prisma.xpLog.count({ where: { wallet, day: new Date().toISOString().slice(0, 10), reason: 'x_share' } }),
  ]);
  return NextResponse.json({
    shares: shares.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
    today, dailyCap: 2,
  });
}

export async function POST(req: Request) {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  if (!wallet) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  const u = await prisma.user.findUnique({ where: { wallet }, select: { xHandle: true, banned: true } });
  if (u?.banned) return NextResponse.json({ error: 'Account unavailable.' }, { status: 403 });
  if (!u?.xHandle) return NextResponse.json({ error: 'Link your X account first.', needsLink: true }, { status: 400 });

  const { url } = await req.json().catch(() => ({ url: '' }));
  const id = tweetIdFrom(String(url || ''));
  if (!id) return NextResponse.json({ error: 'Paste a full X post link (x.com/…/status/…).' }, { status: 400 });

  // Erken tekrar kontrolü — ağ isteği harcamadan reddet.
  if (await prisma.xShare.findUnique({ where: { tweetId: id }, select: { id: true } })) {
    return NextResponse.json({ error: 'That post has already been counted.' }, { status: 409 });
  }

  const t = await fetchTweet(id);
  if (!t) return NextResponse.json({ error: 'Could not read that post. Is your account public?' }, { status: 404 });

  if (t.handle !== u.xHandle) {
    return NextResponse.json({ error: `That post is by @${t.handle}, not your linked account @${u.xHandle}.` }, { status: 403 });
  }

  const chk = checkShare(t);
  if (!chk.ok) return NextResponse.json({ error: chk.reason }, { status: 400 });

  // XP'yi ÖNCE ver: cap doluysa 0 döner ve gönderiyi defterde 0 XP ile yakarız —
  // böylece kullanıcı aynı tweet'i yarın tekrar gönderip cap'i aşamaz.
  const xp = await grantXp(wallet, 'x_share');

  try {
    await prisma.xShare.create({ data: { tweetId: t.id, wallet, handle: t.handle, url: String(url).slice(0, 300), xp } });
  } catch {
    return NextResponse.json({ error: 'That post has already been counted.' }, { status: 409 });
  }

  return NextResponse.json({
    ok: true, xp,
    message: xp > 0 ? `Verified — +${xp} XP` : 'Verified, but you have hit today’s limit (2 posts/day).',
  });
}
