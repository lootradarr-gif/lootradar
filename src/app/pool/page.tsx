'use client';
// COMMUNITY POOL — haftalık $LOOT dağıtımı tablosu.
//
// Kural tek cümlede: TUTMAK kapıdır, XP paydır. Havuzdan pay almak için minimum
// $LOOT tutman gerekir; ne kadar alacağını ise o haftaki XP'n belirler.
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Avatar } from '@/components/Avatar';
import { LOOT, lootLive, lootLinks } from '@/lib/token';

interface Row { rank: number; wallet: string; xp: number; displayName: string | null; avatarUrl: string | null; level: number; estimate: number }
interface Mine { wallet: string; xp: number; rank: number | null; balance: number; eligible: boolean; estimate: number }
interface Data { weekKey: string; endsAt: string; poolLoot: number; minHold: number; totalXp: number; settled: boolean; rows: Row[]; mine: Mine | null }

const fmt = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toFixed(0);
const short = (w: string) => `${w.slice(0, 4)}…${w.slice(-4)}`;

export default function PoolPage() {
  const { publicKey } = useWallet();
  const [d, setD] = useState<Data | null>(null);

  useEffect(() => {
    const load = () => {
      const q = publicKey ? `?wallet=${publicKey.toBase58()}` : '';
      fetch(`/api/pool${q}`).then((r) => r.json()).then(setD).catch(() => {});
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [publicKey]);

  const left = d ? Math.max(0, new Date(d.endsAt).getTime() - Date.now()) : 0;
  const dd = Math.floor(left / 86400000), hh = Math.floor((left % 86400000) / 3600000), mm = Math.floor((left % 3600000) / 60000);

  return (
    <div className="mx-auto max-w-3xl pt-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-ink">Community Pool</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-dim">
          Every week we split a ${LOOT.symbol} pool between the most active people on LootRadar.
          Hold {fmt(d?.minHold ?? 500000)} ${LOOT.symbol} to qualify — your share is decided by the XP you earn that week.
        </p>
      </div>

      {/* havuz kartı */}
      <div className="card mb-5 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-faint">This week&apos;s pool</div>
          <div className="mono text-3xl font-black text-gold">{fmt(d?.poolLoot ?? 0)} <span className="text-base text-faint">${LOOT.symbol}</span></div>
          <div className="text-xs text-dim">{d?.weekKey ?? '—'} · funded by boost revenue</div>
        </div>
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-wide text-faint">Ends in</div>
          <div className="mono text-2xl font-black text-ink">{dd}d {hh}h {mm}m</div>
        </div>
      </div>

      {/* kendi durumun */}
      {d?.mine && (
        <div className={`card mb-5 p-4 ${d.mine.eligible ? 'border-acc/50' : 'border-down/40'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-ink">
                {d.mine.eligible ? '✅ You qualify' : '🔒 Not qualified yet'}
              </div>
              <div className="text-xs text-dim">
                Holding <b className="text-ink">{fmt(d.mine.balance)}</b> / {fmt(d.minHold)} ${LOOT.symbol}
                {!d.mine.eligible && lootLive() && (
                  <> · <a href={lootLinks().pump} target="_blank" rel="noreferrer" className="text-acc hover:underline">get more</a></>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wide text-faint">Your XP · est. share</div>
              <div className="mono text-lg font-black text-ink">
                {d.mine.xp} XP · <span className={d.mine.eligible ? 'text-gold' : 'text-faint'}>{fmt(d.mine.estimate)} ${LOOT.symbol}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* sıralama */}
      <div className="space-y-2">
        {!d && <p className="card p-6 text-center text-dim">Loading…</p>}
        {d && d.rows.length === 0 && (
          <p className="card p-6 text-center text-dim">
            No XP earned yet this week. Post, comment or vote in <a href="/community" className="text-acc hover:underline">Community</a> to get on the board.
          </p>
        )}
        {d?.rows.map((r) => (
          <div key={r.wallet} className="card flex items-center gap-3 p-3">
            <span className={`w-7 shrink-0 text-center font-black ${r.rank <= 3 ? 'text-gold' : 'text-faint'}`}>{r.rank}</span>
            <Avatar url={r.avatarUrl} name={r.displayName || r.wallet} className="h-8 w-8 text-xs" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">{r.displayName || short(r.wallet)}</div>
              <div className="text-[11px] text-faint">Lv.{r.level}</div>
            </div>
            <div className="text-right">
              <div className="mono text-sm font-bold text-ink">{r.xp} XP</div>
              <div className="text-[11px] text-gold">{fmt(r.estimate)} ${LOOT.symbol}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-faint">
        Estimates update live and shift as people earn XP. Eligibility is checked on-chain when the
        week settles — make sure you still hold {fmt(d?.minHold ?? 500000)} ${LOOT.symbol} at that moment.
      </p>
    </div>
  );
}
