import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';
import { levelProgress } from '@/lib/levels';
import { ProfileHeader, type ProfileData } from '@/components/ProfileHeader';
import { CommunityFeed } from '@/components/CommunityFeed';

export const dynamic = 'force-dynamic';
const AUTHOR = { select: { wallet: true, displayName: true, avatarUrl: true, level: true } };
const GAMESEL = { select: { slug: true, name: true, icon: true, iconUrl: true } };

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

  const [rows, favs, voteRows, postCount, commentCount, voteCount] = await Promise.all([
    prisma.post.findMany({
      where: { authorWallet: wallet }, take: 20, orderBy: { createdAt: 'desc' },
      include: { author: AUTHOR, game: { select: { slug: true, name: true } }, ...(sessionWallet ? { likes: { where: { wallet: sessionWallet }, select: { wallet: true } } } : {}) },
    }),
    prisma.favorite.findMany({ where: { wallet }, take: 24, orderBy: { createdAt: 'desc' }, include: { game: GAMESEL } }),
    prisma.vote.findMany({ where: { voterWallet: wallet }, take: 60, orderBy: { createdAt: 'desc' }, include: { game: GAMESEL } }),
    prisma.post.count({ where: { authorWallet: wallet } }),
    prisma.comment.count({ where: { authorWallet: wallet } }),
    prisma.vote.count({ where: { voterWallet: wallet } }),
  ]);

  const posts = (rows as any[]).map((p) => ({
    id: p.id, text: p.text, imageUrl: p.imageUrl, createdAt: p.createdAt.toISOString(),
    likeCount: p.likeCount, commentCount: p.commentCount, pinned: p.pinned,
    likedByMe: sessionWallet ? (p.likes?.length ?? 0) > 0 : false, author: p.author, game: p.game,
  }));

  // oy verilen oyunları tekilleştir
  const votedGames = Array.from(new Map(voteRows.map((v) => [v.game.slug, v.game])).values()).slice(0, 24);
  const lp = levelProgress(profile.xp);

  return (
    <div className="mx-auto max-w-2xl pt-8">
      <ProfileHeader profile={profile} isOwner={isOwner} />

      {/* XP / level + istatistik */}
      <div className="mt-4 card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-gold">Level {lp.lv}</span>
          <span className="mono text-xs text-faint">{profile.xp} / {lp.next} XP</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-panel2">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${lp.pct}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <Stat n={postCount} l="Posts" />
          <Stat n={commentCount} l="Replies" />
          <Stat n={voteCount} l="Votes" />
          <Stat n={favs.length} l="Watchlist" />
        </div>
      </div>

      {/* Watchlist */}
      {favs.length > 0 && (
        <Section title="Watchlist">
          <GameChips games={favs.map((f) => f.game)} />
        </Section>
      )}

      {/* Oy verdiği oyunlar */}
      {votedGames.length > 0 && (
        <Section title="Voted games">
          <GameChips games={votedGames} />
        </Section>
      )}

      <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-faint">Posts</h2>
      <CommunityFeed initial={posts} nextCursor={null} hideComposer />
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return <div><div className="mono text-lg font-bold text-ink">{n}</div><div className="text-[10px] uppercase tracking-wide text-faint">{l}</div></div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">{title}</h2>
      {children}
    </div>
  );
}
function GameChips({ games }: { games: { slug: string; name: string; icon: string; iconUrl: string | null }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {games.map((g) => (
        <Link key={g.slug} href={`/game/${g.slug}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-panel2/60 py-1 pl-1 pr-3 text-sm transition-colors hover:border-acc">
          <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-panel text-sm">
            {g.iconUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={g.iconUrl} alt="" className="h-full w-full object-cover" /> : g.icon}
          </span>
          <span className="font-medium text-ink">{g.name}</span>
        </Link>
      ))}
    </div>
  );
}
