import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, adminPassword, makeSession } from '@/lib/admin-auth';

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: '' }));
  if (String(password) !== adminPassword()) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }
  cookies().set(ADMIN_COOKIE, makeSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 86_400,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  cookies().delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
