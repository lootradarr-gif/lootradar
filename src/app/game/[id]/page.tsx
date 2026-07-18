import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGamesWithMarkets } from '@/lib/games';
import { chartEmbed } from '@/lib/dexscreener';
import { price, usd, pct, compact } from '@/lib/format';
import { GameIcon } from '@/components/GameIcon';
import { VoteButton } from '@/components/VoteButton';

export const revalidate = 60;

export default async function GamePage({ params }: { params: { id: string } }) {
  const games = await getGamesWithMarkets();
  const g = games.find((x) => x.id === params.id);
  if (!g) notFound();

  const pre = g.status === 'PRE-TOKEN';
  const up = g.market.change24h >= 0;
  const hasChart = !!g.tokenAddress;

  return (
    <div className="pt-8">
      <Link href="/" className="text-sm text-dim hover:text-acc">← Discover</Link>

      {/* header */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <GameIcon g={g} className="h-16 w-16 rounded-2xl text-3xl" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold sm:text-3xl">{g.name}</h1>
            <span className="mono text-dim">${g.ticker}</span>
            {g.boosted && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-gold">★ BOOSTED</span>}
            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${pre ? 'bg-panel text-dim' : 'bg-accSoft text-acc'}`}>{g.status}</span>
          </div>
          <p className="mt-1 text-sm text-dim">{g.genre} · Solana</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <VoteButton slug={g.id} initialCount={g.voteCount ?? 0} />
          {g.site && <a href={g.site} target="_blank" className="btn-primary btn-sm">Play ↗</a>}
          {g.x && <a href={g.x} target="_blank" className="btn-ghost btn-sm">X ↗</a>}
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-dim">{g.desc}</p>

      {/* stat grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Price" value={pre ? '—' : price(g.market.price)} />
        <Stat label="24h" value={pre ? '—' : pct(g.market.change24h)} tone={pre ? undefined : up ? 'up' : 'down'} />
        <Stat label="Market cap" value={pre ? 'Pre-token' : usd(g.market.mcap)} />
        <Stat label="Volume 24h" value={pre ? '—' : usd(g.market.vol24h)} />
        <Stat label="Holders" value={pre ? '—' : compact(g.holders)} />
        <Stat label="Online now" value={g.playersOnline.toLocaleString()} tone="up" />
      </div>

      {/* chart */}
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold">Live chart</h2>
        {hasChart ? (
          <div className="card overflow-hidden" style={{ height: 520 }}>
            <iframe
              src={chartEmbed(g.chain, g.pairAddress, g.tokenAddress)}
              title={`${g.name} chart`}
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="card grid place-items-center p-12 text-center">
            <div className="text-4xl">🕓</div>
            <p className="mt-3 font-semibold">No token yet</p>
            <p className="mt-1 max-w-sm text-sm text-dim">
              {g.name} hasn’t launched a token. When it does and lists on Solana, the live DexScreener chart will appear here automatically.
            </p>
          </div>
        )}
        {g.dexUrl && (
          <a href={g.dexUrl} target="_blank" className="mt-2 inline-block text-sm text-dim hover:text-acc">Open on DexScreener ↗</a>
        )}
      </div>
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
