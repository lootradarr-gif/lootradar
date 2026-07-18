// DexScreener — ÜCRETSİZ, API-key gerektirmez. Token adresinden anlık fiyat/mcap/volume/değişim + chart URL.
// Batch: /latest/dex/tokens/{addr1,addr2,...} (virgülle, ~30'a kadar). Her token için EN LİKİT pair seçilir.

export interface TokenMarket {
  address: string;
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  liquidityUsd: number;
  pairAddress: string | null;
  dexUrl: string | null;     // dexscreener sayfası
  imageUrl: string | null;   // token logosu (varsa)
  symbol: string | null;
}

const BASE = 'https://api.dexscreener.com/latest/dex/tokens/';

// Next.js fetch cache: 60sn revalidate → API'yi dövmeden "anlık"a yakın.
export async function fetchMarkets(addresses: string[]): Promise<Record<string, TokenMarket>> {
  const out: Record<string, TokenMarket> = {};
  const list = addresses.filter(Boolean);
  if (!list.length) return out;

  // 30'arlı gruplar
  for (let i = 0; i < list.length; i += 30) {
    const batch = list.slice(i, i + 30);
    try {
      const r = await fetch(BASE + batch.join(','), { next: { revalidate: 60 } });
      if (!r.ok) continue;
      const data = (await r.json()) as { pairs?: any[] };
      const pairs = data.pairs || [];
      // token adresi başına en yüksek likiditeli SOLANA pair (aynı adres başka zincirde de olabilir)
      for (const p of pairs) {
        if (p?.chainId && p.chainId !== 'solana') continue;
        const addr: string = p?.baseToken?.address;
        if (!addr) continue;
        const liq = Number(p?.liquidity?.usd || 0);
        const prev = out[addr];
        if (prev && prev.liquidityUsd >= liq) continue;
        out[addr] = {
          address: addr,
          priceUsd: Number(p?.priceUsd || 0),
          marketCap: Number(p?.marketCap || p?.fdv || 0),
          volume24h: Number(p?.volume?.h24 || 0),
          change24h: Number(p?.priceChange?.h24 || 0),
          liquidityUsd: liq,
          pairAddress: p?.pairAddress || null,
          dexUrl: p?.url || null,
          imageUrl: p?.info?.imageUrl || null,
          symbol: p?.baseToken?.symbol || null,
        };
      }
    } catch {
      /* ağ hatası → o batch atlanır, mock/placeholder kalır */
    }
  }
  return out;
}

// Chart embed URL — DexScreener iframe (ücretsiz). pairAddress varsa pair chart'ı, yoksa token araması.
export function chartEmbed(chain: string, pairAddress: string | null, tokenAddress?: string): string {
  const base = pairAddress
    ? `https://dexscreener.com/${chain}/${pairAddress}`
    : `https://dexscreener.com/${chain}/${tokenAddress}`;
  return `${base}?embed=1&theme=dark&info=0&trades=0`;
}
