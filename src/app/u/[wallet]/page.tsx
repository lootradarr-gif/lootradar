import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';
import { levelProgress } from '@/lib/levels';
import { ProfileHeader, type ProfileData } from '@/components/ProfileHeader';
import { CommunityFeed } from '@/components/CommunityFeed';
import { XConnect } from '@/components/XConnect';
import { Emoji } from '@/components/Emoji';
import { daysOfWeek, weekKey, POOL_TOP_N } from '@/lib/pool';

export const dynamic = 'force-dynamic';
const AUTHOR = { select: { wallet: true, displayName: true, avatarUrl: true, level: true } };
const GAMESEL = { select: { slug: true, name: true, icon: true, iconUrl: true } };

export default async function ProfilePage({ params }: { params: { wallet: string } }) {
  const wallet = params.wallet;
  const sessionWallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  const isOwner = sessionWallet === wallet;

  const user = await prisma.user.findUnique({
    where: { wallet },
    select: { wallet: true, displayName: true, avatarUrl: true, bio: true, xp: true, banned: true, createdAt: true, xHandle: true },
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

  const [rows, favs, voteRows, postCount, commentCount, voteCount,
         weekXpAgg, xShareCount, ahead, likesGiven, round] = await Promise.all([
    prisma.post.findMany({
      where: { authorWallet: wallet }, take: 20, orderBy: { createdAt: 'desc' },
      include: { author: AUTHOR, game: { select: { slug: true, name: true } }, ...(sessionWallet ? { likes: { where: { wallet: sessionWallet }, select: { wallet: true } } } : {}) },
    }),
    prisma.favorite.findMany({ where: { wallet }, take: 24, orderBy: { createdAt: 'desc' }, include: { game: GAMESEL } }),
    prisma.vote.findMany({ where: { voterWallet: wallet }, take: 60, orderBy: { createdAt: 'desc' }, include: { game: GAMESEL } }),
    prisma.post.count({ where: { authorWallet: wallet } }),
    prisma.comment.count({ where: { authorWallet: wallet } }),
    prisma.vote.count({ where: { voterWallet: wallet } }),
    // bu haftanın XP'si — havuz payı buna göre hesaplanıyor
    prisma.xpLog.aggregate({ where: { wallet, day: { in: daysOfWeek() } }, _sum: { amount: true } }),
    prisma.xShare.count({ where: { wallet } }),
    // küresel XP sırası: kaç kullanıcının XP'si daha yüksek
    prisma.user.count({ where: { xp: { gt: user?.xp ?? 0 }, banned: false } }),
    prisma.postLike.count({ where: { wallet } }),
    prisma.poolRound.findUnique({ where: { weekKey: weekKey() } }),
  ]);
  const weekXp = weekXpAgg._sum.amount ?? 0;

  // haftalık XP sıralamasında bu cüzdan kaçıncı? (havuz payı için)
  const weekBoard = await prisma.xpLog.groupBy({
    by: ['wallet'], where: { day: { in: daysOfWeek() } },
    _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } }, take: 100,
  });
  const weekRank = weekBoard.findIndex((g) => g.wallet === wallet) + 1;  // 0 = listede yok
  const topSum = weekBoard.slice(0, POOL_TOP_N).reduce((a, g) => a + (g._sum.amount ?? 0), 0);
  const poolShare = round && weekRank > 0 && weekRank <= POOL_TOP_N && topSum > 0
    ? Math.floor((round.poolLoot * weekXp) / topSum) : 0;

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

      {/* ── HAVUZ DURUMU — bu haftaki kazanç ── */}
      <Link href="/pool" className="card card-hover mt-4 block overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
          <Emoji e="🏆" size={18} />
          <span className="flex-1 text-sm font-black text-ink">Community Pool · {weekKey()}</span>
          <span className="text-[11px] font-semibold text-acc">View pool →</span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-line">
          <div className="p-3 text-center">
            <div className="mono text-lg font-black text-ink">{weekXp}</div>
            <div className="text-[10px] uppercase tracking-wide text-faint">XP this week</div>
          </div>
          <div className="p-3 text-center">
            <div className="mono text-lg font-black text-ink">{weekRank > 0 ? `#${weekRank}` : '—'}</div>
            <div className="text-[10px] uppercase tracking-wide text-faint">Weekly rank</div>
          </div>
          <div className="p-3 text-center">
            <div className={`mono text-lg font-black ${poolShare > 0 ? 'text-gold' : 'text-faint'}`}>
              {poolShare > 0 ? poolShare.toLocaleString('en-US') : '0'}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-faint">$LOOT share</div>
          </div>
        </div>
        {poolShare === 0 && (
          <div className="border-t border-line bg-panel2/50 px-4 py-2 text-[11px] text-dim">
            {weekRank > 0
              ? `Currently outside the top ${POOL_TOP_N} — keep earning XP to break in.`
              : 'No XP earned this week yet. Post, comment or vote to enter the pool.'}
          </div>
        )}
      </Link>

      {/* ── X BAĞLANTISI (sadece sahibine) ── */}
      {isOwner && <div className="mt-4"><XConnect /></div>}

      {/* XP / level + istatistik */}
      <div className="mt-4 card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-gold">Level {lp.lv}</span>
          <span className="mono text-xs text-faint">{profile.xp} / {lp.next} XP</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-panel2">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${lp.pct}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          <Stat n={postCount} l="Posts" />
          <Stat n={commentCount} l="Replies" />
          <Stat n={voteCount} l="Votes" />
          <Stat n={likesGiven} l="Likes" />
          <Stat n={xShareCount} l="X posts" />
          <Stat n={favs.length} l="Watchlist" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="chip"><Emoji e="📈" size={13} /> Global rank #{ahead + 1}</span>
          {user?.xHandle && (
            <a href={`https://x.com/${user.xHandle}`} target="_blank" rel="noreferrer"
              className="chip transition-colors hover:border-acc hover:text-acc">
              <Emoji e="🐦" size={13} /> @{user.xHandle}
            </a>
          )}
          {profile.joined && <span className="chip"><Emoji e="📅" size={13} /> Joined {profile.joined}</span>}
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
