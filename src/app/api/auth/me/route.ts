import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';

// Mevcut oturum kullanıcısı (yoksa null).
export async function GET() {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  if (!wallet) return NextResponse.json({ user: null });
  const user = await prisma.user.findUnique({
    where: { wallet },
    select: { wallet: true, displayName: true, avatarUrl: true, bio: true, xp: true, level: true, banned: true },
  });
  return NextResponse.json({ user: user && !user.banned ? user : null });
}

export async function DELETE() {
  cookies().delete(USER_COOKIE);
  return NextResponse.json({ ok: true });
}
