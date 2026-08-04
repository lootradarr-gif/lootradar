'use client';
// X HESABI + PAYLAŞIM XP'Sİ — profil sayfasının sahibine görünen panel.
//
// İki adım: (1) hesabı bir kez bağla, (2) her paylaşımın linkini yapıştır.
// Doğrulamanın tamamı sunucuda; buradaki her şey sadece o akışı anlatıyor.
import { useCallback, useEffect, useState } from 'react';
import { Emoji } from './Emoji';

interface Share { tweetId: string; url: string; xp: number; createdAt: string }

const OFFICIAL = 'LootRadario';

export function XConnect() {
  const [handle, setHandle] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);
  const [shares, setShares] = useState<Share[]>([]);
  const [today, setToday] = useState(0);
  const [cap, setCap] = useState(2);

  const load = useCallback(() => {
    fetch('/api/x/link').then((r) => r.json()).then((d) => {
      if (d.error) return;
      setHandle(d.handle); setCode(d.code || '');
    }).catch(() => {});
    fetch('/api/x/share').then((r) => r.json()).then((d) => {
      setShares(d.shares || []); setToday(d.today || 0); setCap(d.dailyCap ?? 2);
    }).catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function submit(kind: 'link' | 'share') {
    if (!url.trim()) return;
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/x/${kind}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Verification failed');
      setMsg({ t: 'ok', s: kind === 'link' ? `Linked to @${d.handle}` : d.message });
      setUrl(''); load();
    } catch (e: any) {
      setMsg({ t: 'err', s: e?.message || 'Verification failed' });
    } finally { setBusy(false); }
  }

  async function unlink() {
    setBusy(true);
    await fetch('/api/x/link', { method: 'DELETE' }).catch(() => {});
    setHandle(null); setMsg(null); setBusy(false); load();
  }

  const linkTweet = `https://x.com/intent/post?text=${encodeURIComponent(
    `Linking my X account to LootRadar ${code}\n\nDiscover Solana games → lootradar.io`,
  )}`;
  const shareTweet = `https://x.com/intent/post?text=${encodeURIComponent(
    `I'm hunting Solana games on @${OFFICIAL} 🎮\n\nLive charts, player counts and a weekly $LOOT reward pool for the community.\n\nlootradar.io`,
  )}`;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <Emoji e="🐦" size={20} />
          <div>
            <div className="text-sm font-black text-ink">Share on X, earn XP</div>
            <div className="text-[11px] text-faint">
              {handle ? <>Linked as <span className="font-semibold text-acc">@{handle}</span></> : 'Verified posts are worth +15 XP each'}
            </div>
          </div>
        </div>
        {handle && (
          <span className="chip border-line2 text-[10px]">{today}/{cap} today</span>
        )}
      </div>

      <div className="p-4">
        {!handle ? (
          /* ── ADIM 1: hesabı bağla ── */
          <>
            <p className="text-xs text-dim">
              Post your one-time code on X so we know the account is really yours. You only do this once.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-line2 bg-panel2/60 px-3 py-2.5">
              <span className="text-[10px] uppercase tracking-wide text-faint">Your code</span>
              <span className="mono flex-1 text-base font-black tracking-[0.2em] text-gold">{code || '········'}</span>
              <button
                onClick={() => { navigator.clipboard?.writeText(code); setMsg({ t: 'ok', s: 'Code copied' }); }}
                className="btn-ghost btn-sm"
              >Copy</button>
            </div>
            <a href={linkTweet} target="_blank" rel="noreferrer" className="btn-acc-fx btn-sm mt-3 w-full">
              <Emoji e="🐦" size={15} /> Post my code on X
            </a>
          </>
        ) : (
          /* ── ADIM 2: paylaşımı doğrula ── */
          <>
            <p className="text-xs text-dim">
              Post about LootRadar mentioning <b className="text-ink">lootradar.io</b>, <b className="text-ink">@{OFFICIAL}</b> or{' '}
              <b className="text-ink">$LOOT</b>, then paste the link below.
            </p>
            <a href={shareTweet} target="_blank" rel="noreferrer" className="btn-acc-fx btn-sm mt-3 w-full">
              <Emoji e="🚀" size={15} /> Write a post on X
            </a>
          </>
        )}

        {/* link girişi — iki adımda da aynı */}
        <div className="mt-3 flex gap-2">
          <input
            value={url} onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(handle ? 'share' : 'link'); }}
            placeholder="https://x.com/you/status/…"
            className="min-w-0 flex-1 rounded-lg border border-line bg-panel px-3 py-2 text-xs text-ink outline-none focus:border-acc"
          />
          <button
            disabled={busy || !url.trim()}
            onClick={() => submit(handle ? 'share' : 'link')}
            className="btn-gold-fx btn-sm shrink-0 disabled:opacity-50"
          >
            {busy ? 'Checking…' : handle ? 'Verify' : 'Link'}
          </button>
        </div>

        {msg && (
          <p className={`mt-2 text-xs ${msg.t === 'ok' ? 'text-up' : 'text-down'}`}>
            {msg.t === 'ok' ? '✓ ' : '✕ '}{msg.s}
          </p>
        )}

        {/* geçmiş */}
        {shares.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <div className="text-[10px] uppercase tracking-wide text-faint">Recent verified posts</div>
            <div className="mt-2 space-y-1">
              {shares.map((s) => (
                <a key={s.tweetId} href={s.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-[11px] text-dim hover:text-ink">
                  <Emoji e="✅" size={13} />
                  <span className="flex-1 truncate">{new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {s.url.replace(/^https?:\/\//, '')}</span>
                  <span className={`mono shrink-0 font-bold ${s.xp > 0 ? 'text-up' : 'text-faint'}`}>+{s.xp}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {handle && (
          <button onClick={unlink} disabled={busy} className="mt-3 text-[11px] text-faint hover:text-down">
            Unlink @{handle}
          </button>
        )}
      </div>
    </div>
  );
}
