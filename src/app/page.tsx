import Link from 'next/link';
import { getGamesWithMarkets, totals, type GameWithMarket } from '@/lib/games';
import { GameCard } from '@/components/GameCard';
import { GameExplorer } from '@/components/GameExplorer';
import { TrendingCard } from '@/components/TrendingCard';
import { SponsoredSlot } from '@/components/SponsoredSlot';
import { RadarHero } from '@/components/RadarHero';
import { prisma } from '@/lib/prisma';
import { usd, compact, pct, timeAgo, shortAddr } from '@/lib/format';
import { GameIcon } from '@/components/GameIcon';

export const revalidate = 60; // sayfa 60sn cache — DexScreener'a yakın-anlık

export default async function Discover() {
  const [games, recentPosts] = await Promise.all([
    getGamesWithMarkets(),
    prisma.post.findMany({
      take: 6, orderBy: { createdAt: 'desc' },
      include: { author: { select: { wallet: true, displayName: true } }, game: { select: { slug: true, name: true } } },
    }),
  ]);
  const t = totals(games);
  const tradable = games.filter((g) => g.status !== 'PRE-TOKEN');
  const boosted = games.find((g) => g.boosted) ?? games[0];
  const gainers = [...tradable].sort((a, b) => b.market.change24h - a.market.change24h).slice(0, 5);
  const losers = [...tradable].sort((a, b) => a.market.change24h - b.market.change24h).slice(0, 5);
  const dom = [...tradable].sort((a, b) => b.market.mcap - a.market.mcap);
  const domTotal = dom.reduce((s, g) => s + g.market.mcap, 0) || 1;

  // Trending now: boost'lu oyunlar otomatik girer, kalan slotlar en çok oynanandan dolar (4 kart)
  const byOnline = [...games].sort((a, b) => b.playersOnline - a.playersOnline);
  const trending: GameWithMarket[] = [];
  for (const g of [...games.filter((g) => g.boosted), ...byOnline]) {
    if (trending.length >= 4) break;
    if (!trending.some((x) => x.id === g.id)) trending.push(g);
  }
  // Heating up: community oylarına göre sırala (eşitlikte 24h momentum)
  const heating = [...games].sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0) || b.market.change24h - a.market.change24h);
  // Just added: en yeni listelenen 4 oyun
  const justAdded = [...games].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)).slice(0, 4);

  return (
    <div className="space-y-14 pt-8">
      {/* ── HERO ── */}
      <section className="hero-glow relative -mx-4 overflow-hidden rounded-3xl px-4 py-10 sm:-mx-6 sm:px-6">
        <RadarHero />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <span className="chip mb-4 border-acc/25 text-acc">◆ Live on Solana</span>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Every Solana game,<br /><span className="text-acc">one live board.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-dim sm:text-lg">
              Track prices, players and momentum across the whole Solana gaming scene in one place. Spot the runners early, follow the launches, and back the games worth your time.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#games" className="btn-primary">Browse games →</a>
              <Link href="/rankings" className="btn-ghost">See the rankings</Link>
            </div>
            {/* stat strip */}
            <div className="mt-9 grid max-w-lg grid-cols-3 gap-4">
              <HeroStat value={String(t.count)} label="Games listed" />
              <HeroStat value={usd(t.mcap)} label="Combined mcap" />
              <HeroStat value={compact(t.reach)} label="Players reached" />
            </div>
          </div>

          {/* live market readout card */}
          <aside className="card p-4 shadow-card">
            <div className="flex items-center gap-2 text-xs font-semibold text-dim">
              <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-acc" /> MARKET SNAPSHOT
            </div>
            <Link href={`/game/${boosted.id}`} className="mt-3 flex items-center gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] p-3">
              <GameIcon g={boosted} className="h-10 w-10 rounded-lg text-lg" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold tracking-wide text-gold">★ BOOSTED</div>
                <div className="truncate font-semibold">{boosted.name} <span className="text-faint">${boosted.ticker}</span></div>
              </div>
            </Link>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Readout k="tracked_mcap" v={usd(t.mcap)} />
              <Readout k="vol_24h" v={usd(t.vol)} />
              <Readout k="games" v={String(t.count)} />
              <Readout k="reach" v={compact(t.reach)} />
            </dl>
          </aside>
        </div>
      </section>

      {/* ── TRENDING NOW ── */}
      <section>
        <SectionHead title="Trending now" hint="by live players & boosts" href="/rankings" hrefLabel="All games →" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((g, i) => <TrendingCard key={g.id} g={g} i={i} />)}
        </div>
      </section>

      {/* ── SPONSORED slot ── */}
      <SponsoredSlot game={games.find((g) => g.boosted) ?? null} />

      {/* ── JUST ADDED ── */}
      <section>
        <SectionHead title="Just added" hint="newest games on the radar" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {justAdded.map((g, i) => <GameCard key={g.id} g={g} i={i} />)}
        </div>
      </section>

      {/* ── ALL GAMES (arama + filtre) ── */}
      <section id="games">
        <SectionHead title="Browse all games" hint="search, filter by genre & sort" href="/rankings" hrefLabel="Rankings →" />
        <GameExplorer games={heating} />
      </section>

      {/* ── DOMINANCE ── */}
      <section>
        <SectionHead title="Who owns the market" hint="share by market cap" />
        <div className="card p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wide text-faint">total tracked</span>
            <span className="mono font-bold">{usd(domTotal)}</span>
          </div>
          <div className="flex h-7 w-full overflow-hidden rounded-lg">
            {dom.slice(0, 8).map((g, i) => {
              const w = (g.market.mcap / domTotal) * 100;
              return <div key={g.id} title={`$${g.ticker} ${w.toFixed(1)}%`} style={{ width: `${w}%`, background: BAR[i % BAR.length] }} className="h-full first:rounded-l-lg" />;
            })}
            <div className="h-full flex-1 rounded-r-lg bg-line" />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {dom.slice(0, 8).map((g, i) => (
              <span key={g.id} className="inline-flex items-center gap-1.5 text-dim">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: BAR[i % BAR.length] }} />
                ${g.ticker} <span className="mono text-faint">{((g.market.mcap / domTotal) * 100).toFixed(1)}%</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAINERS / LOSERS ── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <MoversList title="On the rise" sub="24h" tone="up" rows={gainers} />
        <MoversList title="Cooling off" sub="24h" tone="down" rows={losers} />
      </section>

      {/* ── COMMUNITY PULSE (gerçek postlar) ── */}
      <section className="card p-5">
        <SectionHead title="Community pulse" hint="latest from the community" href="/community" hrefLabel="Open community →" small />
        {recentPosts.length === 0 ? (
          <p className="py-6 text-center text-sm text-dim">No posts yet — <Link href="/community" className="text-acc">be the first</Link>.</p>
        ) : (
          <div className="mt-2 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {recentPosts.map((p) => {
              const name = p.author.displayName || shortAddr(p.author.wallet);
              return (
                <Link key={p.id} href="/community" className="flex gap-3 rounded-lg py-3 transition-colors hover:bg-panel2/40">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-panel2 text-xs font-bold text-dim">{name.slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-faint">
                      <span className="text-dim">{name}</span>{p.game ? <> · <span className="text-acc">{p.game.name}</span></> : null} · {timeAgo(p.createdAt.getTime())}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-ink">{p.text}</p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-faint"><span>♥ {p.likeCount}</span><span>💬 {p.commentCount}</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── SUBMIT CTA ── */}
      <section className="card hero-glow flex flex-col items-center gap-4 p-10 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Made a game on Solana?</h2>
        <p className="max-w-md text-dim">Put it in front of players looking for their next obsession. Listing is free — boost it to the top whenever you want more eyes.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/submit" className="btn-primary">List your game — free</Link>
          <Link href="/boost" className="btn-gold">⚡ Boost</Link>
        </div>
      </section>
    </div>
  );
}

const BAR = ['#22e0a8', '#3aa0ff', '#ffcb45', '#ff8a5c', '#ff5d73', '#7c8cff', '#2ee6c9', '#c0d040'];

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="mono text-2xl font-black text-ink sm:text-3xl">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-faint">{label}</div>
    </div>
  );
}
function Readout({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between border-b border-line/60 pb-2 last:border-0"><dt className="mono text-dim">{k}</dt><dd className="mono font-semibold text-ink">{v}</dd></div>;
}
function SectionHead({ title, hint, href, hrefLabel, small }: { title: string; hint?: string; href?: string; hrefLabel?: string; small?: boolean }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className={small ? 'text-lg font-bold' : 'text-xl font-bold sm:text-2xl'}>{title}</h2>
        {hint ? <p className="text-xs text-faint">{hint}</p> : null}
      </div>
      {href && hrefLabel ? <Link href={href} className="shrink-0 text-sm text-dim hover:text-acc">{hrefLabel}</Link> : null}
    </div>
  );
}
function MoversList({ title, sub, tone, rows }: { title: string; sub: string; tone: 'up' | 'down'; rows: GameWithMarket[] }) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2"><span className={tone === 'up' ? 'text-up' : 'text-down'}>{tone === 'up' ? '▲' : '▼'}</span><h3 className="font-bold">{title}</h3><span className="text-xs text-faint">{sub}</span></div>
      <div className="divide-y divide-line">
        {rows.map((g) => (
          <Link key={g.id} href={`/game/${g.id}`} className="flex items-center gap-3 py-2.5 transition-colors hover:text-acc">
            <GameIcon g={g} className="h-8 w-8 rounded-lg text-base" />
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-ink">{g.name}</div><div className="text-xs text-faint">${g.ticker}</div></div>
            <div className="mono text-right text-sm text-dim">{usd(g.market.mcap)}</div>
            <div className={`mono w-16 text-right text-sm font-semibold ${tone === 'up' ? 'text-up' : 'text-down'}`}>{pct(g.market.change24h)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
