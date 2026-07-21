// Oyunun kendi "canlı oyuncu" endpoint'inden anlık sayı çekme.
// Contract basit: GET → ya düz sayı (12) ya da { online | players | count | playersOnline } içeren JSON.
// Next.js fetch cache: 60sn revalidate → endpoint'i dövmeden "anlık"a yakın. Hata/timeout → null (stored değer kalır).

function pickNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return Math.round(v);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    for (const k of ['online', 'players', 'playersOnline', 'count', 'active', 'ccu']) {
      const n = pickNumber(o[k]);
      if (n !== null) return n;
    }
  }
  if (typeof v === 'string') {
    const n = Number(v.trim());
    if (Number.isFinite(n) && n >= 0) return Math.round(n);
  }
  return null;
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
