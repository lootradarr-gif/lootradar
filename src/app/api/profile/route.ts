import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';

// Kendi profilini düzenle (ad / avatar / bio). Oturum zorunlu.
export async function PATCH(req: Request) {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  if (!wallet) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const data: { displayName?: string | null; avatarUrl?: string | null; bio?: string } = {};

  if (typeof body.displayName === 'string') {
    const n = body.displayName.trim().slice(0, 24);
    if (n && n.length < 2) return NextResponse.json({ error: 'Name too short' }, { status: 400 });
    data.displayName = n || null;
  }
  if (typeof body.bio === 'string') data.bio = body.bio.trim().slice(0, 160);
  if (typeof body.avatarUrl === 'string') {
    const v = body.avatarUrl.trim();
    if (v === '') data.avatarUrl = null;
    else if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(v)) {
      if (v.length > 256 * 1024) return NextResponse.json({ error: 'Avatar must be under 200KB' }, { status: 400 });
      data.avatarUrl = v;
    } else if (/^https?:\/\//i.test(v)) data.avatarUrl = v.slice(0, 400);
    else return NextResponse.json({ error: 'Invalid avatar' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { wallet },
    data,
    select: { wallet: true, displayName: true, avatarUrl: true, bio: true, xp: true, level: true },
  });
  return NextResponse.json({ ok: true, user });
}
