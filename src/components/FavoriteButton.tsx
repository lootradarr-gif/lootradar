'use client';
import { useState } from 'react';
import { useUser } from './UserProvider';

// Oyunu favoriye ekle/çıkar (watchlist). Oturumsuzsa giriş açar.
export function FavoriteButton({ gameId, initialFav = false, compact = false }: { gameId: string; initialFav?: boolean; compact?: boolean }) {
  const { user, signIn } = useUser();
  const [fav, setFav] = useState(initialFav);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!user) { signIn(); return; }
    if (busy) return;
    setBusy(true);
    const next = !fav; setFav(next);
    try {
      const r = await fetch('/api/favorite', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ gameId }) });
      const d = await r.json();
      if (!r.ok) throw new Error();
      setFav(!!d.favorited);
    } catch { setFav(!next); } finally { setBusy(false); }
  }

  if (compact) {
    return (
      <button onClick={toggle} title={fav ? 'Remove from watchlist' : 'Add to watchlist'}
        className={`grid h-8 w-8 place-items-center rounded-lg border text-sm transition-colors ${fav ? 'border-gold/50 bg-gold/15 text-gold' : 'border-line bg-panel2 text-dim hover:text-gold'}`}>
        {fav ? '★' : '☆'}
      </button>
    );
  }
  return (
    <button onClick={toggle} disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${fav ? 'border-gold/50 bg-gold/15 text-gold' : 'border-line bg-panel2 text-ink hover:border-gold'}`}>
      {fav ? '★ Watching' : '☆ Watch'}
    </button>
  );
}
