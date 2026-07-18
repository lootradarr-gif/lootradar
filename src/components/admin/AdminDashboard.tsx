'use client';
import { useMemo, useState } from 'react';

export type AdminGame = {
  id: string; slug: string; name: string; ticker: string; genre: string; desc: string;
  icon: string; iconUrl: string | null; bannerUrl: string | null;
  status: string; tokenAddress: string | null; x: string | null; site: string | null;
  playersOnline: number; holders: number; rating: number;
  mockPrice: number | null; mockMcap: number | null; mockVol24h: number | null; mockChange24h: number | null;
  reviewStatus: string; featured: boolean; sortWeight: number;
  submitterWallet: string | null; contact: string; createdAt: string;
};
export type AdminEvent = { id: string; title: string; gameName: string; createdAt: string };
export type AdminPost = { id: string; text: string; authorName: string; authorWallet: string; likeCount: number; commentCount: number; pinned: boolean; createdAt: string };
export type AdminUser = { wallet: string; displayName: string | null; xp: number; level: number; banned: boolean };

const STATUSES = ['MAINNET', 'TGE', 'BETA', 'PRE_TOKEN'];
const badge = (t: string) =>
  t === 'APPROVED' ? 'bg-up/15 text-up' : t === 'REJECTED' ? 'bg-down/15 text-down' : 'bg-gold/15 text-gold';

export function AdminDashboard({ games: initGames, events: initEvents, posts: initPosts = [], users: initUsers = [] }: { games: AdminGame[]; events: AdminEvent[]; posts?: AdminPost[]; users?: AdminUser[] }) {
  const [games, setGames] = useState(initGames);
  const [events, setEvents] = useState(initEvents);
  const [tab, setTab] = useState<'games' | 'events' | 'posts' | 'users'>('games');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [editing, setEditing] = useState<AdminGame | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const counts = useMemo(() => ({
    total: games.length,
    pending: games.filter((g) => g.reviewStatus === 'PENDING').length,
    approved: games.filter((g) => g.reviewStatus === 'APPROVED').length,
    featured: games.filter((g) => g.featured).length,
  }), [games]);

  const shown = games.filter((g) => filter === 'ALL' || g.reviewStatus === filter);

  async function patchGame(id: string, data: Partial<AdminGame>) {
    setBusy(id);
    try {
      const r = await fetch('/api/admin39/game', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, ...data }) });
      if (!r.ok) throw new Error();
      const { game } = await r.json();
      setGames((prev) => prev.map((g) => (g.id === id ? { ...g, ...game } : g)));
      setEditing(null);
    } catch { alert('Update failed'); } finally { setBusy(null); }
  }
  async function deleteGame(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    try {
      const r = await fetch('/api/admin39/game', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!r.ok) throw new Error();
      setGames((prev) => prev.filter((g) => g.id !== id));
    } catch { alert('Delete failed'); } finally { setBusy(null); }
  }
  async function logout() { await fetch('/api/admin39/login', { method: 'DELETE' }); window.location.reload(); }

  return (
    <div className="pt-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">LootRadar Admin</h1>
          <p className="text-sm text-dim">Manage games, listings and events.</p>
        </div>
        <button onClick={logout} className="btn-ghost btn-sm">Sign out</button>
      </div>

      {/* stat chips */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total games" value={counts.total} />
        <Stat label="Pending" value={counts.pending} tone={counts.pending ? 'gold' : undefined} />
        <Stat label="Approved" value={counts.approved} />
        <Stat label="Featured" value={counts.featured} />
      </div>

      {/* tabs */}
      <div className="mb-4 flex gap-1 border-b border-line">
        {(['games', 'events', 'posts', 'users'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold capitalize ${tab === t ? 'border-acc text-ink' : 'border-transparent text-dim hover:text-ink'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'games' && (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === f ? 'bg-acc text-white' : 'bg-panel2 text-dim hover:text-ink'}`}>
                {f}{f !== 'ALL' ? ` (${games.filter((g) => g.reviewStatus === f).length})` : ''}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {shown.length === 0 && <p className="card p-6 text-center text-dim">No games here.</p>}
            {shown.map((g) => (
              <div key={g.id} className="card flex flex-wrap items-center gap-3 p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-panel2 text-lg">
                  {g.iconUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={g.iconUrl} alt="" className="h-full w-full object-cover" /> : g.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-ink">{g.name}</span>
                    <span className="mono text-xs text-faint">${g.ticker || '—'}</span>
                    {g.featured && <span className="text-xs text-gold">★</span>}
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${badge(g.reviewStatus)}`}>{g.reviewStatus}</span>
                    <span className="rounded bg-panel2 px-1.5 py-0.5 text-[10px] text-dim">{g.status}</span>
                  </div>
                  <div className="truncate text-xs text-faint">{g.genre} · {g.playersOnline.toLocaleString()} online{g.submitterWallet ? ` · by ${g.submitterWallet.slice(0, 4)}…` : ''}</div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {g.reviewStatus !== 'APPROVED' && <button disabled={busy === g.id} onClick={() => patchGame(g.id, { reviewStatus: 'APPROVED' })} className="rounded-lg bg-up/15 px-2.5 py-1 text-xs font-semibold text-up disabled:opacity-40">Approve</button>}
                  {g.reviewStatus !== 'REJECTED' && <button disabled={busy === g.id} onClick={() => patchGame(g.id, { reviewStatus: 'REJECTED' })} className="rounded-lg bg-down/10 px-2.5 py-1 text-xs font-semibold text-down disabled:opacity-40">Reject</button>}
                  <button disabled={busy === g.id} onClick={() => patchGame(g.id, { featured: !g.featured })} className={`rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-40 ${g.featured ? 'bg-gold/20 text-gold' : 'bg-panel2 text-dim'}`}>{g.featured ? '★ Featured' : 'Feature'}</button>
                  <button onClick={() => setEditing(g)} className="rounded-lg bg-panel2 px-2.5 py-1 text-xs font-semibold text-ink">Edit</button>
                  <button disabled={busy === g.id} onClick={() => deleteGame(g.id, g.name)} className="rounded-lg px-2 py-1 text-xs text-faint hover:text-down disabled:opacity-40">🗑</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'events' && <EventsPanel events={events} setEvents={setEvents} />}
      {tab === 'posts' && <PostsPanel posts={initPosts} />}
      {tab === 'users' && <UsersPanel users={initUsers} />}

      {editing && <EditGame game={editing} onClose={() => setEditing(null)} onSave={patchGame} busy={busy === editing.id} />}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'gold' }) {
  return (
    <div className="card p-3">
      <div className={`mono text-2xl font-black ${tone === 'gold' ? 'text-gold' : 'text-ink'}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-faint">{label}</div>
    </div>
  );
}

// ── OYUN DÜZENLEME MODALI ──
function EditGame({ game, onClose, onSave, busy }: { game: AdminGame; onClose: () => void; onSave: (id: string, d: Partial<AdminGame>) => void; busy: boolean }) {
  const [f, setF] = useState(game);
  const set = (k: keyof AdminGame) => (e: any) => setF({ ...f, [k]: e.target.value });
  const num = (k: keyof AdminGame) => (e: any) => setF({ ...f, [k]: e.target.value === '' ? null : Number(e.target.value) });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="card max-h-[88vh] w-full max-w-lg overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold">Edit · {game.name}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <L t="Name"><I v={f.name} onChange={set('name')} /></L>
          <L t="Ticker"><I v={f.ticker} onChange={set('ticker')} /></L>
          <L t="Genre"><I v={f.genre} onChange={set('genre')} /></L>
          <L t="Status">
            <select value={f.status} onChange={set('status')} className={inp}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </L>
          <L t="Token address" full><I v={f.tokenAddress ?? ''} onChange={set('tokenAddress')} placeholder="Solana mint → live chart" /></L>
          <L t="Description" full><I v={f.desc} onChange={set('desc')} /></L>
          <L t="Website"><I v={f.site ?? ''} onChange={set('site')} /></L>
          <L t="X URL"><I v={f.x ?? ''} onChange={set('x')} /></L>
          <L t="Players online"><I type="number" v={f.playersOnline} onChange={num('playersOnline')} /></L>
          <L t="Holders"><I type="number" v={f.holders} onChange={num('holders')} /></L>
          <L t="Rating"><I type="number" v={f.rating} onChange={num('rating')} /></L>
          <L t="Sort weight"><I type="number" v={f.sortWeight} onChange={num('sortWeight')} /></L>
          <L t="Mock price"><I type="number" v={f.mockPrice ?? ''} onChange={num('mockPrice')} /></L>
          <L t="Mock mcap"><I type="number" v={f.mockMcap ?? ''} onChange={num('mockMcap')} /></L>
          <L t="Mock vol 24h"><I type="number" v={f.mockVol24h ?? ''} onChange={num('mockVol24h')} /></L>
          <L t="Mock 24h %"><I type="number" v={f.mockChange24h ?? ''} onChange={num('mockChange24h')} /></L>
          <L t="Icon URL" full><I v={f.iconUrl ?? ''} onChange={set('iconUrl')} placeholder="http(s) or leave blank" /></L>
          <L t="Banner URL" full><I v={f.bannerUrl ?? ''} onChange={set('bannerUrl')} placeholder="http(s) or leave blank" /></L>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost btn-sm">Cancel</button>
          <button disabled={busy} onClick={() => onSave(game.id, f)} className="btn-primary btn-sm disabled:opacity-60">{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  );
}

const inp = 'w-full rounded-lg border border-line bg-panel px-2.5 py-1.5 text-sm text-ink outline-none focus:border-acc';
function I({ v, onChange, type = 'text', placeholder }: { v: any; onChange: any; type?: string; placeholder?: string }) {
  return <input type={type} value={v} onChange={onChange} placeholder={placeholder} className={inp} />;
}
function L({ t, children, full }: { t: string; children: React.ReactNode; full?: boolean }) {
  return <label className={`block ${full ? 'sm:col-span-2' : ''}`}><span className="mb-1 block text-[11px] uppercase tracking-wide text-faint">{t}</span>{children}</label>;
}

// ── EVENTS ──
function EventsPanel({ events, setEvents }: { events: AdminEvent[]; setEvents: (f: (e: AdminEvent[]) => AdminEvent[]) => void }) {
  const [title, setTitle] = useState('');
  const [gameName, setGameName] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const r = await fetch('/api/admin39/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, gameName }) });
      const { event } = await r.json();
      setEvents((prev) => [event, ...prev]);
      setTitle(''); setGameName('');
    } catch { alert('Failed'); } finally { setBusy(false); }
  }
  async function del(id: string) {
    await fetch('/api/admin39/event', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="card flex flex-wrap items-end gap-2 p-4">
        <label className="flex-1"><span className="mb-1 block text-[11px] uppercase tracking-wide text-faint">Event title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. $PEARL TGE is live" className={inp} /></label>
        <label className="w-40"><span className="mb-1 block text-[11px] uppercase tracking-wide text-faint">Game (optional)</span>
          <input value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="Ocean Hunter" className={inp} /></label>
        <button disabled={busy} className="btn-primary btn-sm disabled:opacity-60">Add</button>
      </form>
      <div className="space-y-2">
        {events.length === 0 && <p className="card p-6 text-center text-dim">No events yet.</p>}
        {events.map((ev) => (
          <div key={ev.id} className="card flex items-center gap-3 p-3">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-acc" />
            <div className="min-w-0 flex-1"><div className="truncate text-sm text-ink">{ev.title}</div><div className="text-xs text-faint">{ev.gameName || '—'}</div></div>
            <button onClick={() => del(ev.id)} className="text-xs text-faint hover:text-down">🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── POSTS (moderasyon) ──
function PostsPanel({ posts: init }: { posts: AdminPost[] }) {
  const [posts, setPosts] = useState(init);
  async function pin(id: string, pinned: boolean) {
    const r = await fetch('/api/admin39/post', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, pinned }) });
    if (r.ok) setPosts((p) => p.map((x) => (x.id === id ? { ...x, pinned } : x)));
  }
  async function del(id: string) {
    if (!confirm('Delete this post?')) return;
    const r = await fetch('/api/admin39/post', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });
    if (r.ok) setPosts((p) => p.filter((x) => x.id !== id));
  }
  if (!posts.length) return <p className="card p-6 text-center text-dim">No posts yet.</p>;
  return (
    <div className="space-y-2">
      {posts.map((p) => (
        <div key={p.id} className="card p-3">
          <div className="flex items-center gap-2 text-xs text-faint">
            <span className="font-semibold text-ink">{p.authorName}</span>
            {p.pinned && <span className="text-gold">📌</span>}
            <span>· ♥{p.likeCount} · 💬{p.commentCount}</span>
            <div className="ml-auto flex gap-1.5">
              <button onClick={() => pin(p.id, !p.pinned)} className="rounded bg-panel2 px-2 py-1 font-semibold text-dim hover:text-ink">{p.pinned ? 'Unpin' : 'Pin'}</button>
              <button onClick={() => del(p.id)} className="rounded px-2 py-1 text-down hover:bg-down/10">Delete</button>
            </div>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">{p.text}</p>
        </div>
      ))}
    </div>
  );
}

// ── USERS ──
function UsersPanel({ users: init }: { users: AdminUser[] }) {
  const [users, setUsers] = useState(init);
  async function patch(wallet: string, body: any) {
    const r = await fetch('/api/admin39/user', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ wallet, ...body }) });
    if (r.ok) { const { user } = await r.json(); setUsers((u) => u.map((x) => (x.wallet === wallet ? { ...x, ...user } : x))); }
  }
  if (!users.length) return <p className="card p-6 text-center text-dim">No users yet.</p>;
  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div key={u.wallet} className="card flex flex-wrap items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-ink">{u.displayName || u.wallet.slice(0, 6) + '…'}</span>
              <span className="mono text-[10px] text-gold">Lv{u.level}</span>
              {u.banned && <span className="rounded bg-down/15 px-1.5 py-0.5 text-[10px] font-bold text-down">BANNED</span>}
            </div>
            <div className="mono text-xs text-faint">{u.wallet.slice(0, 10)}… · {u.xp} XP</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => patch(u.wallet, { xpDelta: 50 })} className="rounded bg-up/10 px-2 py-1 text-xs font-semibold text-up">+50 XP</button>
            <button onClick={() => patch(u.wallet, { xpDelta: -50 })} className="rounded bg-panel2 px-2 py-1 text-xs font-semibold text-dim">−50 XP</button>
            <button onClick={() => patch(u.wallet, { banned: !u.banned })} className={`rounded px-2 py-1 text-xs font-semibold ${u.banned ? 'bg-up/10 text-up' : 'bg-down/10 text-down'}`}>{u.banned ? 'Unban' : 'Ban'}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
