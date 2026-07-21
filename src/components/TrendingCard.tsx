import Link from 'next/link';
import type { GameWithMarket } from '@/lib/games';
import { price, usd, pct, compact } from '@/lib/format';
import { GameIcon } from './GameIcon';
import { Zap, Users, BarChart3 } from 'lucide-react';

// bannerUrl yoksa: id'den türetilen deterministik koyu degrade
function bannerGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  const h2 = (h + 45) % 360;
  return `linear-gradient(135deg, hsl(${h} 48% 20%) 0%, hsl(${h2} 55% 11%) 100%)`;
}

// Ana sayfa "Trending now" — zengin analiz kartı (fiyat/24h/mcap tablo + holders/vol/chain).
export function TrendingCard({ g, i = 0 }: { g: GameWithMarket; i?: number }) {
  const up = g.market.change24h >= 0;
  const noToken = !g.tokenAddress; // token yoksa finansal metrikler — (0 değil)
  return (
    <Link
      href={`/game/${g.id}`}
      style={{ animationDelay: `${i * 70}ms` }}
      className={`card card-hover reveal-up group relative block overflow-hidden ${g.boosted ? 'ring-1 ring-gold/45 boost-glow' : ''}`}
    >
      {/* ── BANNER ── */}
      <div className="relative h-32 w-full overflow-hidden">
        {g.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.bannerUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="h-full w-full transition-transform duration-700 group-hover:scale-110" style={{ background: bannerGradient(g.id) }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/20 to-transparent" />

        {/* üst-sol favori yıldız (dekoratif) */}
        <span className="absolute left-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-lg bg-black/45 text-sm text-white/80 backdrop-blur">★</span>
        {/* üst-sağ ANALYZED / BOOSTED */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
          {g.boosted && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-black">★ BOOSTED</span>}
          <span className="rounded-md border border-acc/50 bg-black/40 px-2 py-0.5 text-[10px] font-bold tracking-wide text-acc backdrop-blur">ANALYZED</span>
        </div>
        {/* alt-sol buzz */}
        <div className="absolute bottom-2 left-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <Zap size={12} className="text-acc" /> {compact(g.rating)}
        </div>
        {/* alt-sağ players online — sadece GERÇEK veri varsa (endpoint'ten) göster */}
        {g.playersOnline > 0 && (
          <div className="absolute bottom-2 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-up" /> {g.playersOnline.toLocaleString()} players online
          </div>
        )}
      </div>

      {/* ── GÖVDE ── */}
      <div className="p-3.5">
        <div className="flex items-center gap-2.5">
          <GameIcon g={g} className="h-10 w-10 rounded-xl text-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-bold text-ink group-hover:text-acc">{g.name}</h3>
              {g.verified && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/verified.svg" alt="Verified" title="Verified project" width={16} height={16} className="h-4 w-4 shrink-0" />
              )}
              {g.live && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-acc" title="live market data" />}
            </div>
            <div className="truncate text-xs text-dim"><span className="text-faint">${g.ticker}</span> · {g.genre}</div>
          </div>
          <span className="shrink-0 rounded-md bg-panel2 px-2 py-0.5 text-[10px] font-bold tracking-wide text-dim">GAME</span>
        </div>

        {/* PRICE / 24H / MCAP */}
        <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-lg border border-line/70">
          <Cell label="Price" value={noToken ? '—' : price(g.market.price)} />
          <Cell label="24h" value={noToken ? '—' : pct(g.market.change24h)} tone={noToken ? undefined : up ? 'up' : 'down'} border />
          <Cell label="Mcap" value={noToken ? '—' : usd(g.market.mcap)} border />
        </div>

        {/* footer: holders · vol · chain */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-faint">
          <span className="mono inline-flex items-center gap-1">
            <Users size={12} className="text-dim" /> {noToken ? `★ ${compact(g.rating)}` : (g.holders > 0 ? compact(g.holders) : '—')}
          </span>
          <span className="mono inline-flex items-center gap-1"><BarChart3 size={12} className="text-dim" /> {noToken ? '—' : usd(g.market.vol24h)}</span>
          <span className="mono font-bold text-acc/80">{g.chain === 'solana' ? 'MAINNET' : g.chain.toUpperCase()}</span>
        </div>
      </div>
    </Link>
  );
}

function Cell({ label, value, tone, border }: { label: string; value: string; tone?: 'up' | 'down'; border?: boolean }) {
  const c = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-ink';
  return (
    <div className={`px-2.5 py-1.5 ${border ? 'border-l border-line/70' : ''}`}>
      <div className="text-[9px] uppercase tracking-wide text-faint">{label}</div>
      <div className={`mono mt-0.5 truncate text-sm font-bold ${c}`}>{value}</div>
    </div>
  );
}
