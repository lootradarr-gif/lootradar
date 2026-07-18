import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';

const authed = () => verifySession(cookies().get(ADMIN_COOKIE)?.value);

// POST: yeni feed/event ekle. DELETE: sil.
export async function POST(req: Request) {
  if (!authed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || '').trim().slice(0, 160);
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
  const event = await prisma.event.create({
    data: { title, gameName: String(body.gameName || '').trim().slice(0, 80) },
  });
  return NextResponse.json({ ok: true, event });
}

export async function DELETE(req: Request) {
  if (!authed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.event.delete({ where: { id: String(id) } });
  return NextResponse.json({ ok: true });
}
