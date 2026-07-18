'use client';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { shortAddr } from '@/lib/format';

const GENRES = ['mine-to-earn', 'mmo', 'rpg', 'idle-rpg', 'strategy', 'shooter', 'tcg', 'farming', 'survival', 'sports', 'casino', 'other'];

export function SubmitForm() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [icon, setIcon] = useState('');       // data URL veya http(s) URL
  const [banner, setBanner] = useState('');   // kart kapak görseli
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [err, setErr] = useState('');

  function readImage(f: File, maxKB: number, set: (v: string) => void, label: string) {
    if (!f.type.startsWith('image/')) { setErr(`${label} must be an image file.`); return; }
    if (f.size > maxKB * 1024) { setErr(`${label} must be under ${maxKB}KB. Try a smaller image.`); return; }
    setErr('');
    const reader = new FileReader();
    reader.onload = () => set(String(reader.result));
    reader.readAsDataURL(f);
  }
  const onIconFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) readImage(f, 200, setIcon, 'Icon'); };
  const onBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) readImage(f, 400, setBanner, 'Banner'); };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!connected || !publicKey) { setErr('Connect your wallet first.'); return; }
    setState('sending'); setErr('');
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    delete (body as any).iconFile; delete (body as any).bannerFile; // dosya girdilerini gövdeden çıkar
    try {
      const r = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...body, iconUrl: icon, bannerUrl: banner, submitterWallet: publicKey.toBase58() }),
      });
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
        <p className="mt-2 max-w-sm text-sm text-dim">Thanks! We’ll review your game and add it to the board — usually within 24 hours. Want the top slot? Boost your game from the Boost page once it’s live.</p>
        <a href="/" className="btn-primary mt-6">Back to Explore</a>
      </div>
    );
  }

  // Cüzdan bağlı değilse form yerine bağlanma isteği göster (giriş şartı).
  if (!connected) {
    return (
      <div className="card grid place-items-center gap-4 p-12 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accSoft text-2xl">🔗</div>
        <div>
          <h2 className="text-xl font-bold">Connect your wallet to list a game</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-dim">Your Solana wallet verifies you as the submitter. Listing is free — connecting doesn’t cost anything.</p>
        </div>
        <button onClick={() => setVisible(true)} className="btn-primary">Connect Wallet</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* bağlı cüzdan */}
      <div className="flex items-center gap-2 rounded-xl border border-line bg-panel2/50 px-3 py-2 text-xs text-dim">
        <span className="h-1.5 w-1.5 rounded-full bg-up" /> Listing as{' '}
        <span className="mono text-ink">{publicKey ? shortAddr(publicKey.toBase58()) : ''}</span>
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

      {/* kart kapak/banner görseli — kartın arkaplanında görünür */}
      <div>
        <Label>Card banner <span className="text-faint">(optional)</span></Label>
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="relative grid h-32 w-full place-items-center bg-panel2 text-sm text-faint">
            {banner ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banner} alt="banner preview" className="h-full w-full object-cover" />
            ) : (
              'A wide screenshot / key art — this is the card background'
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-line bg-panel p-2">
            <label className="btn-ghost btn-sm cursor-pointer">
              Upload banner
              <input name="bannerFile" type="file" accept="image/*" onChange={onBannerFile} className="hidden" />
            </label>
            <input
              type="url" value={banner.startsWith('data:') ? '' : banner} onChange={(e) => setBanner(e.target.value.trim())}
              placeholder="…or paste an image URL"
              className="min-w-0 flex-1 rounded-lg border border-line bg-panel2 px-3 py-1.5 text-sm text-ink outline-none focus:border-acc placeholder:text-faint"
            />
            {banner && <button type="button" onClick={() => setBanner('')} className="text-xs text-faint hover:text-down">remove</button>}
          </div>
        </div>
        <p className="mt-1 text-xs text-faint">Landscape (16:9) works best · under 400KB. No banner = a themed gradient is used.</p>
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
        {state === 'sending' ? 'Submitting…' : 'Submit game — free'}
      </button>
      <p className="text-center text-xs text-faint">Listings are free and reviewed manually. Boosting for the top slot is separate.</p>
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
