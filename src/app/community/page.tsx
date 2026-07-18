import Link from 'next/link';
import { getGamesWithMarkets } from '@/lib/games';
import { compact } from '@/lib/format';
import { GameIcon } from '@/components/GameIcon';

export const revalidate = 300;

export default async function Community() {
  const games = await getGamesWithMarkets();
  const totalOnline = games.reduce((s, g) => s + g.playersOnline, 0);
  const top = [...games].sort((a, b) => b.playersOnline - a.playersOnline).slice(0, 6);

  return (
    <div className="pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Community</h1>
        <p className="mt-1 text-sm text-dim">The Solana gaming crowd — live players, active projects, and where to hang out.</p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Big label="Players online" value={compact(totalOnline)} tone />
        <Big label="Games tracked" value={String(games.length)} />
        <Big label="Boosted" value={String(games.filter((g) => g.boosted).length)} />
        <Big label="Live tokens" value={String(games.filter((g) => g.status !== 'PRE-TOKEN').length)} />
      </div>

      {/* most active */}
      <h2 className="mb-3 mt-8 text-lg font-bold">Most active right now</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {top.map((g) => (
          <Link key={g.id} href={`/game/${g.id}`} className="card card-hover flex items-center gap-3 p-4">
            <GameIcon g={g} className="h-11 w-11 rounded-xl text-xl" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{g.name}</div>
              <div className="text-xs text-faint">${g.ticker}</div>
            </div>
            <div className="text-right">
              <div className="mono font-bold text-up">{g.playersOnline.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wide text-faint">online</div>
            </div>
          </Link>
        ))}
      </div>

      {/* join CTA */}
      <div className="card hero-glow mt-8 flex flex-col items-center gap-4 p-8 text-center">
        <h2 className="text-xl font-bold">Stay in the loop</h2>
        <p className="max-w-md text-sm text-dim">Fresh listings, token launches and in-game events land here every day. Add your game to the board.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/feed" className="btn-ghost">Open the pulse</Link>
          <Link href="/submit" className="btn-primary">List your game</Link>
        </div>
      </div>
    </div>
  );
}

function Big({ label, value, tone }: { label: string; value: string; tone?: boolean }) {
  return (
    <div className="card p-4">
      <div className={`mono text-2xl font-black ${tone ? 'text-up' : 'text-ink'}`}>{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-faint">{label}</div>
    </div>
  );
}
