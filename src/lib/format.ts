// Sayı biçimleme — kripto tarzı kompakt ($1.02M, 420.3K, $0.000280).

export function compact(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
  if (a >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(Math.round(n));
}

export function usd(n: number, compactMode = true): string {
  if (compactMode && Math.abs(n) >= 1000) return '$' + compact(n);
  if (Math.abs(n) < 1) return '$' + n.toPrecision(2).replace(/0+$/, '').replace(/\.$/, '');
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

const SUB = '₀₁₂₃₄₅₆₇₈₉';
// çok küçük fiyatları DexScreener tarzı altindisle göster: 0.0000358 → $0.0₄358 (4 = ondalıktan sonraki sıfır sayısı)
function subscriptPrice(n: number): string {
  const e = Math.floor(Math.log10(n));        // 3.58e-5 → -5
  const zeros = -e - 1;                        // ondalıktan sonraki sıfır sayısı
  const sig = Math.round(n * Math.pow(10, -e + 2)).toString(); // ilk 3 anlamlı hane
  const sub = String(zeros).split('').map((d) => SUB[+d]).join('');
  return `$0.0${sub}${sig}`;
}

export function price(n: number): string {
  if (n === 0) return '$0';
  if (n < 0.0001) return subscriptPrice(n);
  if (n < 1) return '$' + n.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

export function pct(n: number): string {
  const s = n >= 0 ? '+' : '';
  return `${s}${n.toFixed(1)}%`;
}

export function timeAgo(iso: string | number): string {
  const t = typeof iso === 'number' ? iso : new Date(iso).getTime();
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function shortAddr(a: string): string {
  return a.length > 10 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a;
}
