'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useUser } from './UserProvider';
import { shortAddr } from '@/lib/format';

export function AccountButton() {
  const { user, signIn, signOut, signingIn, loading } = useUser();
  const [open, setOpen] = useState(false);

  if (loading) return <div className="h-8 w-20 animate-pulse rounded-full bg-panel2" />;

  if (!user) {
    return (
      <button onClick={signIn} disabled={signingIn} className="btn-primary btn-sm disabled:opacity-60">
        {signingIn ? 'Signing…' : 'Sign in'}
      </button>
    );
  }

  const name = user.displayName || shortAddr(user.wallet);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="btn-ghost btn-sm !px-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-panel2 text-[11px] font-bold text-dim">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            name.slice(0, 1).toUpperCase()
          )}
        </span>
        <span className="hidden max-w-[90px] truncate sm:inline">{name}</span>
        <span className="mono text-[10px] text-gold">Lv{user.level}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-line bg-panel shadow-card">
            <div className="border-b border-line px-3 py-2 text-xs">
              <div className="truncate font-semibold text-ink">{name}</div>
              <div className="mono text-faint">{user.xp} XP · Lv{user.level}</div>
            </div>
            <Link href={`/u/${user.wallet}`} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-dim hover:bg-panel2 hover:text-ink">My profile</Link>
            <button onClick={() => { setOpen(false); signOut(); }} className="block w-full px-3 py-2 text-left text-sm text-down hover:bg-panel2">Sign out</button>
          </div>
        </>
      )}
    </div>
  );
}
