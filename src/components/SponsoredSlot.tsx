import Link from 'next/link';
import type { GameWithMarket } from '@/lib/games';
import { GameIcon } from './GameIcon';
import { usd, pct } from '@/lib/format';

// Reklam/sponsor slotu. Boost'lu oyun varsa "Sponsored" olarak gösterir (Boost alıcısına ekstra yerleşim),
// yoksa "buraya reklam ver" CTA. İleride harici reklam scripti bu bileşene takılabilir.
export function SponsoredSlot({ game }: { game?: GameWithMarket | null }) {
  if (!game) {
    return (
      <Link href="/boost" className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-gold/40 bg-gold/[0.04] px-4 py-3 transition-colors hover:border-gold/70">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/boost-3d.svg" alt="" width={32} height={32} className="h-8 w-8" />
          <div>
            <div className="text-sm font-bold text-gold">Your game here</div>
            <div className="text-xs text-dim">Boost to feature across LootRadar — Trending, Sponsored & more.</div>
          </div>
        </div>
        <span className="text-gold">→</span>
      </Link>
    );
  }
  const up = game.market.change24h >= 0;
  return (
    <Link href={`/game/${game.id}`} className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-gold/35 bg-gold/[0.05] p-3 transition-colors hover:border-gold/60">
      <span className="absolute right-2 top-1.5 text-[9px] font-bold uppercase tracking-wide text-faint">Sponsored</span>
      <GameIcon g={game} className="h-11 w-11 rounded-xl text-lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-bold text-ink">{game.name}</span>
          <span className="text-[10px] font-bold text-gold">★</span>
        </div>
        <div className="truncate text-xs text-dim">${game.ticker} · {game.genre}</div>
      </div>
      {game.status !== 'PRE-TOKEN' && (
        <div className="shrink-0 text-right">
          <div className="mono text-sm font-bold text-ink">{usd(game.market.mcap)}</div>
          <div className={`mono text-xs font-semibold ${up ? 'text-up' : 'text-down'}`}>{pct(game.market.change24h)}</div>
        </div>
      )}
    </Link>
  );
}
