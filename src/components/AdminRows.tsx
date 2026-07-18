'use client';
import { useState } from 'react';
import type { Submission } from '@/lib/submissions';

export function AdminRows({ rows, secret }: { rows: Submission[]; secret: string }) {
  const [items, setItems] = useState(rows);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: 'approve' | 'reject') {
    setBusy(id);
    try {
      const r = await fetch('/api/admin/submission', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ id, action }),
      });
      if (r.ok) {
        const { status } = await r.json();
        setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
      }
    } finally {
      setBusy(null);
    }
  }

  if (!items.length) return <p className="card p-8 text-center text-dim">No submissions yet.</p>;

  return (
    <div className="space-y-3">
      {items.map((s) => (
        <div key={s.id} className="card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-panel2 text-sm">
              {s.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.iconUrl} alt={s.name} className="h-full w-full object-cover" />
              ) : (
                '🎮'
              )}
            </span>
            <span className="font-semibold text-ink">{s.name}</span>
            {s.ticker && <span className="mono text-sm text-dim">${s.ticker}</span>}
            <span className="chip">{s.genre}</span>
            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${s.tier === 'free' ? 'bg-panel2 text-dim' : 'bg-gold/15 text-gold'}`}>{s.tier}</span>
            <span className={`ml-auto rounded-md px-2 py-0.5 text-xs font-semibold ${
              s.status === 'approved' ? 'bg-accSoft text-acc' : s.status === 'rejected' ? 'bg-down/15 text-down' : 'bg-panel2 text-dim'
            }`}>{s.status}</span>
          </div>
          <p className="mt-2 text-sm text-dim">{s.desc}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-faint">
            <a href={s.site} target="_blank" className="hover:text-acc">{s.site}</a>
            {s.x && <a href={s.x} target="_blank" className="hover:text-acc">X ↗</a>}
            {s.tokenAddress && <span className="mono">mint: {s.tokenAddress.slice(0, 6)}…</span>}
            <span>{s.contact}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <button disabled={busy === s.id || s.status === 'approved'} onClick={() => act(s.id, 'approve')}
              className="rounded-full bg-acc px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40">Approve</button>
            <button disabled={busy === s.id || s.status === 'rejected'} onClick={() => act(s.id, 'reject')}
              className="rounded-full border border-line bg-panel px-4 py-1.5 text-sm font-semibold text-down disabled:opacity-40">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
