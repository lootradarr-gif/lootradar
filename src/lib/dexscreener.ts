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

// DexScreener /tokens çoklu-yanıtı TOPLAM ~30 pair ile sınırlı (adres sayısıyla değil).
// Token başına birkaç pair olabildiği için, çok adresi tek istekte sorunca düşük-likiditeli
// token'ların pair'leri 30-cap dışında kalıp yanıttan düşüyor → o oyun $0 görünüyor.
// Küçük gruplar (adres başına ~3 pair varsayımıyla güvenli) bu kaybı önler.
const BATCH_SIZE = 8;

// Fiyat/mcap SADECE standart quote'lu (SOL/USDC/USDT) pair'lerden güvenilir. Egzotik quote'lu
// pair'ler (ör. KINS/LIQENG, GENE/RAY) yüksek likiditeye sahip olsa da USD fiyatı YANLIŞ hesaplanır
// ($19.64, $17.15 gibi → $19B mcap). Bu yüzden pair seçiminde standart-quote HER ZAMAN öncelikli,
// sonra likidite. (Hiç standart-quote yoksa fallback: en likit egzotik.)
const STD_QUOTE = new Set(['SOL', 'WSOL', 'USDC', 'USDT']);
const pairScore = (p: any): number => {
  const liq = Number(p?.liquidity?.usd || 0);
  const std = STD_QUOTE.has(String(p?.quoteToken?.symbol || '').toUpperCase());
  return (std ? 1e15 : 0) + liq; // standart-quote her egzotiği yener; eşitse likidite
};

// Next.js fetch cache: 60sn revalidate → API'yi dövmeden "anlık"a yakın.
export async function fetchMarkets(addresses: string[]): Promise<Record<string, TokenMarket>> {
  const out: Record<string, TokenMarket> = {};
  const score: Record<string, number> = {};
  const list = addresses.filter(Boolean);
  if (!list.length) return out;

  for (let i = 0; i < list.length; i += BATCH_SIZE) {
    const batch = list.slice(i, i + BATCH_SIZE);
    try {
      const r = await fetch(BASE + batch.join(','), { next: { revalidate: 60 } });
      if (!r.ok) continue;
      const data = (await r.json()) as { pairs?: any[] };
      const pairs = data.pairs || [];
      // token adresi başına EN İYİ pair: standart-quote öncelikli, sonra likidite (yanlış USD fiyatı önlenir)
      for (const p of pairs) {
        if (p?.chainId && p.chainId !== 'solana') continue;
        const addr: string = p?.baseToken?.address;
        if (!addr) continue;
        const liq = Number(p?.liquidity?.usd || 0);
        const sc = pairScore(p);
        if (addr in score && score[addr] >= sc) continue;
        score[addr] = sc;
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
