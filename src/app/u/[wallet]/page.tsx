import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';
import { ProfileHeader, type ProfileData } from '@/components/ProfileHeader';
import { CommunityFeed } from '@/components/CommunityFeed';

export const dynamic = 'force-dynamic';
const AUTHOR = { select: { wallet: true, displayName: true, avatarUrl: true, level: true } };

export default async function ProfilePage({ params }: { params: { wallet: string } }) {
  const wallet = params.wallet;
  const sessionWallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  const isOwner = sessionWallet === wallet;

  const user = await prisma.user.findUnique({
    where: { wallet },
    select: { wallet: true, displayName: true, avatarUrl: true, bio: true, xp: true, banned: true, createdAt: true },
  });

  if (user?.banned) {
    return <div className="mx-auto max-w-md pt-24 text-center text-dim">This profile is unavailable.</div>;
  }

  const profile: ProfileData = {
    wallet,
    displayName: user?.displayName ?? null,
    avatarUrl: user?.avatarUrl ?? null,
    bio: user?.bio ?? '',
    xp: user?.xp ?? 0,
    joined: user ? user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null,
  };

  const rows = await prisma.post.findMany({
    where: { authorWallet: wallet },
    take: 20, orderBy: { createdAt: 'desc' },
    include: { author: AUTHOR, game: { select: { slug: true, name: true } }, ...(sessionWallet ? { likes: { where: { wallet: sessionWallet }, select: { wallet: true } } } : {}) },
  });
  const posts = rows.map((p: any) => ({
    id: p.id, text: p.text, imageUrl: p.imageUrl, createdAt: p.createdAt.toISOString(),
    likeCount: p.likeCount, commentCount: p.commentCount, pinned: p.pinned,
    likedByMe: sessionWallet ? (p.likes?.length ?? 0) > 0 : false, author: p.author, game: p.game,
  }));

  return (
    <div className="mx-auto max-w-2xl pt-8">
      <ProfileHeader profile={profile} isOwner={isOwner} />
      <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-faint">Posts</h2>
      <CommunityFeed initial={posts} nextCursor={null} hideComposer />
    </div>
  );
}
