import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { EVENTS as SEED_EVENTS } from '@/lib/feed';
import { timeAgo } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const dbEvents = await prisma.event.findMany({ orderBy: { createdAt: 'desc' }, take: 60 });
  const events = dbEvents.length
    ? dbEvents.map((e) => ({ id: e.id, title: e.title, game: e.gameName, at: e.createdAt.getTime() }))
    : SEED_EVENTS; // henüz admin event eklemediyse tohum göster

  return (
    <div className="mx-auto max-w-2xl pt-8">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Pulse</h1>
          <p className="mt-1 text-sm text-dim">Live events across the Solana gaming scene — launches, TGEs, milestones.</p>
        </div>
        <Link href="/community" className="btn-ghost btn-sm">Community →</Link>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-acc" />
          <h2 className="font-bold">On the wire</h2>
        </div>
        <div className="divide-y divide-line">
          {events.map((e) => (
            <div key={e.id} className="flex items-start gap-3 py-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-acc" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{e.title}</p>
                <div className="text-xs text-faint">{e.game || '—'} · {timeAgo(e.at)} ago</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-dim">
        Want to post and discuss? Head to the <Link href="/community" className="text-acc">Community</Link>.
      </p>
    </div>
  );
}
