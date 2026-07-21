'use client';
import { useMemo, useState } from 'react';
import type { GameWithMarket } from '@/lib/games';
import { GameCard } from './GameCard';
import { Search } from 'lucide-react';

type Sort = 'votes' | 'players' | 'mcap' | 'gainers' | 'new';
const SORTS: { k: Sort; label: string }[] = [
  { k: 'votes', label: 'Top voted' },
  { k: 'players', label: 'Most players' },
  { k: 'mcap', label: 'Market cap' },
  { k: 'gainers', label: 'Biggest gainers' },
  { k: 'new', label: 'Newest' },
];

// Ana sayfa oyun ızgarası — arama + genre + status + sıralama (client, tüm oyunlar zaten yüklü).
export function GameExplorer({ games }: { games: GameWithMarket[] }) {
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<Sort>('votes');

  const genres = useMemo(() => ['all', ...Array.from(new Set(games.map((g) => g.genre))).sort()], [games]);
  const statuses = useMemo(() => ['all', ...Array.from(new Set(games.map((g) => g.status)))], [games]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = games.filter((g) => {
      if (genre !== 'all' && g.genre !== genre) return false;
      if (status !== 'all' && g.status !== status) return false;
      if (needle && !(`${g.name} ${g.ticker} ${g.genre}`.toLowerCase().includes(needle))) return false;
      return true;
    });
    const by: Record<Sort, (a: GameWithMarket, b: GameWithMarket) => number> = {
      votes: (a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0) || b.market.change24h - a.market.change24h,
      players: (a, b) => b.playersOnline - a.playersOnline,
      mcap: (a, b) => b.market.mcap - a.market.mcap,
      gainers: (a, b) => b.market.change24h - a.market.change24h,
      new: () => 0, // gelen sıra zaten createdAt asc → ters çevir
    };
    list = [...list].sort(by[sort]);
    if (sort === 'new') list.reverse();
    return list;
  }, [games, q, genre, status, sort]);

  const inp = 'rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-acc';

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games…"
            className={`${inp} w-full pl-8`} />
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

      {shown.length === 0 ? (
        <p className="card p-8 text-center text-dim">No games match your search.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((g, i) => <GameCard key={g.id} g={g} i={i} />)}
        </div>
      )}
    </div>
  );
}
