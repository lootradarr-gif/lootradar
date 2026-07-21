'use client';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { shortAddr } from '@/lib/format';

const GENRES = ['mine-to-earn', 'mmo', 'rpg', 'idle-rpg', 'strategy', 'shooter', 'tcg', 'farming', 'survival', 'sports', 'casino', 'other'];

// protokol yoksa https:// ekle (t.me/x → https://t.me/x) — native URL doğrulamasını devre dışı bıraktık
const normUrl = (v: string) => { const s = (v || '').trim(); return s && !/^https?:\/\//i.test(s) ? `https://${s}` : s; };

export function SubmitForm() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [icon, setIcon] = useState('');       // data URL veya http(s) URL
  const [banner, setBanner] = useState('');   // kart kapak görseli
  const [shots, setShots] = useState<string[]>([]); // oyun-içi görseller (maks 3)
  const [onlineUrl, setOnlineUrl] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [onlineTest, setOnlineTest] = useState<{ s: 'idle' | 'loading' | 'ok' | 'err'; msg: string }>({ s: 'idle', msg: '' });
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
  const onIconFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) readImage(f, 300, setIcon, 'Icon'); };
  const onBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) readImage(f, 400, setBanner, 'Banner'); };
  const onShotFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (shots.length >= 3) { setErr('Up to 3 screenshots.'); return; }
    readImage(f, 400, (v) => setShots((s) => [...s, v].slice(0, 3)), 'Screenshot');
    e.target.value = '';
  };
  async function testOnline() {
    const u = normUrl(onlineUrl);
    if (!/^https?:\/\//i.test(u)) { setOnlineTest({ s: 'err', msg: 'Enter a valid URL.' }); return; }
    if (u !== onlineUrl) setOnlineUrl(u);
    setOnlineTest({ s: 'loading', msg: '' });
    try {
      const r = await fetch(`/api/online-check?url=${encodeURIComponent(u)}`);
      const d = await r.json();
      if (d.ok) setOnlineTest({ s: 'ok', msg: `✓ Live players: ${Number(d.online).toLocaleString()}` });
      else setOnlineTest({ s: 'err', msg: d.error || 'Could not read a count.' });
    } catch { setOnlineTest({ s: 'err', msg: 'Request failed.' }); }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!connected || !publicKey) { setErr('Connect your wallet first.'); return; }
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries()) as Record<string, string>;
    delete (body as any).iconFile; delete (body as any).bannerFile; delete (body as any).shotFile; // dosya girdilerini gövdeden çıkar
    // kendi (İngilizce) doğrulamamız — tarayıcının yerel-dil balonları yerine
    if (!body.name?.trim() || !body.site?.trim() || !body.desc?.trim() || !body.contact?.trim()) {
      setErr('Please fill in Game name, Website, Description and Contact email.'); setState('err'); return;
    }
    // URL alanlarını normalize et (protokolsüz girişleri kabul et)
    body.site = normUrl(body.site); body.x = normUrl(body.x); body.discord = normUrl(body.discord); body.telegram = normUrl(body.telegram);
    const iconV = icon.startsWith('data:') ? icon : normUrl(icon);
    const bannerV = banner.startsWith('data:') ? banner : normUrl(banner);
    setState('sending'); setErr('');
    try {
      const r = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...body, iconUrl: iconV, bannerUrl: bannerV, screenshots: shots, onlineApiUrl: normUrl(onlineUrl), platforms, submitterWallet: publicKey.toBase58() }),
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
        <p className="mt-2 text-xs text-faint">Questions? <a href="mailto:lootradarr@gmail.com" className="text-acc hover:underline">lootradarr@gmail.com</a></p>
        <div className="mt-6 flex gap-3">
          <a href="/" className="btn-primary">Back to Explore</a>
          <a href="/boost" className="btn-gold">⚡ Boost it</a>
        </div>
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
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {/* bağlı cüzdan */}
      <div className="flex items-center gap-2 rounded-xl border border-line bg-panel2/50 px-3 py-2 text-xs text-dim">
        <span className="h-1.5 w-1.5 rounded-full bg-up" /> Listing as{' '}
        <span className="mono text-ink">{publicKey ? shortAddr(publicKey.toBase58()) : ''}</span>
      </div>

      {/* BOOST bilgilendirme kartı */}
      <a href="/boost" className="flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/[0.06] p-3.5 transition-colors hover:border-gold/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/boost-3d.svg" alt="" width={40} height={40} className="h-10 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-gold">Want the top slot? Boost your game</div>
          <div className="text-xs text-dim">Listing is free. Boosting puts you in <b>Trending now</b> + the featured spot across the site — pay in SOL, live in minutes.</div>
        </div>
        <span className="shrink-0 text-gold">→</span>
      </a>

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
              type="text" value={icon.startsWith('data:') ? '' : icon} onChange={(e) => setIcon(e.target.value.trim())}
              placeholder="…or paste an image URL"
              className="w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-acc placeholder:text-faint"
            />
            <p className="text-xs text-faint">Square PNG works best · under 300KB. Shown next to your game everywhere.</p>
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
              type="text" value={banner.startsWith('data:') ? '' : banner} onChange={(e) => setBanner(e.target.value.trim())}
              placeholder="…or paste an image URL"
              className="min-w-0 flex-1 rounded-lg border border-line bg-panel2 px-3 py-1.5 text-sm text-ink outline-none focus:border-acc placeholder:text-faint"
            />
            {banner && <button type="button" onClick={() => setBanner('')} className="text-xs text-faint hover:text-down">remove</button>}
          </div>
        </div>
        <p className="mt-1 text-xs text-faint">Landscape (16:9) works best · under 400KB. No banner = a themed gradient is used.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="Game name" placeholder="Your game's name" required />
        <Field name="ticker" label="Token ticker" placeholder="TICKER (or leave blank if pre-token)" prefix="$" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Genre</Label>
          <select name="genre" required className="w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-acc">
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <Field name="tokenAddress" label="Token address (optional)" placeholder="Solana mint address" />
      </div>
      <div className="-mt-2 flex items-start gap-2 rounded-lg border border-acc/20 bg-accSoft/40 px-3 py-2 text-xs text-dim">
        <span className="text-acc">📈</span>
        <span>Paste your Solana <b>token mint address</b> and we pull everything from <b>DexScreener</b> automatically — live price, market cap, 24h volume, the <b>token logo</b>, and a <b>live chart</b> on your game page. No token yet? Leave it blank; you can add it later and the chart appears on its own.</span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="site" label="Website / play URL" placeholder="https://…" type="text" required />
        <Field name="x" label="X (Twitter) URL" placeholder="https://x.com/…" type="text" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="discord" label="Discord (optional)" placeholder="https://discord.gg/…" type="text" />
        <Field name="telegram" label="Telegram (optional)" placeholder="https://t.me/…" type="text" />
      </div>

      <div>
        <Label>Platforms <span className="text-faint">(optional)</span></Label>
        <div className="flex flex-wrap gap-2">
          {['Web', 'iOS', 'Android', 'Windows', 'Mac'].map((p) => {
            const on = platforms.includes(p);
            return (
              <button key={p} type="button"
                onClick={() => setPlatforms((s) => on ? s.filter((x) => x !== p) : [...s, p])}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${on ? 'border-acc bg-accSoft text-acc' : 'border-line bg-panel2 text-dim hover:text-ink'}`}>
                {on ? '✓ ' : ''}{p}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Short description</Label>
        <textarea name="desc" required rows={2} maxLength={180} placeholder="One line on what makes your game worth playing."
          className="w-full resize-none rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-acc" />
      </div>

      {/* Overview / About — detay sayfası Overview sekmesinde görünür */}
      <div>
        <Label>Overview / About <span className="text-faint">(optional)</span></Label>
        <textarea name="about" rows={4} maxLength={1200} placeholder="Tell players about your game — the world, how it plays, how earning works, what makes it different. Shown on your game's Overview tab."
          className="w-full resize-none rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-acc" />
      </div>

      {/* Screenshots — Overview galerisi */}
      <div>
        <Label>Screenshots <span className="text-faint">(optional, up to 3)</span></Label>
        <div className="flex flex-wrap gap-3">
          {shots.map((s, i) => (
            <div key={i} className="relative h-20 w-32 overflow-hidden rounded-lg border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => setShots((p) => p.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-xs text-white">×</button>
            </div>
          ))}
          {shots.length < 3 && (
            <label className="grid h-20 w-32 cursor-pointer place-items-center rounded-lg border border-dashed border-line bg-panel2 text-xs text-faint hover:border-acc hover:text-dim">
              + Add<input name="shotFile" type="file" accept="image/*" onChange={onShotFile} className="hidden" />
            </label>
          )}
        </div>
        <p className="mt-1 text-xs text-faint">In-game shots · under 400KB each · shown in your Overview.</p>
      </div>

      {/* Canlı oyuncu API endpoint'i + test */}
      <div>
        <Label>Live players API URL <span className="text-faint">(optional)</span></Label>
        <div className="flex flex-wrap items-center gap-2">
          <input type="text" value={onlineUrl} onChange={(e) => { setOnlineUrl(e.target.value.trim()); setOnlineTest({ s: 'idle', msg: '' }); }}
            placeholder="https://api.yourgame.xyz/online"
            className="min-w-0 flex-1 rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-acc placeholder:text-faint" />
          <button type="button" onClick={testOnline} disabled={onlineTest.s === 'loading'} className="btn-ghost btn-sm disabled:opacity-50">{onlineTest.s === 'loading' ? 'Testing…' : 'Test'}</button>
        </div>
        {onlineTest.msg && <p className={`mt-1 text-xs ${onlineTest.s === 'ok' ? 'text-up' : 'text-down'}`}>{onlineTest.msg}</p>}
        <div className="mt-2 space-y-2 rounded-lg border border-line bg-panel2/40 p-3 text-xs text-dim">
          <p className="font-semibold text-ink">How the live player count works</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Host a <b>public HTTPS GET</b> endpoint that returns your <b>current concurrent players</b>. No API key, no auth, no CORS setup — we call it from our server.</li>
            <li>Return <b>either</b> a plain number, or JSON with any of these keys: <span className="mono text-ink">online</span>, <span className="mono text-ink">players</span>, <span className="mono text-ink">playersOnline</span>, <span className="mono text-ink">count</span>, <span className="mono text-ink">active</span>, <span className="mono text-ink">ccu</span>.</li>
            <li>We poll it about <b>every 60 seconds</b> and cache the result. It should respond in <b>under ~4s</b>.</li>
            <li>Leave blank to just show a static number — you can add the endpoint later from your dashboard.</li>
          </ul>
          <div className="rounded bg-panel px-2.5 py-2 font-mono text-[11px] text-faint">
            GET https://api.yourgame.xyz/online<br />
            → <span className="text-ink">1240</span>{'   '}<span className="text-faint">// or</span>{'  '}<span className="text-ink">{'{ "online": 1240 }'}</span>
          </div>
          <p>Hit <b>Test</b> above to preview exactly what we would read from your endpoint.</p>
        </div>
      </div>

      <Field name="contact" label="Contact email" placeholder="you@game.xyz" required />

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
