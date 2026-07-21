import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminDashboard, type AdminGame, type AdminEvent } from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function Admin39() {
  const authed = verifySession(cookies().get(ADMIN_COOKIE)?.value);
  if (!authed) return <AdminLogin />;

  const [rows, evs, postRows, userRows, commentRows] = await Promise.all([
    prisma.game.findMany({ orderBy: [{ reviewStatus: 'asc' }, { createdAt: 'desc' }] }),
    prisma.event.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.post.findMany({ orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }], take: 60, include: { author: { select: { displayName: true, wallet: true } }, game: { select: { name: true } } } }),
    prisma.user.findMany({ orderBy: { xp: 'desc' }, take: 100 }),
    prisma.comment.findMany({ orderBy: { createdAt: 'desc' }, take: 60, include: { author: { select: { displayName: true, wallet: true } }, post: { select: { game: { select: { name: true } } } } } }),
  ]);

  const games: AdminGame[] = rows.map((g) => ({
    id: g.id, slug: g.slug, name: g.name, ticker: g.ticker, genre: g.genre, desc: g.desc,
    about: g.about, onlineApiUrl: g.onlineApiUrl, discord: g.discord, telegram: g.telegram,
    icon: g.icon, iconUrl: g.iconUrl, bannerUrl: g.bannerUrl, status: g.status,
    tokenAddress: g.tokenAddress, x: g.x, site: g.site,
    playersOnline: g.playersOnline, holders: g.holders, rating: g.rating,
    mockPrice: g.mockPrice, mockMcap: g.mockMcap, mockVol24h: g.mockVol24h, mockChange24h: g.mockChange24h,
    reviewStatus: g.reviewStatus, featured: g.featured, featuredUntil: g.featuredUntil?.toISOString() ?? null, verified: g.verified, sortWeight: g.sortWeight,
    submitterWallet: g.submitterWallet, contact: g.contact, createdAt: g.createdAt.toISOString(),
  }));
  const events: AdminEvent[] = evs.map((e) => ({ id: e.id, title: e.title, gameName: e.gameName, createdAt: e.createdAt.toISOString() }));
  const posts = postRows.map((p) => ({
    id: p.id, text: p.text, authorName: p.author.displayName || p.author.wallet.slice(0, 6) + '…',
    authorWallet: p.author.wallet, gameName: p.game?.name ?? null, likeCount: p.likeCount, commentCount: p.commentCount, pinned: p.pinned, createdAt: p.createdAt.toISOString(),
  }));
  const users = userRows.map((u) => ({ wallet: u.wallet, displayName: u.displayName, xp: u.xp, level: u.level, banned: u.banned }));
  const comments = commentRows.map((c) => ({
    id: c.id, text: c.text, authorName: c.author.displayName || c.author.wallet.slice(0, 6) + '…',
    authorWallet: c.author.wallet, gameName: c.post?.game?.name ?? null, createdAt: c.createdAt.toISOString(),
  }));

  return <AdminDashboard games={games} events={events} posts={posts} users={users} comments={comments} />;
}
