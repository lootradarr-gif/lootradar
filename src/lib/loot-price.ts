// $LOOT canlı fiyatı + USD→LOOT çevirimi.
//
// NEDEN SABİT LOOT FİYATI YOK: token yeni çıktı ve fiyatı oynak. "Standard = 10M LOOT"
// deseydik, fiyat 3'e katlandığında boost 3 kat pahalı, yarıya düştüğünde yarı fiyat
// olurdu. Bu yüzden paketler USD'ye sabitlenir, ödenecek LOOT canlı fiyattan hesaplanır.
import { LOOT } from './token';

const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36' };
const TTL_MS = 60_000;                       // 1dk önbellek — her istekte dış API'ye gitme
let cache: { at: number; usd: number } | null = null;

/** DexScreener'dan $LOOT fiyatı (USD). Başarısızsa son bilinen değer, o da yoksa null. */
export async function lootPriceUsd(): Promise<number | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.usd;
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${LOOT.mint}`, { headers: UA, cache: 'no-store' });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    const pairs: any[] = d?.pairs || [];
    if (!pairs.length) throw new Error('no_pairs');
    // en derin havuzu baz al — sığ havuz fiyatı manipüle edilebilir
    const best = pairs.sort((a, b) => (Number(b?.liquidity?.usd || 0) - Number(a?.liquidity?.usd || 0)))[0];
    const usd = Number(best?.priceUsd || 0);
    if (!usd || !isFinite(usd)) throw new Error('bad_price');
    cache = { at: Date.now(), usd };
    return usd;
  } catch {
    return cache?.usd ?? null;               // API düşse bile son fiyatla devam et
  }
}

/** USD tutarını HAM LOOT birimine çevir (decimals uygulanmış). Fiyat yoksa null. */
export async function usdToLootRaw(usd: number): Promise<bigint | null> {
  const price = await lootPriceUsd();
  if (!price) return null;
  const tokens = usd / price;
  return BigInt(Math.floor(tokens * 10 ** LOOT.decimals));
}

/** Gösterim için: ham birim → okunabilir sayı. */
export const rawToLoot = (raw: bigint) => Number(raw) / 10 ** LOOT.decimals;
