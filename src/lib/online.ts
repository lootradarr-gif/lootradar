// Oyunun kendi "canlı oyuncu" endpoint'inden anlık sayı çekme.
// Contract basit: GET → ya düz sayı (12) ya da { online | players | count | playersOnline } içeren JSON.
// Next.js fetch cache: 60sn revalidate → endpoint'i dövmeden "anlık"a yakın. Hata/timeout → null (stored değer kalır).

// Anahtar normalize: küçük harf + harf/rakam dışını at → 'players_online'/'onlinePlayers' → aynı forma iner.
const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
// GÜÇLÜ = kesin "anlık online" alanları; ZAYIF = belirsiz (toplam olabilir) ama yaygın kullanım.
const STRONG = new Set(['online', 'playersonline', 'onlineplayers', 'ccu', 'activeplayers', 'currentplayers', 'onlinecount', 'playercount', 'liveplayers', 'concurrent', 'concurrentusers', 'onlinenow']);
const WEAK = new Set(['players', 'count', 'active', 'live', 'users']);
const MAX = 200000; // makul CCU tavanı → fiyat/timestamp/supply gibi alakasız sayıları eleme

function scalar(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX) return Math.round(v);
  if (typeof v === 'string' && /^\d{1,6}$/.test(v.trim())) { const n = Number(v.trim()); if (n <= MAX) return n; }
  return null;
}

// Nesnede önce GÜÇLÜ anahtarları (derin), sonra ZAYIF anahtarları ara. Düz sayı da kabul.
function findByKeys(v: unknown, keys: Set<string>, depth = 0): number | null {
  if (!v || typeof v !== 'object' || depth > 4) return null;
  const o = v as Record<string, unknown>;
  for (const k of Object.keys(o)) { if (keys.has(norm(k))) { const n = scalar(o[k]); if (n !== null) return n; } }
  for (const k of Object.keys(o)) { const n = findByKeys(o[k], keys, depth + 1); if (n !== null) return n; }
  return null;
}

function pickNumber(v: unknown): number | null {
  const root = scalar(v);
  if (root !== null && (typeof v === 'number' || typeof v === 'string')) return root;
  return findByKeys(v, STRONG) ?? findByKeys(v, WEAK);
}

export async function fetchOnline(url?: string | null): Promise<number | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const r = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
      headers: { accept: 'application/json, text/plain' },
    });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('json')) return pickNumber(await r.json());
    return pickNumber(await r.text());
  } catch {
    return null;
  }
}
