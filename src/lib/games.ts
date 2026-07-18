// Oyun kayıtları — ileride DB'den (Prisma) gelecek. Şimdilik seed (mock market + opsiyonel tokenAddress).
// tokenAddress DOLU ise DexScreener'dan CANLI veri gelir ve mock'un üstüne yazılır (mergeMarkets).
import { fetchMarkets, type TokenMarket } from './dexscreener';
import { prisma } from './prisma';

export type GameStatus = 'MAINNET' | 'TGE' | 'BETA' | 'PRE-TOKEN';

export interface Game {
  id: string;
  name: string;
  ticker: string;           // $TICKER (baştaki $ olmadan)
  genre: string;
  icon: string;             // emoji (iconUrl yoksa fallback)
  iconUrl?: string;         // proje logosu (http(s) veya data URL) — varsa emoji yerine gösterilir
  bannerUrl?: string;       // kart kapak/arkaplan görseli
  status: GameStatus;
  chain: string;            // 'solana'
  tokenAddress?: string;    // dolu → DexScreener canlı veri
  x?: string;               // X profil url
  site?: string;
  playersOnline: number;    // oyun kendi endpoint'inden (yoksa mock)
  holders: number;
  boosted?: boolean;        // ücretli öne çıkarma
  rating: number;           // topluluk puanı (0-100 → K formatında)
  voteCount?: number;       // community günlük oyları
  // mock market (tokenAddress yoksa gösterilir)
  m: { price: number; mcap: number; vol24h: number; change24h: number };
  desc: string;
}

// ── SEED (mock) — gerçek token adresi eklenince o satır CANLI olur ──
export const GAMES: Game[] = [
  { id: 'bombminer', name: 'BOMB Miner', ticker: 'BOMB', genre: 'mine-to-earn', icon: '💣', status: 'PRE-TOKEN', chain: 'solana', x: 'https://x.com/BombMinerSOL', site: 'https://bombminer.com', playersOnline: 307, holders: 0, boosted: true, rating: 12500, m: { price: 0, mcap: 0, vol24h: 0, change24h: 0 }, desc: 'Mine $BOMB, upgrade pickaxes, rent gear and farm the airdrop on Solana.' },
  { id: 'kintara', name: 'Kintara', ticker: 'KINS', genre: 'mmo', icon: '⚔️', status: 'MAINNET', chain: 'solana', playersOnline: 1257, holders: 4200, rating: 18500, m: { price: 0.005046, mcap: 5_010_000, vol24h: 454_800, change24h: -17.9 }, desc: 'Open-world MMO economy with player-run markets.' },
  { id: 'pawtato', name: 'Pawtato Land', ticker: 'TATO', genre: 'rpg', icon: '🥔', status: 'MAINNET', chain: 'solana', playersOnline: 715, holders: 398, rating: 50900, m: { price: 0.007447, mcap: 2_050_000, vol24h: 162, change24h: -0.7 }, desc: 'Cozy creature-collecting RPG.' },
  { id: 'afkheroes', name: 'AFK Heroes', ticker: 'AFKHERO', genre: 'idle-rpg', icon: '🛡️', status: 'MAINNET', chain: 'solana', playersOnline: 781, holders: 391, rating: 3300, m: { price: 0.000083, mcap: 79_100, vol24h: 11_900, change24h: 29.2 }, desc: 'Idle RPG — heroes farm while you’re away.' },
  { id: 'oceanhunter', name: 'Ocean Hunter', ticker: 'PEARL', genre: 'fish-shooter', icon: '🐟', status: 'MAINNET', chain: 'solana', playersOnline: 307, holders: 640, boosted: true, rating: 11400, m: { price: 0.000280, mcap: 279_700, vol24h: 39_000, change24h: 177.0 }, desc: 'Arcade fish-shooter with on-chain rewards.' },
  { id: 'clashperps', name: 'Clash of Perps', ticker: 'CLASH', genre: 'strategy', icon: '⚔️', status: 'MAINNET', chain: 'solana', playersOnline: 512, holders: 880, rating: 9200, m: { price: 0.00061, mcap: 156_000, vol24h: 41_200, change24h: 23.1 }, desc: 'Trade-and-battle strategy arena.' },
  { id: 'farmtown', name: 'FarmTown', ticker: 'FARM', genre: 'farming', icon: '🌾', status: 'MAINNET', chain: 'solana', playersOnline: 430, holders: 610, rating: 7800, m: { price: 0.00019, mcap: 99_300, vol24h: 14_100, change24h: 14.8 }, desc: 'Plant, harvest and trade in a Solana farming sim.' },
  { id: 'havens', name: 'Havens', ticker: 'HAVEN', genre: 'survival', icon: '🏝️', status: 'BETA', chain: 'solana', playersOnline: 288, holders: 240, rating: 5400, m: { price: 0.00012, mcap: 63_300, vol24h: 9_800, change24h: 51.2 }, desc: 'Build-and-survive island sandbox.' },
  { id: 'gymshowdown', name: 'Gym Showdown', ticker: 'GYM', genre: 'sports', icon: '🥊', status: 'MAINNET', chain: 'solana', playersOnline: 654, holders: 1120, rating: 14200, m: { price: 0.00048, mcap: 320_200, vol24h: 88_000, change24h: -21.7 }, desc: 'PvP fighting with wagered matches.' },
  { id: 'trenches', name: 'Trenches', ticker: 'TRENCH', genre: 'shooter', icon: '🎯', status: 'MAINNET', chain: 'solana', playersOnline: 210, holders: 330, rating: 4100, m: { price: 0.00009, mcap: 60_400, vol24h: 12_400, change24h: -19.3 }, desc: 'Top-down team shooter.' },
  { id: 'styra', name: 'Styra', ticker: 'STYRA', genre: 'tcg', icon: '🃏', status: 'BETA', chain: 'solana', playersOnline: 176, holders: 210, rating: 3900, m: { price: 0.00007, mcap: 59_600, vol24h: 6_100, change24h: -37.3 }, desc: 'On-chain trading card game.' },
  { id: 'arrr', name: 'arrr.fun', ticker: 'ARRR', genre: 'pirate', icon: '🏴‍☠️', status: 'MAINNET', chain: 'solana', playersOnline: 340, holders: 720, rating: 6600, m: { price: 0.00034, mcap: 240_500, vol24h: 55_000, change24h: -22.7 }, desc: 'Pirate raiding and loot economy.' },
];

// Canlı market verisi → oyun listesine bindir (adres varsa DexScreener kazanır).
export interface GameWithMarket extends Game {
  live: boolean;
  market: { price: number; mcap: number; vol24h: number; change24h: number };
  dexUrl: string | null;
  pairAddress: string | null;
}

// DB enum (PRE_TOKEN) → görüntü statüsü ('PRE-TOKEN')
function dbStatus(s: string): GameStatus {
  return s === 'PRE_TOKEN' ? 'PRE-TOKEN' : (s as GameStatus);
}

// CANLI KAYNAK: onaylı oyunları Neon DB'den çeker; tokenAddress varsa DexScreener canlı verisi bindirilir.
export async function getGamesWithMarkets(): Promise<GameWithMarket[]> {
  const rows = await prisma.game.findMany({
    where: { reviewStatus: 'APPROVED' },
    orderBy: [{ featured: 'desc' }, { sortWeight: 'desc' }, { createdAt: 'asc' }],
  });
  const addrs = rows.map((r) => r.tokenAddress).filter(Boolean) as string[];
  let live: Record<string, TokenMarket> = {};
  try { live = await fetchMarkets(addrs); } catch { /* dış API hatası → mock kalır */ }

  return rows.map((r) => {
    const lm = r.tokenAddress ? live[r.tokenAddress] : undefined;
    return {
      id: r.slug,
      name: r.name,
      ticker: r.ticker,
      genre: r.genre,
      icon: r.icon,
      iconUrl: r.iconUrl ?? undefined,
      bannerUrl: r.bannerUrl ?? undefined,
      status: dbStatus(r.status),
      chain: r.chain,
      tokenAddress: r.tokenAddress ?? undefined,
      x: r.x ?? undefined,
      site: r.site ?? undefined,
      playersOnline: r.playersOnline,
      holders: r.holders,
      rating: r.rating,
      voteCount: r.voteCount,
      // boost aktif mi: featured + (süresiz VEYA bitiş gelecekte)
      boosted: r.featured && (!r.featuredUntil || r.featuredUntil > new Date()),
      desc: r.desc,
      m: { price: r.mockPrice ?? 0, mcap: r.mockMcap ?? 0, vol24h: r.mockVol24h ?? 0, change24h: r.mockChange24h ?? 0 },
      live: !!lm,
      market: lm
        ? { price: lm.priceUsd, mcap: lm.marketCap, vol24h: lm.volume24h, change24h: lm.change24h }
        : { price: r.mockPrice ?? 0, mcap: r.mockMcap ?? 0, vol24h: r.mockVol24h ?? 0, change24h: r.mockChange24h ?? 0 },
      dexUrl: lm?.dexUrl ?? null,
      pairAddress: lm?.pairAddress ?? null,
    };
  });
}

// Toplam istatistikler
export function totals(games: GameWithMarket[]) {
  const mcap = games.reduce((s, g) => s + g.market.mcap, 0);
  const vol = games.reduce((s, g) => s + g.market.vol24h, 0);
  const reach = games.reduce((s, g) => s + g.rating, 0);
  return { count: games.length, mcap, vol, reach };
}
