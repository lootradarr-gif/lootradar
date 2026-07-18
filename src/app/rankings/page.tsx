import Link from 'next/link';
import { getGamesWithMarkets } from '@/lib/games';
import { price, usd, pct, compact } from '@/lib/format';
import { GameIcon } from '@/components/GameIcon';

export const revalidate = 60;

export default async function Rankings() {
  const games = await getGamesWithMarkets();
  // sıralama: canlı+token olanlar mcap'e göre, pre-token'lar sona (online'a göre)
  const ranked = [...games].sort((a, b) => {
    const pa = a.status === 'PRE-TOKEN' ? 1 : 0;
    const pb = b.status === 'PRE-TOKEN' ? 1 : 0;
    if (pa !== pb) return pa - pb;
    return b.market.mcap - a.market.mcap;
  });

  return (
    <div className="pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Token rankings</h1>
        <p className="mt-1 text-sm text-dim">Every tracked Solana game, ranked by market cap. Live prices via DexScreener.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-faint">
                <th className="py-3 pl-4 pr-2 font-medium">#</th>
                <th className="px-2 py-3 font-medium">Game</th>
                <th className="px-2 py-3 text-right font-medium">Price</th>
                <th className="px-2 py-3 text-right font-medium">24h</th>
                <th className="px-2 py-3 text-right font-medium">Market cap</th>
                <th className="px-2 py-3 text-right font-medium">Volume 24h</th>
                <th className="px-2 py-3 text-right font-medium">Holders</th>
                <th className="px-2 py-3 pr-4 text-right font-medium">Online</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((g, i) => {
                const pre = g.status === 'PRE-TOKEN';
                const up = g.market.change24h >= 0;
                return (
                  <tr key={g.id} className="group border-b border-line/50 last:border-0 hover:bg-panel2/60">
                    <td className="py-3 pl-4 pr-2 font-mono text-faint">{i + 1}</td>
                    <td className="px-2 py-3">
                      <Link href={`/game/${g.id}`} className="flex items-center gap-3">
                        <GameIcon g={g} className="h-9 w-9 rounded-lg text-base" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-medium text-ink group-hover:text-acc">
                            {g.name}
                            {g.boosted && <span className="text-[10px] text-gold">★</span>}
                          </span>
                          <span className="block text-xs text-faint">${g.ticker} · {g.genre}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="mono px-2 py-3 text-right text-ink">{pre ? '—' : price(g.market.price)}</td>
                    <td className={`mono px-2 py-3 text-right font-semibold ${pre ? 'text-faint' : up ? 'text-up' : 'text-down'}`}>{pre ? '—' : pct(g.market.change24h)}</td>
                    <td className="mono px-2 py-3 text-right text-ink">{pre ? <span className="text-dim">Pre-token</span> : usd(g.market.mcap)}</td>
                    <td className="mono px-2 py-3 text-right text-dim">{pre ? '—' : usd(g.market.vol24h)}</td>
                    <td className="mono px-2 py-3 text-right text-dim">{pre ? '—' : compact(g.holders)}</td>
                    <td className="mono px-2 py-3 pr-4 text-right text-dim">
                      <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-up" />{g.playersOnline.toLocaleString()}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
