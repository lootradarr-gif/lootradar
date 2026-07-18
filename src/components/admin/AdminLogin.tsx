'use client';
import { useState } from 'react';

export function AdminLogin() {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/admin39/login', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (!r.ok) throw new Error('Wrong password');
      window.location.reload();
    } catch {
      setErr('Wrong password'); setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm pt-24">
      <form onSubmit={submit} className="card grid gap-4 p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accSoft text-2xl">🛡️</div>
        <div>
          <h1 className="text-xl font-bold">LootRadar Admin</h1>
          <p className="mt-1 text-sm text-dim">Enter the admin password to continue.</p>
        </div>
        <input
          type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus
          placeholder="Password"
          className="rounded-xl border border-line bg-panel px-3 py-2.5 text-center text-ink outline-none focus:border-acc"
        />
        {err && <p className="text-sm text-down">{err}</p>}
        <button disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? 'Checking…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
