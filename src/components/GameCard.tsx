import Link from 'next/link';
import type { GameWithMarket } from '@/lib/games';
import { price, usd, pct, compact } from '@/lib/format';
import { GameIcon } from './GameIcon';

// bannerUrl yoksa: id'den türetilen deterministik koyu degrade (her kart farklı görünür)
function bannerGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  const h2 = (h + 45) % 360;
  return `linear-gradient(135deg, hsl(${h} 48% 20%) 0%, hsl(${h2} 55% 11%) 100%)`;
}

export function GameCard({ g }: { g: GameWithMarket }) {
  const up = g.market.change24h >= 0;
  const pre = g.status === 'PRE-TOKEN';
  return (
    <Link
      href={`/game/${g.id}`}
      className={`card card-hover group relative block overflow-hidden ${g.boosted ? 'ring-1 ring-gold/40' : ''}`}
    >
      {/* ── BANNER ── */}
      <div className="relative h-28 w-full overflow-hidden">
        {g.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.bannerUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full" style={{ background: bannerGradient(g.id) }} />
        )}
        {/* alt karartma → gövdeyle kaynaşsın */}
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/25 to-transparent" />
        {/* üst-sağ rozetler */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
          {g.boosted && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-black">★ BOOSTED</span>}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur ${pre ? 'bg-black/45 text-dim' : 'bg-acc/90 text-white'}`}>
            {pre ? 'PRE-TOKEN' : g.status}
          </span>
        </div>
        {/* alt-sol online */}
        <div className="absolute bottom-2 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-up" /> {g.playersOnline.toLocaleString()} online
        </div>
      </div>

      {/* ── GÖVDE ── */}
      <div className="p-4 pt-0">
        <div className="flex items-center gap-2.5">
          <GameIcon g={g} className="-mt-6 h-12 w-12 rounded-xl text-xl shadow-card ring-2 ring-panel" />
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-semibold text-ink group-hover:text-acc">{g.name}</h3>
              {g.live && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-acc" title="live market data" />}
            </div>
            <div className="truncate text-xs text-dim"><span className="text-faint">${g.ticker}</span> · {g.genre}</div>
          </div>
          {!pre && (
            <span className={`mono shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'bg-up/12 text-up' : 'bg-down/12 text-down'}`}>
              {pct(g.market.change24h)}
            </span>
          )}
        </div>

        {/* fiyat + mcap */}
        <div className="mt-3 flex items-end justify-between border-t border-line/70 pt-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-faint">Price</div>
            <div className="mono mt-0.5 text-base font-bold text-ink">{pre ? '—' : price(g.market.price)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-faint">Market cap</div>
            <div className="mono mt-0.5 text-base font-bold text-ink">{pre ? 'Pre-token' : usd(g.market.mcap)}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
          <span className="mono">{pre ? `★ ${compact(g.rating)} rating` : `${compact(g.holders)} holders`}</span>
          <span className="mono">{pre ? 'No token yet' : `${usd(g.market.vol24h)} vol`}</span>
        </div>
      </div>
    </Link>
  );
}
