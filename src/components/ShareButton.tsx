'use client';
import { useState } from 'react';
import { Share2, Copy, Check, Send } from 'lucide-react';

// LootRadar resmi X hesabı — paylaşım metninde mention edilir (takipçi + bildirim).
const LOOTRADAR_X = 'LootRadario';

function handleFromX(xUrl?: string): string {
  if (!xUrl) return '';
  const m = xUrl.replace(/\/+$/, '').split('/').pop()?.split('?')[0] || '';
  return m ? `@${m}` : '';
}

// X (SVG) — lucide'de marka logosu yok, inline
function XLogo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function ShareButton(props: {
  slug: string; name: string; xUrl?: string;
  priceStr: string; pctStr: string; up: boolean; players: number; noToken: boolean;
}) {
  const { slug, name, xUrl, priceStr, pctStr, up, players, noToken } = props;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://lootradar.io/game/${slug}?utm_source=share&utm_medium=x&utm_campaign=game_share`;
  const handle = handleFromX(xUrl);
  const stats = noToken
    ? `⛏️ Pre-token · 👥 ${players.toLocaleString()} playing now`
    : `💰 ${priceStr} · ${up ? '📈' : '📉'} ${pctStr} · 👥 ${players.toLocaleString()} playing now`;
  const brand = LOOTRADAR_X ? `@${LOOTRADAR_X}` : 'LootRadar';
  const text = `🎮 ${name}${handle ? ' ' + handle : ''} is live on #Solana 🛰️\n\n${stats}\n\nTracked live on ${brand} 👇`;

  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + '\n\n#GameFi #PlayToEarn')}&url=${encodeURIComponent(shareUrl)}`;
  const tgHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;

  const openWin = (href: string) => { window.open(href, '_blank', 'noopener,noreferrer'); setOpen(false); };
  const copy = async () => { try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {} };

  const item = 'flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-panel2 transition-colors';

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="btn-ghost btn-sm inline-flex items-center gap-1.5">
        <Share2 size={15} /> Share
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-panel shadow-card">
            <button onClick={() => openWin(xHref)} className={item}><XLogo /> Share on X</button>
            <button onClick={() => openWin(tgHref)} className={item}><Send size={15} /> Share on Telegram</button>
            <button onClick={copy} className={item}>{copied ? <Check size={15} className="text-up" /> : <Copy size={15} />} {copied ? 'Copied ✓' : 'Copy link'}</button>
          </div>
        </>
      )}
    </div>
  );
}
