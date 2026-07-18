import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';
import { moderate } from '@/lib/moderation';
import { grantXp } from '@/lib/xp';

const AUTHOR = { select: { wallet: true, displayName: true, avatarUrl: true, level: true } };

function cleanImg(v: string): string | null | false {
  const s = (v || '').trim();
  if (!s) return null;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(s)) return s.length <= 400 * 1024 ? s : false;
  if (/^https?:\/\//i.test(s)) return s.slice(0, 500);
  return false;
}

// GET /api/post?cursor=<id> — akış (sayfalı). likedByMe için oturum cüzdanı kullanılır.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor');
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  const posts = await prisma.post.findMany({
    take: 20,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    include: { author: AUTHOR, game: { select: { slug: true, name: true } }, ...(wallet ? { likes: { where: { wallet }, select: { wallet: true } } } : {}) },
  });
  const items = posts.map((p: any) => ({
    id: p.id, text: p.text, imageUrl: p.imageUrl, createdAt: p.createdAt.toISOString(),
    likeCount: p.likeCount, commentCount: p.commentCount, pinned: p.pinned,
    likedByMe: wallet ? (p.likes?.length ?? 0) > 0 : false,
    author: p.author, game: p.game,
  }));
  return NextResponse.json({ posts: items, nextCursor: posts.length === 20 ? posts[posts.length - 1].id : null });
}

// POST /api/post — yeni post (oturum + moderasyon + XP).
export async function POST(req: Request) {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  if (!wallet) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { wallet }, select: { banned: true } });
  if (me?.banned) return NextResponse.json({ error: 'Your account is restricted.' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const text = String(body.text || '').trim().slice(0, 500);
  const mod = moderate(text);
  if (!mod.ok) return NextResponse.json({ error: mod.reason }, { status: 400 });

  const img = cleanImg(String(body.imageUrl ?? ''));
  if (img === false) return NextResponse.json({ error: 'Image must be under 400KB.' }, { status: 400 });

  let gameId: string | null = null;
  if (body.gameId) {
    const g = await prisma.game.findFirst({ where: { id: String(body.gameId), reviewStatus: 'APPROVED' }, select: { id: true } });
    gameId = g?.id ?? null;
  }

  const post = await prisma.post.create({
    data: { authorWallet: wallet, text, imageUrl: img, gameId },
    include: { author: AUTHOR, game: { select: { slug: true, name: true } } },
  });
  await grantXp(wallet, 'post');
  await grantXp(wallet, 'daily');

  return NextResponse.json({
    ok: true,
    post: { id: post.id, text: post.text, imageUrl: post.imageUrl, createdAt: post.createdAt.toISOString(), likeCount: 0, commentCount: 0, pinned: false, likedByMe: false, author: post.author, game: post.game },
  });
}
