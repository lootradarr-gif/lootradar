import Link from 'next/link';
import type { GameWithMarket } from '@/lib/games';
import { price, usd, pct, compact } from '@/lib/format';
import { GameIcon } from './GameIcon';

export function GameCard({ g }: { g: GameWithMarket }) {
  const up = g.market.change24h >= 0;
  const preToken = g.status === 'PRE-TOKEN';
  return (
    <Link href={`/game/${g.id}`} className={`card card-hover group relative block overflow-hidden p-4 ${g.boosted ? 'ring-1 ring-gold/30' : ''}`}>
      {/* başlık satırı */}
      <div className="flex items-center gap-3">
        <GameIcon g={g} className="h-11 w-11 rounded-xl text-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-ink group-hover:text-acc">{g.name}</h3>
            {g.boosted && <span className="shrink-0 text-[11px] text-gold">★</span>}
            {g.live && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-acc" title="live market data" />}
          </div>
          <div className="truncate text-xs text-dim"><span className="text-faint">${g.ticker}</span> · {g.genre}</div>
        </div>
        {/* 24h rozeti sağ üstte */}
        {!preToken && (
          <span className={`mono shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'bg-up/12 text-up' : 'bg-down/12 text-down'}`}>{pct(g.market.change24h)}</span>
        )}
        {preToken && <span className="shrink-0 rounded-full bg-panel2 px-2 py-0.5 text-[10px] font-semibold text-dim">PRE-TOKEN</span>}
      </div>

      {/* fiyat + mcap — tek satır, sol/sağ */}
      <div className="mt-4 flex items-end justify-between border-t border-line/70 pt-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-faint">Price</div>
          <div className="mono mt-0.5 text-lg font-bold text-ink">{preToken ? '—' : price(g.market.price)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-faint">Market cap</div>
          <div className="mono mt-0.5 text-lg font-bold text-ink">{preToken ? 'Pre-token' : usd(g.market.mcap)}</div>
        </div>
      </div>

      {/* alt satır: online + holders/vol */}
      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-dim"><span className="h-1.5 w-1.5 rounded-full bg-up" />{g.playersOnline.toLocaleString()} online</span>
        <span className="mono text-faint">{preToken ? `★ ${compact(g.rating)}` : `${compact(g.holders)} holders · ${usd(g.market.vol24h)} vol`}</span>
      </div>
    </Link>
  );
}
