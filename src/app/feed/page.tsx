import { FEED, EVENTS } from '@/lib/feed';
import { timeAgo, shortAddr } from '@/lib/format';
import { VoteButton } from '@/components/VoteButton';

export default function FeedPage() {
  return (
    <div className="pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Feed</h1>
        <p className="mt-1 text-sm text-dim">What players and teams are saying across the Solana gaming ecosystem.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* community posts */}
        <div className="card p-5">
          <h2 className="mb-3 font-bold">Community posts</h2>
          <div className="divide-y divide-line">
            {FEED.map((p) => (
              <div key={p.id} className="flex gap-3 py-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-panel2 text-xs font-bold text-dim">{p.author.slice(0, 2)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-faint">
                    {shortAddr(p.author)}{p.game ? <> · <span className="text-acc">{p.game}</span></> : null} · {timeAgo(p.at)}
                  </div>
                  <p className="mt-1 text-sm text-ink">{p.text}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-faint">
                    <VoteButton id={p.id} votes={p.votes} />
                    <span>💬 {p.comments}</span>
                    {p.url && <a href={p.url} target="_blank" className="hover:text-acc">source ↗</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-lg border border-line bg-panel2/50 p-3 text-center text-xs text-faint">
            Posting opens once you connect a wallet — coming soon.
          </p>
        </div>

        {/* live events rail */}
        <div className="card h-fit p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-acc" />
            <h2 className="font-bold">Live events</h2>
          </div>
          <div className="divide-y divide-line">
            {EVENTS.map((e) => (
              <div key={e.id} className="flex items-start gap-3 py-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-acc" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{e.title}</p>
                  <div className="text-xs text-faint">{e.game} · {timeAgo(e.at)} ago</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
