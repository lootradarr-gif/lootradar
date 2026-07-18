import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, buildSignInMessage, verifyNonce, verifySignature, makeUserSession } from '@/lib/user-auth';

// İstemci: nonce'ı imzalar → burası doğrular → User upsert + oturum cookie'si.
export async function POST(req: Request) {
  const { wallet, nonce, signature } = await req.json().catch(() => ({}));
  const w = String(wallet || '').trim();
  if (!w || w.length < 32 || w.length > 44) return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });
  if (!verifyNonce(String(nonce || ''))) return NextResponse.json({ error: 'Nonce expired — try again' }, { status: 400 });

  const message = buildSignInMessage(w, String(nonce));
  if (!verifySignature(w, message, String(signature || ''))) {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { wallet: w },
    create: { wallet: w },
    update: {},
    select: { wallet: true, displayName: true, avatarUrl: true, xp: true, level: true, banned: true },
  });
  if (user.banned) return NextResponse.json({ error: 'This wallet is banned.' }, { status: 403 });

  cookies().set(USER_COOKIE, makeUserSession(w), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 30 * 86_400,
  });
  return NextResponse.json({ ok: true, user });
}
