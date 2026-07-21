import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';

const authed = () => verifySession(cookies().get(ADMIN_COOKIE)?.value);

// DELETE: yorumu sil + post.commentCount düş.
export async function DELETE(req: Request) {
  if (!authed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const c = await prisma.comment.findUnique({ where: { id: String(id) }, select: { postId: true } });
  if (!c) return NextResponse.json({ ok: true });
  await prisma.$transaction([
    prisma.comment.delete({ where: { id: String(id) } }),
    prisma.post.update({ where: { id: c.postId }, data: { commentCount: { decrement: 1 } } }),
  ]);
  return NextResponse.json({ ok: true });
}
