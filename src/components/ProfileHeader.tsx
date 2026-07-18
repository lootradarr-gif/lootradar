'use client';
import { useState } from 'react';
import { useUser } from './UserProvider';
import { shortAddr } from '@/lib/format';
import { levelProgress } from '@/lib/levels';

export type ProfileData = {
  wallet: string; displayName: string | null; avatarUrl: string | null; bio: string; xp: number; joined: string | null;
};

export function ProfileHeader({ profile: init, isOwner }: { profile: ProfileData; isOwner: boolean }) {
  const { setUser } = useUser();
  const [p, setP] = useState(init);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(init.displayName ?? '');
  const [bio, setBio] = useState(init.bio ?? '');
  const [avatar, setAvatar] = useState(init.avatarUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const { lv, next, cur, pct } = levelProgress(p.xp);
  const shown = p.displayName || shortAddr(p.wallet);

  function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (!f.type.startsWith('image/')) { setErr('Avatar must be an image.'); return; }
    if (f.size > 200 * 1024) { setErr('Avatar must be under 200KB.'); return; }
    setErr(''); const r = new FileReader(); r.onload = () => setAvatar(String(r.result)); r.readAsDataURL(f);
  }

  async function save() {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/profile', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ displayName: name, bio, avatarUrl: avatar }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Save failed');
      const nu = { ...p, displayName: d.user.displayName, bio: d.user.bio, avatarUrl: d.user.avatarUrl };
      setP(nu);
      setUser({ wallet: d.user.wallet, displayName: d.user.displayName, avatarUrl: d.user.avatarUrl, bio: d.user.bio, xp: d.user.xp, level: d.user.level });
      setEditing(false);
    } catch (e: any) { setErr(e?.message || 'Save failed'); } finally { setBusy(false); }
  }

  return (
    <div className="card overflow-hidden">
      <div className="h-24 w-full" style={{ background: `linear-gradient(120deg, rgb(var(--c-acc)/.35), rgb(var(--c-panel2)))` }} />
      <div className="p-5 pt-0">
        <div className="flex flex-wrap items-end gap-4">
          <span className="-mt-10 grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-panel bg-panel2 text-2xl font-bold text-dim shadow-card">
            {(editing ? avatar : p.avatarUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={editing ? avatar : (p.avatarUrl as string)} alt="" className="h-full w-full object-cover" />
            ) : (
              shown.slice(0, 1).toUpperCase()
            )}
          </span>
          <div className="min-w-0 flex-1">
            {!editing ? (
              <>
                <h1 className="truncate text-xl font-bold text-ink">{shown}</h1>
                <div className="mono text-xs text-faint">{shortAddr(p.wallet)}{p.joined ? ` · joined ${p.joined}` : ''}</div>
              </>
            ) : (
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="Display name"
                className="w-full max-w-xs rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-ink outline-none focus:border-acc" />
            )}
          </div>
          {isOwner && !editing && <button onClick={() => setEditing(true)} className="btn-ghost btn-sm">Edit profile</button>}
        </div>

        {/* level bar */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-gold">Level {lv}</span>
            <span className="mono text-faint">{p.xp} / {next} XP</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-panel2">
            <div className="h-full rounded-full bg-acc transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* bio / edit */}
        {!editing ? (
          p.bio ? <p className="mt-4 text-sm text-dim">{p.bio}</p> : isOwner ? <p className="mt-4 text-sm text-faint">Add a bio to tell the community about you.</p> : null
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="btn-ghost btn-sm cursor-pointer">Upload avatar<input type="file" accept="image/*" onChange={onAvatar} className="hidden" /></label>
              {avatar && <button type="button" onClick={() => setAvatar('')} className="text-xs text-faint hover:text-down">remove avatar</button>}
            </div>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={2} placeholder="Short bio (max 160 chars)"
              className="w-full resize-none rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-acc" />
            {err && <p className="text-sm text-down">{err}</p>}
            <div className="flex gap-2">
              <button disabled={busy} onClick={save} className="btn-primary btn-sm disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
              <button onClick={() => { setEditing(false); setName(p.displayName ?? ''); setBio(p.bio ?? ''); setAvatar(p.avatarUrl ?? ''); setErr(''); }} className="btn-ghost btn-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
