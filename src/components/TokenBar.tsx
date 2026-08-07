'use client';
// $LOOT duyuru şeridi — navbar'ın hemen altında, soldan sağa kayan.
//
// CA tanımlı değilse HİÇBİR ŞEY render etmez (bkz. lib/token.ts). Token çıkmadan
// önce boş/yanlış adres göstermek, göstermemekten çok daha kötü olurdu.
//
// Kayma CSS ile (`animate-ticker`, tailwind.config'de tanımlı) — JS yok, içerik
// iki kez basılıp -50% kaydırılarak kesintisiz döngü sağlanıyor.
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { LOOT, lootLive, lootLinks, shortCA } from '@/lib/token';

export function TokenBar() {
  const [copied, setCopied] = useState(false);
  if (!lootLive()) return null;
  const L = lootLinks();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(LOOT.mint);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* pano izni yok → sessiz geç */ }
  };

  const Item = () => (
    <>
      <span className="flex shrink-0 items-center gap-1.5 font-bold text-acc">
        <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-acc" />
        ${LOOT.symbol} IS LIVE
      </span>
      <span className="shrink-0 text-faint">·</span>
      <span className="shrink-0 text-dim">Hold 100K ${LOOT.symbol} to enter the weekly community pool</span>
      <span className="shrink-0 text-faint">·</span>
      <a href="/pool" className="shrink-0 -my-1.5 py-1.5 font-semibold text-gold hover:text-acc">5M ${LOOT.symbol} up for grabs this week →</a>
      <span className="shrink-0 text-faint">·</span>
      <a href={L.pump} target="_blank" rel="noreferrer" className="shrink-0 -my-1.5 py-1.5 text-ink hover:text-acc">Buy on pump.fun</a>
      <span className="shrink-0 text-faint">·</span>
      <a href={L.dex} target="_blank" rel="noreferrer" className="shrink-0 -my-1.5 py-1.5 text-ink hover:text-acc">Chart</a>
      <span className="shrink-0 text-faint">·</span>
      {LOOT.supply && <><span className="shrink-0 text-dim">Supply {(LOOT.supply / 1e9).toFixed(0)}B</span><span className="shrink-0 text-faint">·</span></>}
    </>
  );

  return (
    <div className="relative border-b border-line bg-gradient-to-r from-acc/10 via-panel/70 to-acc/10">
      <div className="flex items-center">
        {/* kayan kısım */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex w-max animate-ticker items-center gap-6 py-1.5 pl-4 text-[12px]">
            <Item /><Item />
          </div>
        </div>
        {/* CA — SABİT durur, kaymaz. Kopyalanması gereken şey kaçan bir yazı olmamalı. */}
        <button
          onClick={copy}
          title={LOOT.mint}
          className="flex shrink-0 items-center gap-1.5 border-l border-line px-3 py-1.5 font-mono text-[11px] text-dim transition-colors hover:text-acc"
        >
          <span className="hidden sm:inline text-faint">CA</span>
          <span>{shortCA(LOOT.mint)}</span>
          {copied ? <Check size={12} className="text-acc" /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  );
}
