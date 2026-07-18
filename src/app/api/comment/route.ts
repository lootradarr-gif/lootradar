import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';
import { moderate } from '@/lib/moderation';
import { grantXp } from '@/lib/xp';

const AUTHOR = { select: { wallet: true, displayName: true, avatarUrl: true, level: true } };

// GET /api/comment?postId= — bir postun yorumları.
export async function GET(req: Request) {
  const postId = new URL(req.url).searchParams.get('postId');
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });
  const rows = await prisma.comment.findMany({
    where: { postId }, orderBy: { createdAt: 'asc' }, take: 100, include: { author: AUTHOR },
  });
  return NextResponse.json({ comments: rows.map((c) => ({ id: c.id, text: c.text, createdAt: c.createdAt.toISOString(), author: c.author })) });
}

// POST /api/comment { postId, text } — yorum (oturum + moderasyon + XP).
export async function POST(req: Request) {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  if (!wallet) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { wallet }, select: { banned: true } });
  if (me?.banned) return NextResponse.json({ error: 'Your account is restricted.' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const postId = String(body.postId || '');
  const text = String(body.text || '').trim().slice(0, 300);
  const mod = moderate(text);
  if (!mod.ok) return NextResponse.json({ error: mod.reason }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const [comment] = await prisma.$transaction([
    prisma.comment.create({ data: { postId: post.id, authorWallet: wallet, text }, include: { author: AUTHOR } }),
    prisma.post.update({ where: { id: post.id }, data: { commentCount: { increment: 1 } } }),
  ]);
  await grantXp(wallet, 'comment');

  return NextResponse.json({ ok: true, comment: { id: comment.id, text: comment.text, createdAt: comment.createdAt.toISOString(), author: comment.author } });
}
