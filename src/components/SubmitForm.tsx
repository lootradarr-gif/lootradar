'use client';
import { useState } from 'react';

const GENRES = ['mine-to-earn', 'mmo', 'rpg', 'idle-rpg', 'strategy', 'shooter', 'tcg', 'farming', 'survival', 'sports', 'casino', 'other'];
const TIERS = [
  { id: 'free', label: 'Free listing', note: '0 SOL' },
  { id: 'boost', label: 'Boost', note: '1 SOL / wk' },
  { id: 'featured', label: 'Featured', note: '3 SOL / wk' },
];

export function SubmitForm({ defaultTier = 'free' }: { defaultTier?: string }) {
  const [tier, setTier] = useState(defaultTier);
  const [icon, setIcon] = useState('');       // data URL veya http(s) URL
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [err, setErr] = useState('');

  function onIconFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setErr('Icon must be an image file.'); return; }
    if (f.size > 200 * 1024) { setErr('Icon must be under 200KB. Try a smaller PNG.'); return; }
    setErr('');
    const reader = new FileReader();
    reader.onload = () => setIcon(String(reader.result));
    reader.readAsDataURL(f);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending'); setErr('');
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    delete (body as any).iconFile; // dosya girdisini gövdeden çıkar
    try {
      const r = await fetch('/api/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, tier, iconUrl: icon }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'Submission failed');
      setState('ok');
    } catch (e: any) {
      setErr(e?.message || 'Something went wrong'); setState('err');
    }
  }

  if (state === 'ok') {
    return (
      <div className="card grid place-items-center p-12 text-center">
        <div className="text-4xl">✅</div>
        <h2 className="mt-3 text-xl font-bold">Submission received</h2>
        <p className="mt-2 max-w-sm text-sm text-dim">Thanks! We’ll review your game and add it to the board — usually within 24 hours. If you picked a paid tier, we’ll email payment instructions.</p>
        <a href="/" className="btn-primary mt-6">Back to Explore</a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* tier */}
      <div>
        <Label>Plan</Label>
        <div className="grid grid-cols-3 gap-2">
          {TIERS.map((t) => (
            <button type="button" key={t.id} onClick={() => setTier(t.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${tier === t.id ? 'border-acc bg-accSoft/40' : 'border-line bg-panel hover:border-line2'}`}>
              <div className="text-sm font-semibold text-ink">{t.label}</div>
              <div className="mono text-xs text-dim">{t.note}</div>
            </button>
          ))}
        </div>
      </div>

      {/* proje ikonu — listelerde bu logo görünür */}
      <div>
        <Label>Game icon / logo</Label>
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-panel2 text-2xl text-faint">
            {icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={icon} alt="preview" className="h-full w-full object-cover" />
            ) : (
              '🎮'
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="btn-ghost btn-sm cursor-pointer">
                Upload image
                <input name="iconFile" type="file" accept="image/*" onChange={onIconFile} className="hidden" />
              </label>
              {icon && <button type="button" onClick={() => setIcon('')} className="text-xs text-faint hover:text-down">remove</button>}
            </div>
            <input
              type="url" value={icon.startsWith('data:') ? '' : icon} onChange={(e) => setIcon(e.target.value.trim())}
              placeholder="…or paste an image URL"
              className="w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-acc placeholder:text-faint"
            />
            <p className="text-xs text-faint">Square PNG works best · under 200KB. Shown next to your game everywhere.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="Game name" placeholder="BOMB Miner" required />
        <Field name="ticker" label="Token ticker" placeholder="BOMB (or leave blank if pre-token)" prefix="$" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Genre</Label>
          <select name="genre" required className="w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-acc">
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <Field name="tokenAddress" label="Token address (optional)" placeholder="Solana mint — enables live chart" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="site" label="Website / play URL" placeholder="https://…" type="url" required />
        <Field name="x" label="X (Twitter) URL" placeholder="https://x.com/…" type="url" />
      </div>

      <div>
        <Label>Short description</Label>
        <textarea name="desc" required rows={3} maxLength={180} placeholder="One line on what makes your game worth playing."
          className="w-full resize-none rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-acc" />
      </div>

      <Field name="contact" label="Contact email" placeholder="you@game.xyz" type="email" required />

      {state === 'err' && <p className="rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-sm text-down">{err}</p>}

      <button disabled={state === 'sending'} className="btn-primary w-full disabled:opacity-60">
        {state === 'sending' ? 'Submitting…' : tier === 'free' ? 'Submit game — free' : `Submit & continue to payment (${TIERS.find((t) => t.id === tier)?.note})`}
      </button>
      <p className="text-center text-xs text-faint">Free listings are reviewed manually. Paid tiers activate after on-chain payment.</p>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-faint">{children}</label>;
}
function Field({ name, label, placeholder, type = 'text', required, prefix }: { name: string; label: string; placeholder?: string; type?: string; required?: boolean; prefix?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center rounded-xl border border-line bg-panel focus-within:border-acc">
        {prefix && <span className="pl-3 text-sm text-faint">{prefix}</span>}
        <input name={name} type={type} placeholder={placeholder} required={required}
          className="w-full bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-faint" />
      </div>
    </div>
  );
}
