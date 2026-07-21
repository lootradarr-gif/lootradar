'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { GameWithMarket } from '@/lib/games';
import { price, usd, pct, compact } from '@/lib/format';
import { GameIcon } from './GameIcon';
import { Search } from 'lucide-react';

type Sort = 'mcap' | 'players' | 'holders' | 'gainers' | 'volume' | 'votes' | 'new';
const SORTS: { k: Sort; label: string }[] = [
  { k: 'mcap', label: 'Market cap' },
  { k: 'players', label: 'Most players' },
  { k: 'holders', label: 'Most holders' },
  { k: 'gainers', label: 'Biggest gain' },
  { k: 'volume', label: 'Volume 24h' },
  { k: 'votes', label: 'Top voted' },
  { k: 'new', label: 'Newest' },
];

const isPre = (g: GameWithMarket) => !g.tokenAddress; // token yoksa finansal metrikler —

export function RankingsTable({ games }: { games: GameWithMarket[] }) {
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<Sort>('mcap');

  const genres = useMemo(() => ['all', ...Array.from(new Set(games.map((g) => g.genre))).sort()], [games]);
  const statuses = useMemo(() => ['all', ...Array.from(new Set(games.map((g) => g.status)))], [games]);

  const ranked = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = games.filter((g) => {
      if (genre !== 'all' && g.genre !== genre) return false;
      if (status !== 'all' && g.status !== status) return false;
      if (needle && !`${g.name} ${g.ticker} ${g.genre}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    // finansal sıralamalarda token'ı olmayanlar sona
    const preLast = (a: GameWithMarket, b: GameWithMarket) => Number(isPre(a)) - Number(isPre(b));
    const cmp: Record<Sort, (a: GameWithMarket, b: GameWithMarket) => number> = {
      mcap: (a, b) => preLast(a, b) || b.market.mcap - a.market.mcap,
      volume: (a, b) => preLast(a, b) || b.market.vol24h - a.market.vol24h,
      gainers: (a, b) => preLast(a, b) || b.market.change24h - a.market.change24h,
      holders: (a, b) => preLast(a, b) || b.holders - a.holders,
      players: (a, b) => b.playersOnline - a.playersOnline,
      votes: (a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0),
      new: (a, b) => b.createdAt - a.createdAt,
    };
    return [...list].sort(cmp[sort]);
  }, [games, q, genre, status, sort]);

  const inp = 'rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-acc';

  return (
    <div>
      {/* filtre bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games…" className={`${inp} w-full pl-8`} />
        </div>
        <select value={genre} onChange={(e) => setGenre(e.target.value)} className={inp}>
          {genres.map((g) => <option key={g} value={g}>{g === 'all' ? 'All genres' : g}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inp}>
          {statuses.map((s) => <option key={s} value={s}>{s === 'all' ? 'All status' : s}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={inp}>
          {SORTS.map((s) => <option key={s.k} value={s.k}>{s.label}</option>)}
        </select>
      </div>

      {ranked.length === 0 ? (
        <p className="card p-8 text-center text-dim">No games match your search.</p>
      ) : (
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
                  const pre = isPre(g);
                  const up = g.market.change24h >= 0;
                  return (
                    <tr key={g.id} className="group border-b border-line/50 last:border-0 hover:bg-panel2/60">
                      <td className="py-3 pl-4 pr-2 font-mono text-faint">{i + 1}</td>
                      <td className="px-2 py-3">
                        <Link href={`/game/${g.id}`} className="flex items-center gap-3">
                          <GameIcon g={g} className="h-9 w-9 rounded-lg text-base" />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 font-medium text-ink group-hover:text-acc">
                              {g.name}{g.boosted && <span className="text-[10px] text-gold">★</span>}
                            </span>
                            <span className="block text-xs text-faint">${g.ticker} · {g.genre}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="mono px-2 py-3 text-right text-ink">{pre ? '—' : price(g.market.price)}</td>
                      <td className={`mono px-2 py-3 text-right font-semibold ${pre ? 'text-faint' : up ? 'text-up' : 'text-down'}`}>{pre ? '—' : pct(g.market.change24h)}</td>
                      <td className="mono px-2 py-3 text-right text-ink">{pre ? <span className="text-dim">Pre-token</span> : usd(g.market.mcap)}</td>
                      <td className="mono px-2 py-3 text-right text-dim">{pre ? '—' : usd(g.market.vol24h)}</td>
                      <td className="mono px-2 py-3 text-right text-dim">{!pre && g.holders > 0 ? compact(g.holders) : '—'}</td>
                      <td className="mono px-2 py-3 pr-4 text-right text-dim">
                        <span className="inline-flex items-center gap-1.5">{g.playersOnline > 0 && <span className="h-1.5 w-1.5 rounded-full bg-up" />}{g.playersOnline > 0 ? g.playersOnline.toLocaleString() : '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
