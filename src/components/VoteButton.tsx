'use client';
// Günlük oyun oyu (1/gün). Kayıtlı kullanıcı verir, puan + XP kazandırır.
import { useEffect, useState } from 'react';
import { useUser } from './UserProvider';

export function VoteButton({ slug, initialCount }: { slug: string; initialCount: number }) {
  const { user, signIn } = useUser();
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);

  // Canlı sayı + bugün oy verdim mi — ISR-cache'li sayfada bile gerçek voteCount gösterilir.
  useEffect(() => {
    fetch(`/api/vote?gameId=${encodeURIComponent(slug)}`).then((r) => r.json()).then((d) => {
      if (typeof d.count === 'number') setCount(d.count);
      setVoted(!!d.votedToday);
    }).catch(() => {});
  }, [user, slug]);

  async function vote() {
    if (!user) { signIn(); return; }
    if (voted || busy) return;
    setBusy(true);
    try {
      const r = await fetch('/api/vote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ gameId: slug }) });
      const d = await r.json();
      if (r.ok) { setCount(d.voteCount); setVoted(true); }
      else if (r.status === 409) setVoted(true);
      else alert(d.error || 'Vote failed');
    } finally { setBusy(false); }
  }

  return (
    <button
      onClick={vote}
      disabled={busy || voted}
      title={voted ? 'You used your daily vote' : 'Vote for this game (1 per day)'}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-default ${
        voted ? 'border-acc/40 bg-accSoft text-acc' : 'border-line bg-panel2 text-ink hover:border-acc'
      }`}
    >
      ▲ {count.toLocaleString()} {voted ? 'Voted' : 'Vote'}
    </button>
  );
}
