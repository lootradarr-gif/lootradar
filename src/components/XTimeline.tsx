'use client';
import { useEffect, useRef } from 'react';

// Projenin X (Twitter) zaman akışı — resmi ÜCRETSİZ embed (widgets.js). API-key yok.
// Not: X bazı hesapları/bölgeleri embed'de kısıtlayabilir; yüklenmezse alttaki link fallback kalır.
export function XTimeline({ handle }: { handle: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = window as any;
    const load = () => w.twttr?.widgets?.load(ref.current);
    if (w.twttr?.widgets) { load(); return; }
    const ID = 'twitter-wjs';
    const existing = document.getElementById(ID) as HTMLScriptElement | null;
    if (existing) { existing.addEventListener('load', load); return; }
    const s = document.createElement('script');
    s.id = ID; s.src = 'https://platform.twitter.com/widgets.js'; s.async = true;
    s.addEventListener('load', load);
    document.body.appendChild(s);
  }, [handle]);

  return (
    <div className="card overflow-hidden p-2">
      <div ref={ref} className="min-h-[200px]">
        <a className="twitter-timeline" data-theme="dark" data-height="540"
          data-chrome="noheader nofooter transparent" href={`https://twitter.com/${handle}`}>
          Tweets by @{handle}
        </a>
      </div>
      <a href={`https://x.com/${handle}`} target="_blank" rel="noopener noreferrer"
        className="mt-1 block px-2 py-1 text-center text-xs text-dim hover:text-acc">
        View @{handle} on X ↗
      </a>
    </div>
  );
}
