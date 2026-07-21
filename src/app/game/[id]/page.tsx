import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getGamesWithMarkets } from '@/lib/games';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';
import { chartEmbed } from '@/lib/dexscreener';
import { price, usd, pct, compact, timeAgo } from '@/lib/format';
import { GameIcon } from '@/components/GameIcon';
import { VoteButton } from '@/components/VoteButton';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ShareButton } from '@/components/ShareButton';
import { XTimeline } from '@/components/XTimeline';
import { GameTabs } from '@/components/GameTabs';
import { CommunityFeed } from '@/components/CommunityFeed';
import { CopyAddress } from '@/components/CopyAddress';

export const revalidate = 60;

const AUTHOR = { select: { wallet: true, displayName: true, avatarUrl: true, level: true } };

// Her oyun için özel SEO metadata (Google + paylaşım kartı)
export async function generateMetadata({ params }: { params: { id: string } }) {
  const g = await prisma.game.findUnique({
    where: { slug: params.id },
    select: { name: true, ticker: true, genre: true, desc: true, bannerUrl: true, iconUrl: true },
  });
  if (!g) return { title: 'Game not found' };
  const title = `${g.name}${g.ticker ? ` ($${g.ticker})` : ''} — live price, players & chart`;
  const description = g.desc || `Live token price, market cap, player count and chart for ${g.name} — a Solana ${g.genre} game. Track it on LootRadar.`;
  // og:image + twitter:image → opengraph-image.tsx / twitter-image.tsx (dinamik kart) OTOMATİK bağlanır.
  return {
    title, description,
    alternates: { canonical: `/game/${params.id}` },
    openGraph: { title, description, url: `https://lootradar.io/game/${params.id}`, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function GamePage({ params }: { params: { id: string } }) {
  const games = await getGamesWithMarkets();
  const g = games.find((x) => x.id === params.id);
  if (!g) notFound();

  const pre = g.status === 'PRE-TOKEN';        // rozet stili
  const noToken = !g.tokenAddress;             // token yoksa finansal metrikler — (0 değil)
  const up = g.market.change24h >= 0;
  const hasChart = !!g.tokenAddress;
  const xHandle = g.x ? (g.x.split('/').filter(Boolean).pop()?.split('?')[0] ?? '') : ''; // X kullanıcı adı (Last tweets)

  // DB id (cuid) — Post/Event gameId ile eşleştirmek için (g.id = slug)
  const dbGame = await prisma.game.findUnique({ where: { slug: params.id }, select: { id: true } });
  const dbId = dbGame?.id ?? '';
  const wallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);

  const isFav = wallet && dbId ? !!(await prisma.favorite.findUnique({ where: { wallet_gameId: { wallet, gameId: dbId } }, select: { wallet: true } })) : false;

  const [postRows, events, socialCount] = await Promise.all([
    dbId ? prisma.post.findMany({
      where: { gameId: dbId }, take: 20, orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      include: { author: AUTHOR, game: { select: { slug: true, name: true } }, ...(wallet ? { likes: { where: { wallet }, select: { wallet: true } } } : {}) },
    }) : Promise.resolve([]),
    dbId ? prisma.event.findMany({ where: { OR: [{ gameId: dbId }, { gameName: g.name }] }, orderBy: { createdAt: 'desc' }, take: 30 }) : Promise.resolve([]),
    dbId ? prisma.post.count({ where: { gameId: dbId } }) : Promise.resolve(0),
  ]);

  const posts = (postRows as any[]).map((p) => ({
    id: p.id, text: p.text, imageUrl: p.imageUrl, createdAt: p.createdAt.toISOString(),
    likeCount: p.likeCount, commentCount: p.commentCount, pinned: p.pinned,
    likedByMe: wallet ? (p.likes?.length ?? 0) > 0 : false, author: p.author, game: p.game,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: g.name,
    description: g.desc,
    genre: g.genre,
    url: `https://lootradar.io/game/${g.id}`,
    gamePlatform: 'Web3 / Solana',
    ...(g.iconUrl ? { image: /^https?:\/\//.test(g.iconUrl) ? g.iconUrl : `https://lootradar.io${g.iconUrl}` } : {}),
  };

  return (
    <div className="pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/" className="text-sm text-dim hover:text-acc">← Back to Discover</Link>

      {/* header */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <GameIcon g={g} className="h-16 w-16 rounded-2xl text-3xl" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold sm:text-3xl">{g.name}</h1>
            {g.verified && (
              <span title="Verified project" className="inline-flex items-center gap-1 rounded-full bg-accSoft px-2 py-0.5 text-[11px] font-bold text-acc">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/verified.svg" alt="" width={14} height={14} className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            <span className="mono text-dim">${g.ticker}</span>
            {g.boosted && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-gold">★ BOOSTED</span>}
            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${pre ? 'bg-panel text-dim' : 'bg-accSoft text-acc'}`}>{g.status}</span>
          </div>
          <p className="mt-1 text-sm text-dim">{g.genre} · Solana{g.live && <span className="text-acc"> · live data</span>}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <FavoriteButton gameId={g.id} initialFav={isFav} />
          <VoteButton slug={g.id} initialCount={g.voteCount ?? 0} />
          <ShareButton slug={g.id} name={g.name} xUrl={g.x} priceStr={price(g.market.price)} pctStr={pct(g.market.change24h)} up={up} players={g.playersOnline} noToken={noToken} />
          {g.site && <a href={g.site} target="_blank" className="btn-primary btn-sm">Play ↗</a>}
          {g.x && <a href={g.x} target="_blank" className="btn-ghost btn-sm">X ↗</a>}
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-dim">{g.desc}</p>

      {/* stat grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Price" value={noToken ? '—' : price(g.market.price)} />
        <Stat label="24h" value={noToken ? '—' : pct(g.market.change24h)} tone={noToken ? undefined : up ? 'up' : 'down'} />
        <Stat label="Market cap" value={noToken ? 'Pre-token' : usd(g.market.mcap)} />
        <Stat label="Volume 24h" value={noToken ? '—' : usd(g.market.vol24h)} />
        <Stat label="Holders" value={!noToken && g.holders > 0 ? compact(g.holders) : '—'} />
        <Stat label="Online now" value={g.playersOnline > 0 ? g.playersOnline.toLocaleString() : '—'} tone={g.playersOnline > 0 ? 'up' : undefined} />
      </div>

      {/* ── SEKMELER ── */}
      <GameTabs
        socialCount={socialCount}
        activityCount={events.length}
        overview={
          <div className="space-y-6">
            <div className="card p-5">
              <h3 className="mb-2 font-bold">About {g.name}</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-dim">{g.about || g.desc}</p>
            </div>
            {g.screenshots && g.screenshots.length > 0 && (
              <div>
                <h3 className="mb-3 font-bold">Screenshots</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {g.screenshots.map((s, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={s} alt={`${g.name} screenshot`} className="aspect-video w-full rounded-xl border border-line object-cover" />
                  ))}
                </div>
              </div>
            )}
            <div className="card p-5">
              <h3 className="mb-3 font-bold">Quick facts</h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-3">
                <Fact k="Genre" v={g.genre} />
                <Fact k="Chain" v="Solana" />
                <Fact k="Status" v={g.status} />
                <Fact k="Players online" v={g.playersOnline.toLocaleString()} />
                <Fact k="Community votes" v={String(g.voteCount ?? 0)} />
                {g.platforms && g.platforms.length > 0 && <Fact k="Platforms" v={g.platforms.join(' · ')} />}
                {g.site && <FactLink k="Website" href={g.site} v={new URL(g.site).host} />}
                {g.x && <FactLink k="X (Twitter)" href={g.x} v={'@' + g.x.split('/').filter(Boolean).pop()} />}
                {g.discord && <FactLink k="Discord" href={g.discord} v="Join server" />}
                {g.telegram && <FactLink k="Telegram" href={g.telegram} v="Join channel" />}
              </dl>
            </div>
            {xHandle && (
              <div>
                <h3 className="mb-3 font-bold">Latest from X</h3>
                <XTimeline handle={xHandle} />
              </div>
            )}
          </div>
        }
        token={
          <div className="space-y-4">
            {g.tokenAddress ? (
              <>
                <div className="card p-5">
                  <div className="text-[10px] uppercase tracking-wide text-faint">Token address ($ {g.ticker})</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CopyAddress address={g.tokenAddress} className="max-w-full" />
                    {g.dexUrl && <a href={g.dexUrl} target="_blank" className="btn-primary btn-sm">Buy on DexScreener ↗</a>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Price" value={pre ? '—' : price(g.market.price)} />
                  <Stat label="Market cap" value={usd(g.market.mcap)} />
                  <Stat label="24h volume" value={usd(g.market.vol24h)} />
                  <Stat label="24h change" value={pct(g.market.change24h)} tone={up ? 'up' : 'down'} />
                </div>
                <p className="text-xs text-faint">Market data via DexScreener, refreshed automatically. Always verify the contract address before trading.</p>
              </>
            ) : (
              <div className="card grid place-items-center p-12 text-center">
                <div className="text-4xl">🕓</div>
                <p className="mt-3 font-semibold">No token yet</p>
                <p className="mt-1 max-w-sm text-sm text-dim">{g.name} hasn’t launched a token. When it lists on Solana, live token data will appear here.</p>
              </div>
            )}
          </div>
        }
        charts={
          hasChart ? (
            <div className="card overflow-hidden" style={{ height: 520 }}>
              <iframe src={chartEmbed(g.chain, g.pairAddress, g.tokenAddress)} title={`${g.name} chart`} className="h-full w-full border-0" loading="lazy" />
            </div>
          ) : (
            <div className="card grid place-items-center p-12 text-center">
              <div className="text-4xl">📈</div>
              <p className="mt-3 font-semibold">No chart yet</p>
              <p className="mt-1 max-w-sm text-sm text-dim">The live DexScreener chart appears here once {g.name} has a token on Solana.</p>
            </div>
          )
        }
        social={
          <div>
            <p className="mb-4 text-sm text-dim">Discuss {g.name} with other players. Be kind — no links, contract addresses or spam. Max 3 posts/day.</p>
            <CommunityFeed initial={posts} nextCursor={posts.length === 20 ? posts[posts.length - 1].id : null} fixedGameId={dbId} />
          </div>
        }
        activity={
          events.length > 0 ? (
            <div className="card p-5">
              <div className="divide-y divide-line">
                {events.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 py-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-acc" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{e.title}</p>
                      <div className="text-xs text-faint">{timeAgo(e.createdAt.getTime())} ago</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card grid place-items-center p-10 text-center">
              <div className="text-3xl">📰</div>
              <p className="mt-2 font-semibold">No activity yet</p>
              <p className="mt-1 max-w-sm text-sm text-dim">Milestones, launches and news for {g.name} will show up here.</p>
            </div>
          )
        }
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  const c = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-ink';
  return (
    <div className="card p-3">
      <div className="text-[10px] uppercase tracking-wide text-faint">{label}</div>
      <div className={`mono mt-1 text-lg font-bold ${c}`}>{value}</div>
    </div>
  );
}
function Fact({ k, v }: { k: string; v: string }) {
  return <div><dt className="text-[10px] uppercase tracking-wide text-faint">{k}</dt><dd className="mt-0.5 font-semibold text-ink">{v}</dd></div>;
}
function FactLink({ k, v, href }: { k: string; v: string; href: string }) {
  return <div><dt className="text-[10px] uppercase tracking-wide text-faint">{k}</dt><dd className="mt-0.5 truncate font-semibold text-acc"><a href={href} target="_blank" className="hover:underline">{v} ↗</a></dd></div>;
}
