import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Trophy, Sparkles } from 'lucide-react';

const shortW = (w: string) => `${w.slice(0, 4)}…${w.slice(-4)}`;
const medal = ['#ffcb45', '#c8d0dc', '#e08a4b']; // altın/gümüş/bronz

// Topluluk katkı sıralaması — XP en yüksek üyeler. $LOOT airdrop kancası (yumuşak söylem).
export async function TopRadar({ limit = 20 }: { limit?: number }) {
  const users = await prisma.user.findMany({
    where: { banned: false, xp: { gt: 0 } },
    orderBy: { xp: 'desc' },
    take: limit,
    select: { wallet: true, displayName: true, avatarUrl: true, xp: true, level: true },
  });

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-line bg-panel2/40 p-4">
        <Trophy size={20} className="text-gold" />
        <div className="flex-1">
          <h2 className="font-bold">Top Radar</h2>
          <p className="text-xs text-faint">Most active members — post, comment & vote to climb.</p>
        </div>
      </div>

      {users.length === 0 ? (
        <p className="p-6 text-center text-sm text-dim">No contributors yet. Be the first — post or vote to earn XP.</p>
      ) : (
        <ol className="divide-y divide-line">
          {users.map((u, i) => (
            <li key={u.wallet}>
              <Link href={`/u/${u.wallet}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-panel2/40">
                <span className="w-6 shrink-0 text-center text-sm font-bold" style={{ color: medal[i] ?? 'var(--tw-text-faint, #5b6675)' }}>
                  {i + 1}
                </span>
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-panel2 text-xs font-bold text-dim">
                    {(u.displayName || u.wallet).slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{u.displayName || shortW(u.wallet)}</div>
                  <div className="text-[11px] text-faint">Level {u.level}</div>
                </div>
                <span className="mono shrink-0 text-sm font-bold text-acc">{u.xp.toLocaleString()} XP</span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <div className="flex items-start gap-2 border-t border-line bg-accSoft/30 p-3 text-xs text-dim">
        <Sparkles size={15} className="mt-0.5 shrink-0 text-acc" />
        <span>XP counts toward a future <b className="text-acc">$LOOT</b> airdrop — the most active members may be rewarded. Nothing is guaranteed; just keep contributing.</span>
      </div>
    </div>
  );
}
