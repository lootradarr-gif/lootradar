import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';

const authed = () => verifySession(cookies().get(ADMIN_COOKIE)?.value);

// PATCH: pin/unpin. DELETE: postu sil (yorum+beğeni cascade).
export async function PATCH(req: Request) {
  if (!authed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id, pinned } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const post = await prisma.post.update({ where: { id: String(id) }, data: { pinned: !!pinned } });
  return NextResponse.json({ ok: true, pinned: post.pinned });
}

export async function DELETE(req: Request) {
  if (!authed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.post.delete({ where: { id: String(id) } });
  return NextResponse.json({ ok: true });
}
