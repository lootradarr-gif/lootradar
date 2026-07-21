import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';
import { CommunityFeed } from '@/components/CommunityFeed';
import { TopRadar } from '@/components/TopRadar';

export const dynamic = 'force-dynamic';

const AUTHOR = { select: { wallet: true, displayName: true, avatarUrl: true, level: true } };

export default async function Community() {
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);

  const [rows, games] = await Promise.all([
    prisma.post.findMany({
      take: 20,
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      include: { author: AUTHOR, game: { select: { slug: true, name: true } }, ...(wallet ? { likes: { where: { wallet }, select: { wallet: true } } } : {}) },
    }),
    prisma.game.findMany({ where: { reviewStatus: 'APPROVED' }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  const posts = rows.map((p: any) => ({
    id: p.id, text: p.text, imageUrl: p.imageUrl, createdAt: p.createdAt.toISOString(),
    likeCount: p.likeCount, commentCount: p.commentCount, pinned: p.pinned,
    likedByMe: wallet ? (p.likes?.length ?? 0) > 0 : false, author: p.author, game: p.game,
  }));

  return (
    <div className="mx-auto max-w-5xl pt-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold sm:text-3xl">Community</h1>
        <p className="mt-1 text-sm text-dim">Post, discuss games, and earn XP. Top contributors may be rewarded when $LOOT lands.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <CommunityFeed initial={posts} nextCursor={rows.length === 20 ? rows[rows.length - 1].id : null} games={games} />
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <TopRadar limit={15} />
        </aside>
      </div>
    </div>
  );
}
