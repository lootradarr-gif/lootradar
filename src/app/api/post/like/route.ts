import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';
import { grantXp } from '@/lib/xp';

// POST /api/post/like { postId } — beğeni aç/kapa. Beğeni alınca yazara XP (self hariç).
export async function POST(req: Request) {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  if (!wallet) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  const { postId } = await req.json().catch(() => ({}));
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: String(postId) }, select: { id: true, authorWallet: true } });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const existing = await prisma.postLike.findUnique({ where: { postId_wallet: { postId: post.id, wallet } } });
  if (existing) {
    await prisma.$transaction([
      prisma.postLike.delete({ where: { postId_wallet: { postId: post.id, wallet } } }),
      prisma.post.update({ where: { id: post.id }, data: { likeCount: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ ok: true, liked: false });
  }
  const [, p] = await prisma.$transaction([
    prisma.postLike.create({ data: { postId: post.id, wallet } }),
    prisma.post.update({ where: { id: post.id }, data: { likeCount: { increment: 1 } }, select: { likeCount: true } }),
  ]);
  if (post.authorWallet !== wallet) await grantXp(post.authorWallet, 'like_received');
  return NextResponse.json({ ok: true, liked: true, likeCount: p.likeCount });
}
